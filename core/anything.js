nice.registerType({
  name: 'Anything',

  description: 'Parent type for all types.',

  extend: function (...a){
    return nice.Type(...a).extends(this);
  },

  proto: {
    _isAnything: true,

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

    _notifyUp: function () {
      let p = this;
      do {
        p._notify && p._notify();
      } while (p = p._parent);
    }
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

    key: function (name, o) {
      if(name[0] !== name[0].toLowerCase())
        throw "Property name should start with lowercase letter. ";
      def(this.target.proto, name, function (...a) {
        const r = this.getResult();
        if(a.length){
          if(is.Object(a[0]))
            throw "Key must be a primitive value.";

//          r[name] = a[0];
          this.set(name, a[0])
          return this;
        } else {
          return is.Anything(o) ? o.get(r[name]) : o[r[name]];
        }
      });
      return this;
    }
  },

  types: {}
});

Object.defineProperties(nice.Anything.proto, {
  switch: { get: function() { return Switch(this); } },

  is: { get: function() {
    const f = v => is(this).equal(v);
    f.value = this;
    return create(nice.isProto, f);
  } }
});


nice.ANYTHING = Object.seal(create(nice.Anything.proto, new String('ANYTHING')));
nice.Anything.proto._type = nice.Anything;