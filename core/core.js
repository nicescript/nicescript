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
  'try': (f, ...as) => {
    try {
        return f(...as);
    } catch (e) {
      return nice.Err(e);
    }
  },

  _createItem(type, args){
    if(!type._isNiceType)
      throw('Bad type');

    const id = nice._db.push({}).lastId;
//    const id = nice._db.push({_type: type}).lastId;
    return nice._assignType(nice._db.getValue(id, 'cache'), type, args);
  },

  _assignType(item, type, args) {
    const db = this._db;

    const oldType = db.getValue(item._id, '_type');
    if(oldType === type)
      return type.setValue(item, args[0]);//TODO: what about a[1]

    item._type && item._type.killValue && item._type.killValue(item);

    db.update(item._id, '_type', type);
    Object.setPrototypeOf(item, type.proto);

    type.defaultValueBy
        && db.update(item._id, '_value', type.defaultValueBy());
    type.initChildren(item);
    args === undefined || args.length === 0
      ? type.initBy && type.initBy(item)
      : type.initBy
        ? type.initBy(item, ...args)
        : (args.length && item(...args));
    return item;
  },

  _assertItem(_parent, _name) {
    const db = this._db;
    let id = db.findKey({_parent, _name});
    if(id === null){
      db.push({ _parent, _name});
//      db.update(_parent, '_size', db.getValue(_parent, '_size') + 1);
      id = db.lastId;
    }
    return db.getValue(id, 'cache');
  },

  _getItem(id) {
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
    f._id = id;

    nice.eraseProperty(f, 'name');
    nice.eraseProperty(f, 'length');

//  TODO:
    f._notifing = false;

    Object.setPrototypeOf(f, (nice._db.data._type[id] || nice.Anything).proto);

    return f;
  },

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
    reflect.emitAndSave('type', type);
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