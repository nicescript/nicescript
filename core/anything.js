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

  extend (name, by){
    return nice.Type(name, by).extends(this);
  },

  itemArgs0: z => z._value,
  itemArgs1: (z, v) => z._setValue(v),
  itemArgsN: (z, vs) => {
    throw `${z._type.name} doesn't know what to do with ${vs.length} arguments.`;
  },

  initChildren: () => 0,

  fromValue (_value){
    return Object.assign(this(), { _value });
  },

  deserialize (v){
    const res = this();
    res._value = nice.deserialize(v);
    return res;
  },

  _isNiceType: true,

  proto: {
    _isAnything: true,

    valueOf () {
      return this.hasOwnProperty('_value') ? this._value : undefined;
    },

    super (...as){
      this._type.super.initBy(this, ...as);
      return this;
    },

    apply(f){
      f(this);
      return this;
    },

    Switch (...vs) {
      const s = Switch(this, ...vs);
      return defGet(s, 'up', () => {
        s();
        return this;
      });
    },

    SwitchArg (...vs) {
      const s = Switch(this, ...vs);
      s.checkArgs = vs;
      return defGet(s, 'up', () => {
        s();
        return this;
      });
    },

    _setValue (v){
      if(v === this._value)
        return;
      this.transaction(() => {
        !this.hasOwnProperty('_oldValue') && (this._oldValue = this._value);
        this._value = v;
      });
    },
  },

  configProto: {
    extends (parent){
      const type = this.target;
      nice.isString(parent) && (parent = nice[parent]);
      expect(parent).isType();
      nice.extend(type, parent);
      return this;
    },

    about (...a) {
      this.target.description = nice.format(...a);
      return this;
    },

    ReadOnly (...a){
      const [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
      expect(f).isFunction();
      defGet(this.target.proto, name, function() {
        return f(this);
      });
      return this;
    }

  },

  types: {}
})

Anything = nice.Anything;


defGet(Anything.proto, function jsValue() { return this._value; });
defGet(Anything.proto, 'switch', function () { return Switch(this); });


nice.ANYTHING = Object.seal(create(Anything.proto, new String('ANYTHING')));
Anything.proto._type = Anything;