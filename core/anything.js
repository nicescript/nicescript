reflect.registerType({
  name: 'Anything',

  description: 'Parent type for all types.',

  extend (name, by){
    return nice.Type(name, by).extends(this);
  },

  setValue: (z, value) => {
    z._value = value;
  },

  itemArgsN: (z, vs) => {
    throw new Error(`${z._type.name} doesn't know what to do with ${vs.length} arguments.`);
  },

  fromValue (_value){
    return Object.assign(this(), { _value });
  },

  toString () {
    return this.name;
  },

  _isNiceType: true,

  partial (...as) {
    return nice.partial(this, ...as);
  },

  proto: {
    _isAnything: true,

    to (type, ...as){
      reflect.initItem(this, type, as);
      return this;
    },

    valueOf () {
      return '_value' in this ? ('' + this._value) : undefined;
    },

    toString () {
      return this._type.name + '('
        + ('_value' in this ? ('' + JSON.stringify(this._value)) : '')
        + ')';
    },

    super (...as){
      const type = this._type;
      const superType = type.super;
      superType.initBy(this, ...as);
      return this;
    },

    apply(f){
      f(this);
      return this;
    },

    try(f){
      try {
        f(this);
      } catch (e) { return nice.Err(e) }
      return this;
    },

    if(a,b,c){
      if(a)
        b(this, a);
      else if (typeof c === 'function')
        c(this, a);

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

    [Symbol.toPrimitive]() {
      return this.toString();
    }
  },

  configProto: {
    extends (parent){
      const type = this.target;
      typeof parent === 'string' && (parent = nice[parent]);
      expect(parent).isType();
      nice.extend(type, parent);
      return this;
    },

    about (...a) {
      this.target.description = nice.format(...a);
      return this;
    },

    ReadOnly (...a){
      nice.ReadOnly[this.target.name](...a);
      return this;
    },
  },

  types: {},

  static (...a) {
    const [name, v] = a.length === 2 ? a : [a[0].name, a[0]];
    def(this, name, v);
    return this;
  }
});


Anything = nice.Anything;

defGet(Anything.proto, 'switch', function () { return Switch(this); });


nice.ANYTHING = Object.seal(create(Anything.proto, new String('ANYTHING')));
Anything.proto._type = Anything;


reflect.on('type', t =>
  t.name && (Anything.proto['to' + t.name] = function (...as) {
    return reflect.initItem(this, t, as);
  })
);
