//REMOVE:
// constructor => initBy
nice = (...a) => {
  if(a.length === 0)
    return nice.Single();

  if(a.length > 1)
    return nice.Arr(...a);

  if(Array.isArray(a[0]))
    return nice.Arr(...a[0]);

  if(a[0] === null)
    return nice.Null();

  if(a[0] === undefined)
    return nice.Undefined();

  if(a[0]._type)
    return a[0];

  return nice.typeOf(a[0])(...a);
};

nice._counter = 0;


Object.defineProperty(nice, 'define', { value: (target, name, value) => {
  if(value === undefined && typeof name === 'function'){
    value = name;
    name = name.name;
  }

  if(value === undefined)
    throw 'No value';

  Object.defineProperty(target, name, { value });

  return value;
}});
def = nice.define;




def(nice, 'defineAll', (target, o) => {
  for(let i in o)
    def(target, i, o[i]);

  return target;
});
defAll = nice.defineAll;


defAll(nice, {
  TYPE_KEY: '_nt_',
  SOURCE_ERROR: 'Source error',
  LOCKED_ERROR: 'Item is closed for modification',
  curry: (f, arity = f.length) =>(...a) => a.length >= arity
      ? f(...a)
      : nice.curry((...a2) => f(...a, ...a2), arity - a.length),
  checkers: {},
  'try': (f, ...as) => {
    try {
        return f(...as);
    } catch (e) {
      return nice.Err(e);
    }
  },
//  createItem: ({ type, assign }) => {
//    type = nice.type(type);
//    const item = create(type.proto, type.creator());
//    'name' in type.proto && nice.eraseProperty(item, 'name');
//    'length' in type.proto && nice.eraseProperty(item, 'length');
//
//    assign && Object.assign(item, assign);
//    return item;
//  },


//  toItem: v => {
//    if(v === undefined)
//      return nice.Undefined();
//
//    if(v === null)
//      return nice.Null();
//
//    const type = nice.valueType(v);
//
//    if(type === nice.Box || type === nice.function)
//      return v;
//
//    return nice._newItem(type)._setResult(v);
//  },

  valueType: v => {
    const t = typeof v;
    if(v === undefined)
      return nice.Undefined;

    if(v === null)
      return nice.Null;

    if(t === 'number')
      return Number.isNaN(v) ? nice.NumberError : nice.Num;

    if(t === 'function')
      return nice.Function;

    if(t === 'string')
      return nice.Str;

    if(t === 'boolean')
      return nice.Bool;

    if(Array.isArray(v))
      return nice.Arr;

    if(v[nice.TYPE_KEY])
      return nice[v[nice.TYPE_KEY]];

    if(t === 'object')
      return nice.Obj;

    throw 'Unknown type';
  },


  defineCached: (target, ...a) => {
    const [key, f] = a.length === 2 ? a : [a[0].name, a[0]];
    Object.defineProperty(target, key, { configurable: true, get (){
      let value = f.apply(this);
      def(this, key, value);
      return value;
    }});
  },

  defineGetter: (o, ...a) => {
    const [key, get] = a.length === 2 ? a : [a[0].name, a[0]];
    return Object.defineProperty(o, key, { get, enumerable: true });
  },

  with: (o, f) => o === nice
    ? o => (f(o), o)
    : f === nice
      ? f => (f(o), o)
      : (f(o), o),

  types: {},

  registerType (type){
    const name = type.name;

    name[0] !== name[0].toUpperCase() &&
      nice.error('Please start type name with a upper case letter');

    nice.types[name] = type;
    def(nice, name, type);
    def(type.proto, '_is' + name, true);
    reflect.emitAndSave('Type', type);
  },

  _each: (o, f) => {
    if(o)
      for(let i in o)
        if(i !== nice.TYPE_KEY)
          if(nice.isStop(f(o[i], i)))
            break;
    return o;
  },

  _removeArrayValue: (a, item) => {
    for(let i = a.length; i--; ){
      a[i] === item && a.splice(i, 1);
    }
    return a;
  },

  _removeValue: (o, item) => {
    for(let i in o){
      if(o[i] === item) delete o[i];
    }
    return o;
  },

  serialize: v => {
    if(v && v._isAnything) {
      const type = v._type.name;
      v = { [nice.TYPE_KEY]: type, value: nice.serialize(v()) };
    } else {
      if(v && typeof v === 'object'){
        _each(v, (_v, k) => v[k] = nice.serialize(_v));
      }
    }
    return v;
  },

  deserialize: js => {
    const niceType = js && js[nice.TYPE_KEY];
    if(niceType){
      return nice[niceType].deserialize(js.value);
    } else if (js && typeof js === 'object'){
      _each(js, (v, k) => {
        js[k] = nice.deserialize(v);
      });
    }
    return js;
  },

  apply: (o, f) => {
    f(o);
    return o;
  }
});
defGet = nice.defineGetter;
_each = nice._each;