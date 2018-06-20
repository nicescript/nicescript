nice = (...a) => {
  if(a.length === 0)
    return nice.Obj();

  if(a.length > 1)
    return nice.Arr(...a);

  if(Array.isArray(a[0]))
    return nice.Arr(...a[0]);

  if(a[0] === null)
    return nice.NULL;

  if(a[0] === undefined)
    return nice.UNDEFINED;

  if(a[0]._type)
    return a[0];

  return nice.typeOf(a[0])(...a);
};


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
  SOURCE_ERROR: 'Source error',
  LOCKED_ERROR: 'Item is closed for modification',
  curry: (f, arity = f.length) =>(...a) => a.length >= arity
      ? f(...a)
      : nice.curry((...a2) => f(...a, ...a2), arity - a.length),
  checkers: {},
  checkFunctions: {},
  collectionReducers: {},
  itemTitle: i => i._type || i.name || (i.toString && i.toString()) || ('' + i),

  createItem: ({ type, data, assign }, ...a) => {
    type = nice.type(type);
    const item = create(type.proto, type.creator());
    'name' in type.proto && nice.eraseProperty(item, 'name');
    'length' in type.proto && nice.eraseProperty(item, 'length');

    assign && Object.assign(item, assign);
    if(data){
      item.setResult(data);
    } else {
      type.defaultValue && item.setResult(type.defaultValue(item));
      type.constructor && type.constructor(item, ...a);
    }

    return item;
  },


  fromItem: i => i._type.saveValue(i.getResult()),


  toItem: v => {
    if(v === undefined)
      return nice.UNDEFINED;

    if(v === null)
      return nice.NULL;

    const type = nice.valueType(v);

    if(type === nice.Box || type === nice.function)
      return v;

    return nice.createItem({ type, data: type.loadValue(v)});
  },


  valueType: v => {
    if(typeof v === 'number')
      return nice.Num;

    if(typeof v === 'function')
      return nice.function;

    if(typeof v === 'string')
      return nice.Str;

    if(typeof v === 'boolean')
      return nice.Bool;

    if(Array.isArray(v))
      return nice.Arr;

    if(v._nt_ && v.hasOwnProperty('_nv_'))
      return nice[v._nt_];

    if(typeof v === 'object')
      return nice.Obj;

    throw 'Unknown type';
  },


  defineCached: (target, ...a) => {
    const [key, f] = a.length === 2 ? a : [a[0].name, a[0]];
    Object.defineProperty(target, key, { configurable: true, get: function (){
      let value = f.apply(this);
      def(this, key, value);
      return value;
    }});
  },

  defineGetter: (o, n, get) => Object.defineProperty(o, n, { get, enumerable: true }),

  with: (o, f) => o === nice
    ? o => (f(o), o)
    : f === nice
      ? f => (f(o), o)
      : (f(o), o),

  types: {},

  registerType: function(type){
    const title = type.title;

    title[0] !== title[0].toUpperCase() &&
      nice.error('Please start type name with a upper case letter');

    nice.types[title] = type;
    def(nice, title, type);
    nice.emitAndSave('Type', type);
  },

  _each: (o, f) => {
    if(o)
      for(let i in o)
        if(f(o[i], i) === nice.STOP)
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

  isEnvBrowser: typeof window !== 'undefined',

  unwrap: v => is.nice(v) ? v() : v
});
defGet = nice.defineGetter;
_each = nice._each;