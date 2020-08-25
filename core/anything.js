/*
 * 1. setting new(calculated) value
 * 2. recalculate on each use when not hot?
 * 3.
 */

//TODO: empty transactions on empty values

//const proxy = new Proxy({}, {
//  get (o, k, receiver) {
//    if(k[0] === '_')
//      return undefined;
//
//    if(k === 'isPrototypeOf')
//      return Object.prototype.isPrototypeOf;
//
//    if(k === 'hasOwnProperty')
//      return Object.prototype.hasOwnProperty;
//
//    return k in receiver ? receiver[k] : nice.NotFound();
//  },
//});

nice.registerType({
  name: 'Anything',

  description: 'Parent type for all types.',

  extend (name, by){
    return nice.Type(name, by).extends(this);
  },

  itemArgs0: z => {
    return z._value;
  },

  setValue: (z, value) => {
    z._value = value;
  },

//set tearDown -> guessType -> assignType -> assignValue

  itemArgs1: (z, v) => {
    if (v && v._isAnything) {
      //TODO:0 check cellType
      //TODO:0 deside to clone or to forbid setting to mutable items
      z._type = v._type;
      z._value = nice.clone(v._value);
    } else {
      z._cellType.setPrimitive(z, v);
    }
    return z;
  },

  setPrimitive: (z, v) => {
    const t = typeof v;
    let type;

    if(v === undefined) {
      type = nice.Undefined;
    } else if(v === null) {
      type = nice.Null;
    } else if(t === 'number') {
      type = Number.isNaN(v) ? nice.NumberError : nice.Num;
    } else if(t === 'function') {
      type = nice.Func;
    } else if(t === 'string') {
      type = nice.Str;
    } else if(t === 'boolean') {
      type = nice.Bool;
    } else if(Array.isArray(v)) {
      type = nice.Arr;
    } else if(v[nice.TYPE_KEY]) {
      type = nice[v[nice.TYPE_KEY]];
    } else if(t === 'object') {
      type = nice.Obj;
    }

    if(type !== undefined) {
      if(type === z._type)
        return type.setValue(z, v);

      const cellType = z._cellType;
      if(cellType === type || cellType.isPrototypeOf(type)){
        nice._initItem(z, type, [v]);
        return z;
      }

      const cast = cellType.castFrom && cellType.castFrom[type.name];
      if(cast !== undefined){
        nice._initItem(z, type, [cast(v)]);
        return z;
      };

      z.toErr(`Can't cast`, type.name, 'to', cellType.name);
      return ;
    }

    throw 'Unknown type';
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

//  proto: Object.setPrototypeOf({
  proto: {
    _isAnything: true,

    to (type, ...as){
      nice._initItem(this, type, as);
      return this;
    },

    //TODO: forbid public names with _
//        const type = target._get('_type');
//        if(type.types[key])
//          return f.get(key);
//
//        if(type.readOnlys[key])
//          return type.readOnlys[key](f);
//
//        return target[key];

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
