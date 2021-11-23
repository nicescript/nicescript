nice.registerType({
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

//  deserialize (v){
//    const res = this();
//    res._value = nice.deserialize(v);
//    return res;
//  },

  _isNiceType: true,

  partial (...as) {
    return nice.partial(this, ...as);
  },

  proto: {
    _isAnything: true,

    to (type, ...as){
      nice._initItem(this, type, as);
      return this;
    },

    valueOf () {
      return '_value' in this ? ('' + this._value) : undefined;
    },

    toString () {
      return this._type.name + '('
        + ('_value' in this ? ('' + this._value) : '')
        + ')';
    },

    super (...as){
      const type = this._type;
      const superType = type.super;
//      ??
//      this._type = superType;
      superType.initBy(this, ...as);
//      this._type = type;
      return this;
    },

    apply(f){
      try {
        f(this);
      } catch (e) { return nice.Err(e) }
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
  t.name && def(Anything.proto, 'to' + t.name, function (...as) {
    return nice._initItem(this, t, as);
  })
);
