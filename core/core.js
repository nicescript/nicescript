nice = (...a) => {
  if(a.length === 0)
    return nice._createItem(Anything);

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

nice.reflect = {
  functions:{},
  bodies:[],
  list (name) {
    this._events[name].forEach(e => console.log(e));
  }
}

Object.defineProperty(nice, 'define', { value: (target, name, value) => {
  if(value === undefined && typeof name === 'function'){
    value = name;
    name = name.name;
  }

  if(value === undefined)
    throw new Error('No value');

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
      throw new Error('Bad type');
    if(type.hasOwnProperty('abstract'))
      throw new Error(type.name + ' is abstract type.');
    let item;

    if(type.isFunction === true){
      item = nice._newItem();
      nice._setType(item, type);
    } else {
      item = Object.create(type.proto);
      item._type = type;
      if("defaultValueBy" in type){
        item._value = type.defaultValueBy();
      };
    }

    nice._initItem(item, type, args);
    return item;
  },

  _initItem(z, type, args) {
    if(args === undefined || args.length === 0){
      type.initBy && type.initBy(z);
    } else if (type.initBy){
      type.initBy(z, ...args);
    } else {
      throw type.name + ' doesn\'t know what to do with arguments';
    }
//      :
//        ? type.initBy(z, ...args)
//        : type.setValue(z, ...args);
    return z;
  },

  _setType(item, type) {
    const proto = type.proto;
    Object.setPrototypeOf(item, proto);
    item._type = type;

//    type.defaultValueBy && (item._value = type.defaultValueBy());
    if("defaultValueBy" in type){
      item._value = type.defaultValueBy();
    };

    return item;
  },

  _newItem() {
    //change: try to cast otherwise change item type //exceptions: functions
    const f = function(...a){
      if('customCall' in f._type)
        return f._type.customCall(f, ...a);

      if(a.length === 0){
        return f._type.itemArgs0(f);
      } else if (a.length === 1){
        f._type.itemArgs1(f, a[0]);
      } else {
        f._type.itemArgsN(f, a);
      }

      return this || f;
    };

    nice.eraseProperty(f, 'name');
    nice.eraseProperty(f, 'length');

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
      return nice.Func;

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

  checkTypeName (name) {
    /^[A-Z].*/.test(name[0]) ||
      nice.error('Please start type name with a upper case letter');
  },

  registerType (type) {
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
          f(o[i], i);
//          if(nice.isStop(f(o[i], i)))
//            break;
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
  },

  //TODO: write tests
  Pipe: (...fs) => {
    fs = fs.map(f => {
      if(typeof f === 'string')
        return o => o[f];

      if(Array.isArray(f)){
        const as = f.slice(1);
        return v => f[0](v, ...as);
      }

      return f;
    });
    return function(res){
      const l = fs.length;
      for(let i = 0; i < l; i++){
        res = fs[i](res);
      }
      return res;
    };
  }
});
defGet = nice.defineGetter;
_each = nice._each;


let autoId = 0;
def(nice, 'AUTO_PREFIX', '_nn_');
def(nice, 'genereteAutoId', () => nice.AUTO_PREFIX + autoId++);

//function refreshSize(item, oldType, type){
//  const on = type && type !== NotFound;
//  const off = oldType && oldType !== NotFound;
//  const parent = item._parent;
//
//  if(on && !off){
//    parent._size = parent._size + 1;
//  } else if (off && !on){
//    parent._size = parent._size - 1;
//  }
//}

