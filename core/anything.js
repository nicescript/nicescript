defAll(nice, {
  _newItem: (type) => {
    const f = function(...a){
      if(a.length === 0){
        return f._type.itemArgs0(f);
      } else if (a.length === 1){
        f._type.itemArgs1(f, a[0]);
      } else {
        f._type.itemArgsN(f, a);
      }
      return this || f;
    };
    nice._assignType(f, type || Anything);
    f._originalType = type;
    return f;
  },

  _assignType: (item, type) => {
    create(type.proto, item);
    'name' in type.proto && nice.eraseProperty(item, 'name');
    'length' in type.proto && nice.eraseProperty(item, 'length');
  }
});


nice.registerType({
  name: 'Anything',

  description: 'Parent type for all types.',

  extend: function (...a){
    return nice.Type(...a).extends(this);
  },

  itemArgs0: z => z._value,
  itemArgs1: (z, v) => z._setValue(v),
  itemArgsN: (z, vs) => {
    throw `${z._type.name} doesn't know what to do with ${vs.length} arguments.`;
  },

  initChildren: () => 0,

  fromValue: function(_value){
    return Object.assign(this(), { _value });
  },

  proto: {
    _isAnything: true,

    valueOf: function() {
      return this.hasOwnProperty('_value') ? this._value : undefined;
    },


    apply: function(f){
      f(this);
      return this;
    },

    Switch: function (...vs) {
      const s = Switch(this, ...vs);
      return defGet(s, 'up', () => {
        s();
        return this;
      });
    },

    SwitchArg: function (...vs) {
      const s = Switch(this, ...vs);
      s.checkArgs = vs;
      return defGet(s, 'up', () => {
        s();
        return this;
      });
    },

    _setValue: function (v){
      if(v === this._value)
        return;
      this.transaction(() => {
        !this.hasOwnProperty('_oldValue') && (this._oldValue = this._value);
        this._value = v;
      });
    },
  },

  configProto: {
    extends: function(parent){
      const type = this.target;
      is.String(parent) && (parent = nice[parent]);
      expect(parent).Type();
      nice.extend(type, parent);
      return this;
    },

    about: function (...a) {
      this.target.description = nice.format(...a);
      return this;
    },

    ReadOnly: function(...a){
      const [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
      expect(f).function();
      defGet(this.target.proto, name, f);
      return this;
    }

//    key: function (name, o) {
//      if(name[0] !== name[0].toLowerCase())
//        throw "Property name should start with lowercase letter. ";
//      def(this.target.proto, name, function (...a) {
//        const r = this._getResult();
//        if(a.length){
//          if(is.Object(a[0]))
//            throw "Key must be a primitive value.";
//
//          this.set(name, a[0])
//          return this;
//        } else {
//          return is.Anything(o) ? o.get(r[name]) : o[r[name]];
//        }
//      });
//      return this;
//    }
  },

  types: {}
})

const Anything = nice.Anything;


defGet(Anything.proto, 'json', function json() { return this._value; });

Object.defineProperties(Anything.proto, {
  switch: { get: function() { return Switch(this); } },

  is: { get: function() {
    const f = v => is(this).equal(v);
    f.value = this;
    return create(nice.isProto, f);
  } }
});


nice.ANYTHING = Object.seal(create(Anything.proto, new String('ANYTHING')));
Anything.proto._type = Anything;