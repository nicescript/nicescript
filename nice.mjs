let nice;(function(){let create,Div,NotFound,Func,Test,Switch,expect,is,_each,def,defAll,defGet,Anything,Action,Mapping,Check,reflect,Err,each;
(function(){"use strict";nice = (...a) => {
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
nice._counter = 0;
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
    return z;
  },
  _setType(item, type) {
    const proto = type.proto;
    Object.setPrototypeOf(item, proto);
    item._type = type;
    if("defaultValueBy" in type){
      item._value = type.defaultValueBy();
    };
    return item;
  },
  _newItem() {
    
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
          f(o[i], i)
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
let autoId = 0;
def(nice, 'AUTO_PREFIX', '_nn_');
def(nice, 'genereteAutoId', () => nice.AUTO_PREFIX + autoId++);
})();
(function(){"use strict";const formatRe = /(%([jds%]))/g;
const formatMap = { s: String, d: Number, j: JSON.stringify };
const ID_SYMBOLS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
defAll(nice, {
  _map (o, f) {
    let res = {};
    for(let i in o)
      res[i] = f(o[i], i);
    return res;
  },
  _pick (o, a) {
    let res = {};
    for(let i in o)
      a.includes(i) && (res[i] = o[i]);
    return res;
  },
  _size (o) {
    let res = 0;
    for(let i in o)
      res++;
    return res;
  },
  orderedStringify: o => o === null
    ? 'null'
    : !nice.isObject(o)
      ? JSON.stringify(o)
      : Array.isArray(o)
        ? '[' + o.map(v => nice.orderedStringify(v)).join(',') + ']'
        : '{' + nice.reduceTo((a, key) => {
            a.push("\"" + key + '\":' + nice.orderedStringify(o[key]));
          }, [], Object.keys(o).sort()).join(',') + '}',
  objDiggDefault (o, ...a) {
    const v = a.pop(), l = a.length;
    let i = 0;
    for(;i<l;){
      if(!o || typeof(o)!=='object')
          return;
      if(!o[a[i]])
        o[a[i]] = i==l-1 ? v : {};
      o = o[a[i++]];
    };
    return o;
  },
  objDiggMin (o, ...a) {
    const n = a.pop();
    const k = a.pop();
    a.push({});
    const tale = nice.objDiggDefault(o, ...a);
    (!tale[k] || tale[k] > n) && (tale[k] = n);
    return tale[k];
  },
  objDiggMax (o, ...a) {
    const n = a.pop();
    const k = a.pop();
    a.push({});
    const tale = nice.objDiggDefault(o, ...a);
    (!tale[k] || tale[k] < n) && (tale[k] = n);
    return tale[k];
  },
  objMax (...oo) {
    return nice.reduceTo((res, o) => {
      _each(o, (v, k) => {
        (res[k] || 0) < v && (res[k] = v);
      });
    }, {}, oo);
  },
  objByKeys: (keys, value = 1) => nice.with({}, o =>
    keys.forEach(k => o[k] = value)),
  eraseProperty: (o, k) => {
    Object.defineProperty(o, k, { writable: true, configurable: true }) && delete o[k];
  },
  rewriteProperty: (o, k, v) => {
    nice.eraseProperty(o, k);
    def(o, 'name', v);
  },
  stripFunction: f => {
    nice.eraseProperty(f, 'length');
    nice.eraseProperty(f, 'name');
    return f;
  },
  stringCutBegining: (c, s) => s.indexOf(c) === 0 ? s.substr(c.length) : s,
  seconds: () => Date.now() / 1000 | 0,
  minutes: () => Date.now() / 60000 | 0,
  speedTest (f, times = 1) {
    const start = Date.now();
    let i = 0;
    while(i++ < times) f();
    const res = Date.now() - start
    console.log('Test took', res, 'ms');
    return res;
  },
  generateId () {
    let left = 25;
    let a = [Math.random() * 8 | 0];
    while(left--){
      a.push(ID_SYMBOLS[(Math.random() * 32 | 0)]);
    }
    return a.join('');
  },
  parseTraceString (s) {
    const a = s.match(/\/(.*):(\d+):(\d+)/);
    return { location: '/' + a[1], line: +a[2], symbol: +a[3]};
  },
});
create = nice.create = (proto, o) => Object.setPrototypeOf(o || {}, proto);
nice._eachEach = (o, f) => {
  for (let i in o)
    for (let ii in o[i])
      if(f(o[i][ii], ii, i, o) === null)
        return;
};
defAll(nice, {
  format (t, ...a) {
    t = t ? '' + t : '';
    if(a.length === 0)
      return t;
    a.unshift(t.replace(formatRe, (match, ptn, flag) =>
        flag === '%' ? '%' : formatMap[flag](a.shift())));
    return a.join(' ');
  },
  objectComparer (o1, o2, add, del) {
    _each(o2, (v, k) => o1[k] === v || add(v, k));
    _each(o1, (v, k) => o2[k] === v || del(v, k));
  },
  mapper: f => {
    if(typeof f === 'string'){
      const k = f;
      f = v => typeof v[k] === 'function' ? v[k]() : v[k];
    }
    return f || (v => v);
  },
  clone: o => {
    let res;
    if(o && o._isAnything){
      res = o._type();
      res._result = nice.clone(o._getResult());
      return res;
    } else if(Array.isArray(o)) {
      res = [];
    } else if(nice.isObject(o)) {
      res = {};
    } else {
      return o;
    }
    for(let i in o)
      res[i] = o[i];
    return res;
  },
  cloneDeep: o => {
    let res;
    if(o && o._isSingleton){
      return o;
    } else if(o && o._isAnything) {
      res = nice._newItem(o._type);
      res._result = nice.cloneDeep(o._getResult());
      return res;
    } else if(Array.isArray(o)) {
      res = [];
    } else if(nice.isObject(o)) {
      res = {};
    } else {
      return o;
    }
    for(let i in o)
      res[i] = nice.cloneDeep(o[i]);
    return res;
  },
  diff (a, b) {
    if(a === b)
      return false;
    let del, add;
    const ab = calculateChanges(a, b);
    (!nice.isNothing(ab) && nice.isEmpty(ab)) || (add = ab);
    const ba = calculateChanges(b, a);
    (!nice.isNothing(ba) && nice.isEmpty(ba)) || (del = ba);
    return (add || del) ? { del, add } : false;
  },
  memoize: f => {
    const res = (k, ...a) => {
      if(k in res.cache)
        return res.cache[k];
      return res.cache[k] = f(k, ...a);
    };
    res.cache = {};
    return res;
  },
  once: f => {
    let resultCalled = false;
    let result;
    return function() {
      if(resultCalled)
        return result;
      resultCalled = true;
      return result = f.apply(this);
    };
  },
  argumentNames (f) {
    const s = '' + f;
    const a = s.split('=>');
    if(a.length > 1 && !a[0].includes('(')){
      const s = a[0].trim();
      if(/^[$A-Z_][0-9A-Z_$]*$/i.test(s))
        return [s];
    }
    let depth = 0;
    let lastEnd = 0;
    const res = [];
    for(let k in s) {
      const v = s[k];
      k = +k;
      if(v === '(') {
        depth++;
        depth === 1 && (lastEnd = k);
      } else if (v === ','){
        if(depth === 1){
          res.push(s.substring(lastEnd + 1, k).trim());
          lastEnd = k;
        }
      } else if( v === ')' ){
        depth--;
        if(depth === 0) {
          res.push(s.substring(lastEnd + 1, k).trim());
          break;
        }
      }
    };
    return res;
  }
});
defAll(nice, {
  super (o, name, v) {
    v = v || o[name];
    const parent = Object.getPrototypeOf(o);
    if(parent && parent[name]){
      return v === parent[name]
        ? nice.super(parent, name, v)
        : parent[name];
    }
  },
  prototypes: o => {
    const res = [];
    let parent = o;
    while(parent = Object.getPrototypeOf(parent))
      res.push(parent);
    return res;
  },
  keyPosition: (c, k) => typeof k === 'number' ? k : Object.keys(c).indexOf(k),
  _capitalize: s => s[0].toUpperCase() + s.substr(1),
  _decapitalize: s => s[0].toLowerCase() + s.substr(1),
  times: (n, f, payload) => {
    n = n > 0 ? n : 0;
    let i = 0;
    while(i < n){
      f(i++, payload);
    }
    return payload;
  },
  fromJson (v) {
    return nice.valueType(v).fromValue(v);
  }
});
function compareArrays(a, b){
  const res = {};
  let ia = 0, ib = 0;
  const length = b.length;
  for(; ib < length; ib++){
    if(a[ia] === b[ib]){
      ia++;
    } else {
      res[ib] = calculateChanges(a[ib], b[ib]);
    }
  }
  return res;
}
function compareObjects(a, b){
  let res;
  for(let i in b)
    if(a[i] !== b[i]){
      let change = calculateChanges(a[i], b[i]);
      if(change || change === 0 || change === ''){
        res = res || {};
        res[i] = change;
      }
    }
  return res;
}
function calculateChanges(a, b){
  if(a === undefined)
    return b;
  if(Array.isArray(b)){
    return Array.isArray(a) ? compareObjects(a, b) : b;
  } else if(nice.isObject(b)) {
    return nice.isObject(a) ? compareObjects(a, b) : b;
  } else {
    if(a !== b)
      return b;
  }
}
nice.Configurator = (o, ...a) => {
  let f = () => o;
  f.target = o;
  a.forEach(k => def(f, k, v => { o[k] = v; return f; }));
  return f;
};
})();
(function(){"use strict";nice.generateDoc = () => {
  if(nice.doc)
    return nice.doc;
  const res = { types: {}, functions: [], fs: {} };
  reflect.on('signature', s => {
    if(!s.name || s.name[0] === '_' || typeof s.name !== 'string')
      return;
    const o = {};
    o.source = '' + s.body;
    const args = nice.argumentNames(o.source || '');
    const types = s.signature.map(v => v.type.name);
    types.forEach((v,k) => args[k] = args[k] ? v + ' ' + args[k] : v);
    o.title = [s.type || 'Func', s.name, '(', args.join(', '), ')'].join(' ');
    o.description = s.description;
    
    o.type = s.type
    res.functions.push(o);
    (res.fs[s.name] = res.fs[s.name] || {})[o.title] = o;
  });
  reflect.on('type', t => {
    if(!t.name || t.name[0] === '_')
      return;
    const o = { title: t.name, properties: [] };
    'description' in t && (o.description = t.description);
    t.extends && (o.extends = t.super.name);
    res.types[t.name] = o;
  });
  reflect.on('Property', ({ type, name, targetType }) => {
    res.types[targetType.name].properties.push({ name, type: type.name });
  });
  return nice.doc = res;
};
function wrapTest(s) {
  const { intersperse, argumentNames } = nice;
  return t => {
    let a = t.body.toString().split('\n').slice(1,-1);
    const minOffset = a.reduce((last, s) => Math.min(last, s.match(/^([\s]+)/g)[0].length), 100);
    a = a.map(s => s.slice(minOffset));
    a.unshift(`const { expect, ${argumentNames(t.body).join(', ')} } = nice;`);
    return a.join('\n');
  };
}
})();
(function(){"use strict";def(nice, '_set', (o, ks, v) => {
  const res = o;
  if(!o)
    return;
  let l;
  if(ks.pop){
    l = ks.pop();
    let k;
    while(ks.length){
      k = ks.shift()
      o = o[k] = o[k] || {};
    }
  } else {
    l = ks;
  }
  o[l] = v;
  return res;
});
def(nice, '_get', (o, ks) => {
  if(!o)
    return;
  if(ks.pop){
    let k;
    while(o !== undefined && ks.length){
      k = ks.shift();
      o = o[k];
    }
    return o;
  } else {
    return o[ks];
  }
});
})();
(function(){"use strict";function assertListeners(o, name){
  const listeners = '_listeners' in o && o.hasOwnProperty('_listeners')
    ? o._listeners
    : o._listeners = {};
  return listeners[name] || (listeners[name] = []);
}
function assertEvents(o, name){
  const events = '_events' in o
    ? o._events
    : o._events = {};
  return events[name] || (events[name] = []);
}
const EventEmitter = {
  on (name, f) {
    const a = assertListeners(this, name);
    if(!a.includes(f)){
      this.emit('newListener', name, f);
      a.push(f);
      const es = this._events;
      es && es[name] && es[name].forEach(v => f(...v));
    }
    return this;
  },
  onNew (name, f) {
    const a = assertListeners(this, name);
    if(!a.includes(f)){
      this.emit('newListener', name, f);
      a.push(f);
    }
    return this;
  },
  emit (name, ...a) {
    this.listeners(name).forEach(f => Function.prototype.apply.apply(f, [this, a]));
    return this;
  },
  emitAndSave (name, ...a) {
    assertEvents(this, name).push(a);
    this.listeners(name).forEach(f => f.apply(this, a));
    return this;
  },
  listeners (name) {
    const listeners = this._listeners;
    let a = (listeners && listeners[name]) || [];
    a.length && nice.prototypes(this).forEach(({_listeners:ls}) => {
      ls && ls !== this._listeners && ls[name]
          && ls[name].forEach(l => a.includes(l) || (a = a.concat(l)));
    });
    return a;
  },
  countListeners (name){
    return this._listeners
      ? this._listeners[name]
        ? this._listeners[name].length
        : 0
      : 0;
  },
  off (name, f) {
    if('_listeners' in this && this._listeners[name]){
      nice._removeArrayValue(this._listeners[name], f);
      this.emit('removeListener', name, f);
    }
    return this;
  },
  removeAllListeners (name) {
    if('_listeners' in this){
      const a = this._listeners[name];
      this._listeners[name] = [];
      a.forEach(f => this.emit('removeListener', name, f));
    }
    return this;
  }
};
nice.eventEmitter = o => defAll(o, EventEmitter);
def(nice, 'EventEmitter', EventEmitter);
def(nice, 'reflect', create(EventEmitter, {functions:{}, bodies:[]}));
reflect = nice.reflect;
})();
(function(){"use strict";nice.jsTypes = { js: { name: 'js', proto: {}, jsType: true }};
const jsHierarchy = {
  js: 'primitive,Object',
  primitive: 'String,Boolean,Number,undefined,null,Symbol',
  Object: 'Function,Date,RegExp,Array,Error,ArrayBuffer,DataView,Map,WeakMap,Set,WeakSet,Promise',
  Error: 'EvalError,RangeError,ReferenceError,SyntaxError,TypeError,UriError'
};
const jsTypesMap = {
  Object: 'Obj',
  Array: 'Arr',
  Number: 'Num',
  Boolean: 'Bool',
  String: 'Str',
  Function: 'Func',
  'undefined': 'Undefined',
  'null': 'Null'
};
nice.jsBasicTypesMap = {
  object: 'Obj',
  array: 'Arr',
  number: 'Num',
  boolean: 'Bool',
  string: 'Str',
  function: 'Func'
};
nice.typesToJsTypesMap = {
  Str: 'String',
  Num: 'Number',
  Obj: 'Object',
  Arr: 'Array',
  Bool: 'Boolean',
  Single: 'primitive',
  Func: 'Function',
}
for(let i in jsHierarchy)
  jsHierarchy[i].split(',').forEach(name => {
    const parent = nice.jsTypes[i];
    const proto = create(parent.proto);
    nice.jsTypes[name] = create(parent,
        { name,
          proto,
          _isJsType: true,
          niceType: jsTypesMap[name] });
  });
nice.jsBasicTypes = {
  object: nice.jsTypes.Object,
  array: nice.jsTypes.Array,
  number: nice.jsTypes.Number,
  boolean: nice.jsTypes.Boolean,
  string: nice.jsTypes.String,
  function: nice.jsTypes.Function,
  symbol: nice.jsTypes.Symbol
};
jsHierarchy['primitive'].split(',').forEach(name => {
  nice.jsTypes[name].primitiveName = name.toLowerCase();
});
})();
(function(){"use strict";nice.registerType({
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
      superType.initBy(this, ...as);
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
})();
(function(){"use strict";
def(nice, function extend(child, parent){
  if(parent.extensible === false)
    throw `Type ${parent.name} is not extensible.`;
  create(parent, child);
  create(parent.proto, child.proto);
  create(parent.configProto, child.configProto);
  create(parent.types, child.types);
  parent.defaultArguments && create(parent.defaultArguments, child.defaultArguments);
  reflect.emitAndSave('extension', { child, parent });
  child.super = parent;
});
defAll(nice, {
  type: t => {
    typeof t === 'string' && (t = nice[t]);
    expect(Anything.isPrototypeOf(t) || Anything === t,
      '' + t + ' is not a type').is(true);
    return t;
  },
  Type: (config = {}, by) => {
    if(typeof config === 'string'){
      if(nice.types[config])
        throw `Type "${config}" already exists`;
      config = {name: config};
    }
    nice.isObject(config)
      || nice.error("Need object for type's prototype");
    config.name = config.name || 'Type_' + (nice._counter++);
    config.types = {};
    config.proto = config.proto || {};
    config.configProto = config.configProto || {};
    config.defaultArguments = config.defaultArguments || {};
    by === undefined || (config.initBy = by);
    if(config.customCall !== undefined || config.itemArgs0 !== undefined
        || config.itemArgs1 !== undefined || config.itemArgsN !== undefined){
      config.isFunction = true;
    }
    const type = (...a) => nice._createItem(type, a);
    Object.defineProperty(type, 'name', { writable: true });
    Object.assign(type, config);
    nice.extend(type, 'extends' in config ? nice.type(config.extends) : nice.Obj);
    const cfg = create(config.configProto, nice.Configurator(type, ''));
    config.name && nice.registerType(type);
    return cfg;
  },
});
nice.typeOf = v => {
  if(v === undefined)
    return nice.Undefined;
  if(v === null)
    return nice.Null;
  if(v._type)
    return v._type;
  let primitive = typeof v;
  if(primitive !== 'object'){
    const res = nice[nice.jsBasicTypesMap[primitive]];
    if(!res)
      throw `JS type ${primitive} not supported`;
    return res;
  }
  if(Array.isArray(v))
    return nice.Arr;
  return nice.Obj;
};
nice.getType = v => {
  if(v === undefined)
    return nice.Undefined;
  if(v === null)
    return nice.Null;
  if(v && v._isAnything)
    return v._type;
  let res = typeof v;
  if(res === 'object'){
    const c = v.constructor;
    
    res = nice.jsTypes[c === Object
      ? 'Object'
      : c === Number
        ? 'Number'
        : c === String
          ? 'String'
          : c.name];
    if(!res)
      throw 'Unsupported object type ' + v.constructor.name;
    return res;
  }
  res = nice.jsBasicTypes[res];
  if(!res)
    throw 'Unsupported type ' + typeof v;
  return res;
};
defGet(Anything, 'help',  function () {
  return this.description;
});
})();
(function(){"use strict";nice.reflect.compileFunction = function compileFunction(cfg){
  const reflect = nice.reflect;
  const res = [];
  const name = cfg.name.toString();
  if(reflect.reportUse){
    res.push('this.reflect.onFunctionUse && this.reflect.onFunctionUse("' + name + '");\n');
  }
  res.push(compileStep(0, cfg.signatures, name, cfg.functionType));
  return (new Function('...args', res.join(''))).bind(nice);
};
function compileStep(step, signatures, name, functionType){
  const res = [];
  const types = Array.from(signatures.keys()).sort(compareTypes);
  types.forEach(type => {
    const f = signatures.get(type);
    if(!type.name)
      throw 'Bad type';
    const callCode = compileStep(step + 1, f, name, functionType);
    res.push('if(', getTypeCheckCode(type, 'args[' + step + ']'),'){',
        callCode, '}');
    const mirrorType = getMirrorType(type);
    if(mirrorType && !signatures.has(mirrorType)){
      res.push('if(', getTypeCheckCode(mirrorType, 'args[' + step + ']'),'){',
          getTranslatorCode(mirrorType, 'args[0]'),
          callCode, '}');
    }
  });
  if(signatures.action){
    res.push(compileCall(signatures, functionType));
  } else {
    res.push("throw `Function ", name, " do not accept ${args[", step, "]._type.name}`;");
  }
  return res.join('\n');
}
function compileCall(f, type){
  if(f.action === undefined)
    throw 'Bad function body';
  if(f.bodyId === undefined){
    f.bodyId = reflect.bodies.length;
    reflect.bodies.push(f.action);
  }
  if(type === 'Action'){
    return 'this.reflect.bodies[' + f.bodyId + '](...args);return args[0]';
  } else if ('returns' in f) {
    return `const result = this.${f.returns.name}();
    this.reflect.bodies[${f.bodyId}](result, ...args);
    return result`;
  }
  return 'return this.reflect.bodies[' + f.bodyId + '](...args);';
}
function getMirrorType (type) {
  if(type._isJsType){
    return nice[type.niceType];
  } else if (type._isNiceType){
    const jsTypeName = nice.typesToJsTypesMap[type.name];
    return jsTypeName === undefined ? null : nice.jsTypes[jsTypeName] || null;
  }
  throw 'I need type';
};
function getTranslatorCode(type, name){
  return type._isJsType
    ? name + ' = this(' + name + ');'
    : name + ' = ' + name + '();';
}
function getTypeCheckCode(type, name){
  return type._isJsType
    ? type.primitiveName
      ? 'typeof ' + name + " === '" + type.primitiveName + "'"
      : name + ' instanceof ' + type.name
    : name + '._is' + type.name;
}
function compareTypes(a, b){
  if(a._isJsType){
    if(b._isJsType){
      a.name === 'Object' ? -1 : 0;
    } else {
      return 1;
    }
  } else {
    if(b._isJsType){
      return -1;
    } else {
      return a.proto.isPrototypeOf(b.proto)
        ? 1
        : b.proto.isPrototypeOf(a.proto)
          ? -1
          : 0;
    }
  }
}
})();
(function(){"use strict";
nice.reflect.reportUse = true;
const configProto = {
  next (o) {
    const c = Configurator(this.name || o.name);
    c.signature = (this.signature || []).concat(o.signature || []);
    ['existing', 'functionType', 'returnValue', 'description', 'returns']
      .forEach(k => c[k] = o[k] || this[k]);
    return c;
  },
  about (s) { return this.next({ description: s}); },
};
const functionProto = {
  addSignature (body, types, returns){
    let ss = 'signatures' in this
      ? this.signatures
      : this.signatures = new Map();
    types && types.forEach(type => {
      if(ss.has(type)){
        ss = ss.get(type);
      } else {
        const s = new Map();
        ss.set(type, s);
        ss = s;
      }
    });
    ss.action = body;
    returns && (ss.returns = returns);
    return this;
  },
};
defGet(functionProto, 'help',  function () {
  if(!nice.doc)
    nice.doc = nice.generateDoc();
  const a = [''];
  _each(nice.doc.fs[this.name], v => {
    a.push(v.title);
    v.description && a.push(v.description);
    a.push(v.source);
    a.push('');
  });
  return a.join('\n');
});
const parseParams = (...a) => {
  if(!a[0])
    return {};
  const [name, body] = a.length === 2 ? a : [a[0].name, a[0]];
  return typeof body === 'function' ? { name, body } : a[0];
};
function toItemType({type}){
  return { type: type._isJsType ? nice[type.niceType] : type };
}
function Configurator(name){
  const z = create(configProto, (...a) => {
    const { name, body, signature } = parseParams(...a);
    const res = createFunction({
      returns: z.returns,
      description: z.description,
      type: z.functionType,
      existing: z.existing,
      name: z.name || name,
      body: body || z.body,
      signature: (z.signature || []).concat(signature || []),
    });
    return z.returnValue || res;
  });
  nice.rewriteProperty(z, 'name', name || '');
  return z;
}
function configurator(...a){
  const cfg = parseParams(...a);
  return Configurator(cfg.name).next(cfg);
};
function createFunction({ name, body, signature, type, description, returns }){
  if(!/^[a-z].*/.test(name[0]))
   throw new Error(`Function name should start with lowercase letter. "${name}" is not`);
  const reflect = nice.reflect;
  let cfg = (name && reflect.functions[name]);
  const existing = cfg;
  if(cfg && cfg.functionType !== type)
    throw `function '${name}' can't have types '${cfg.functionType}' and '${type}' at the same time`;
  if(!cfg){
    cfg = create(functionProto, { name, functionType: type });
    reflect.functions[name] = cfg;
  }
  
  const types = signature.map(v => v.type);
  returns && (body.returnType = returns);
  body && cfg.addSignature(body, types, returns);
  const f = reflect.compileFunction(cfg);
  if(name){
    
    nice[name] = f;
    if(!existing){
      reflect.emitAndSave('function', cfg);
      type && reflect.emitAndSave(type, cfg);
    }
    body && reflect.emitAndSave('signature',
      { name, body, signature, type, description });
  }
  return f;
};
nice.reflect.on('signature', s => {
  if(!Anything)
    return;
  const first = s.signature[0];
  const type = first ? first.type : Anything;
  if(!(s.name in type.proto))
    type.proto[s.name] = function(...a) { return nice[s.name](this, ...a); };
});
function signatureError(name, a){
  return `Function ${name} can't handle (${a.map(v =>
      nice.typeOf(v).name).join(',')})`;
}
function handleType(type){
  type.name === 'Something' && create(type.proto, functionProto);
  defGet(configProto, type.name, function() {
    return this.next({signature: [{type}]});
  });
  defGet(configProto, 'r' + type.name, function() {
    return this.next({returns: type});
  });
};
for(let i in nice.jsTypes) handleType(nice.jsTypes[i]);
reflect.on('type', handleType);
Func = def(nice, 'Func', configurator());
Action = def(nice, 'Action', configurator({functionType: 'Action'}));
Mapping = def(nice, 'Mapping', configurator({functionType: 'Mapping'}));
Check = def(nice, 'Check', configurator({functionType: 'Check'}));
const ro = def(nice, 'ReadOnly', {});
reflect.on('type', type => {
  ro[type.name] = function (...a) {
    const [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
    expect(f).isFunction();
    defGet(type.proto, name, function() {
      const initType = this._type;
      if(initType !== this._type){
        return this[name];
      } else {
        return f(this);
      }
    });
    
    return this;
  };
});
})();
(function(){"use strict";Test = def(nice, 'Test', (...a) => {
  const [description, body] = a.length === 2 ? a : [a[0].name, a[0]];
  const position = nice.parseTraceString(Error().stack.split('\n')[2]);
  nice.reflect.emitAndSave('test', { body, description, ...position });
});
const colors = {
  blue: s => '\x1b[34m' + s + '\x1b[0m',
  red: s => '\x1b[31m' + s + '\x1b[0m',
  green: s => '\x1b[32m' + s + '\x1b[0m',
  gray: s => '\x1b[38;5;245m' + s + '\x1b[0m'
};
def(nice, 'runTests', (key) => {
  console.log('');
  console.log(' ', colors.blue('Running tests'));
  console.log('');
  let good = 0, bad = 0, start = Date.now();
  nice.reflect.on('test', t => {
    const args = nice.argumentNames(t.body);
    if(!key || args.includes(key))
      runTest(t, args.map(n => nice[n])) ? good++ : bad++;
  });
  console.log(' ');
  console.log(colors[bad ? 'red' : 'green']
    (`Tests done. OK: ${good}, Error: ${bad}`), `(${Date.now() - start}ms)`);
  console.log('');
});
function runTest(t, args){
  try {
    t.body(...args);
    return true;
  } catch (e) {
    if(typeof e === 'string') {
      console.log(colors.red('Error while testing ' + (t.description || '')));
      console.log(t.body.toString());
      console.log(e);
    } else {
      const k = 1 + (e.shift || 0);
      const { line, symbol, location } = nice.parseTraceString(e.stack.split('\n')[k]);
      console.log(colors.red('Error while testing ' + (t.description || '')));
      const dh = line - t.line;
      const a = t.body.toString().split('\n');
      a.splice(dh + 1, 0,
        '-'.repeat(symbol - 1) + '^' + (symbol > 80 ? '' : '-'.repeat(80 - symbol)),
         e.message,
         colors.gray(location + ':' + line),
         '-'.repeat(80));
      console.log(a.join('\n'));
    }
    return false;
  }
}
})();
(function(){"use strict";['Check', 'Action', 'Mapping'].forEach(t => Check
  .about(`Checks if value is function and it's type is ${t}.`)
  ('is' + t, v => v.functionType === t));
const basicChecks = {
  is (a, b) {
    if(a === b)
      return true;
    if(a && a._isAnything && '_value' in a)
      a = a._value;
    if(b && b._isAnything  && '_value' in b)
      b = b._value;
    return a === b;
  },
  isExactly: (a, b) => a === b,
  deepEqual: (a, b) => {
    if(a === b)
      return true;
    if(a && a._isAnything && '_value' in a)
      a = a._value;
    if(b && b._isAnything  && '_value' in b)
      b = b._value;
    if(typeof a !== typeof b)
      return false;
    return nice.diff(a, b) === false;
  },
  isTrue: v => v === true,
  isFalse: v => v === false,
  isAnyOf: (v, ...vs) => vs.includes(v),
  isTruly: v => v
    ? v._isAnything
      ? v.isNothing() ? false : !!v()
      : true
    : false,
  isFalsy: v => !nice.isTruly(v),
  isEmpty: v => {
    if(nice.isNothing(v) || v === null)
      return true;
    if(v === 0 || v === '' || v === false)
      return false;
    if(Array.isArray(v))
      return !v.length;
    if(typeof v === 'object')
      return !Object.keys(v).length;
    return !v;
  },
  isSubType: (a, b) => {
    typeof a === 'string' && (a = nice.Type(a));
    typeof b === 'string' && (b = nice.Type(b));
    return a === b || b.isPrototypeOf(a);
  },
  isEnvBrowser: () => typeof window !== 'undefined',
  throws: (...as) => {
    try{
      as[0]();
    } catch(e) {
      return as.length === 1 ? true : as[1] === e;
    }
    return false;
  }
};
for(let i in basicChecks)
  Check(i, basicChecks[i]);
is = nice.is;
const basicJS = 'number,function,string,boolean,symbol'.split(',');
for(let i in nice.jsTypes){
  if(i === 'Function'){
    Check.about(`Checks if \`v\` is \`function\`.`)
      ('is' + i, v => v._isAnything
        ? v._type === nice.Func || v._type === nice.jsTypes.Function
        : typeof v === 'function');
  } else {
    const low = i.toLowerCase();
    Check.about(`Checks if \`v\` is \`${i}\`.`)
      ('is' + i, basicJS.includes(low)
      ? v => typeof v === low
      : new Function('v', `return ${i}.prototype.isPrototypeOf(v);`));
  }
};
reflect.on('type', function defineReducer(type) {
  type.name && Check
    .about('Checks if `v` has type `' + type.name + '`')
    ('is' + type.name, v => v && v._type
        ? (type === v._type || type.isPrototypeOf(v._type))
        : false);
});
const throwF = function(...as) {
  return this.use(() => {
    throw nice.format(...as);
  });
};
const common = {
  pushCheck (f){
    const postCheck = this._check;
    this._check = postCheck ? (...a) => postCheck(f(...a)) : f;
    return this;
  },
  is (v) {
    return this.check(a => is(a, v));
  },
  'throw': throwF,
};
defGet(common, 'not', function (){
  this.pushCheck(r => !r);
  return this;
});
const switchProto = create(common, {
  valueOf () { return this.res; },
  check (f) {
    this.pushCheck(f)
    const res = create(actionProto, v => {
      const z = this;
      if(!z.done && z._check(...z.args)){
        z.res = v;
        z.done = true;
      }
      z._check = null;
      return z;
    });
    res.target = this;
    return res;
  },
});
const $proto = {
  check (f) {
    return this.parent.check((...v) => f(v[this.pos]));
  },
  is (v) {
    return this.parent.check((...as) => as[this.pos] === v);
  },
};
defGet($proto, 'not', function (){
  this.parent.pushCheck(r => !r);
  return this;
});
[1,2,3,4].forEach(n => defGet(common, '_' + n, function () {
  return create($proto, {parent: this, pos: n - 1});
}));
defGet(switchProto, 'default', function () {
  const z = this;
  const res = v => z.done ? z.res : v;
  res.use = f => z.done ? z.res : f(...z.args);
  res.throw = throwF;
  return res;
});
const actionProto = {
  'throw': throwF,
  use (f) {
    const z = this.target;
    if(!z.done && z._check(...z.args)){
      z.res = f(...z.args);
      z.done = true;
    }
    z._check = null;
    return z;
  }
};
const delayedActionProto = create(actionProto, {
  use (f){
    const z = this.target;
    z.cases.push(z._check, f);
    z._check = null;
    return z;
  }
});
defGet(actionProto, 'and', function (){
  const s = this.target;
  const f = s._check;
  s._check = r => r && f(...s.args);
  return s;
});
defGet(actionProto, 'or', function (){
  const s = this.target;
  const f = s._check;
  s._check = r => r || f(...s.args);
  return s;
});
reflect.on('function', f => {
  if(f.functionType !== 'Check'){
    f.name in actionProto || def(actionProto, f.name, function(...a){
      return this.use(v => nice[f.name](v, ...a));
    });
  }
});
const delayedProto = create(common, {
  check (f) {
    this.pushCheck(f);
    const res = create(delayedActionProto, v => {
      this.cases.push(this._check, () => v);
      this._check = null;
      return this;
    });
    res.target = this;
    return res;
  }
});
defGet(delayedProto, 'default', function () {
  const z = this, res = v => { z._default = () => v; return z; };
  res.use = f => { z._default = f; return z; };
  res.throw = throwF;
  return res;
});
const S = Switch = nice.Switch = (...args) => {
  if(args.length === 0)
    return DelayedSwitch();
  const f = () => f.done ? f.res : args[0];
  f.args = args;
  f.done = false;
  return create(switchProto, f);
};
reflect.on('Check', ({name}) => name && !common[name]
  && def(common, name, function (...a) {
    return this.check((...v) => {
      try {
        return nice[name](...v, ...a);
      } catch (e) {
        return false;
      }
    });
  })
);
reflect.on('Check', ({name}) => name && !$proto[name]
  && def($proto, name, function (...a) {
    return this.parent.check((...v) => {
      try {
        return nice[name](v[this.pos], ...a);
      } catch (e) {
        return false;
      }
    });
  })
);
function DelayedSwitch() {
  const f = (...args) => {
    const l = f.cases.length;
    let action = f._default;
    for(let i = 0 ;  i < l; i += 2){
      if(f.cases[i](...args)){
        action = f.cases[i + 1];
        break;
      }
    }
    return action ? action(...args) : args[0];
  };
  f.cases = [];
  return create(delayedProto, f);
};
Test('Delayed Switch', (Switch, Spy) => {
  const spy1 = Spy(() => 1);
  const spy2 = Spy(() => 2);
  const spy3 = Spy(() => 3);
  const s = Switch()
    .is(3)(10)
    .isNumber().use(spy1)
    .isString().use(spy2)
    .default.use(spy3);
  Test('type check', () => {
    expect(s('qwe')).is(2);
    expect(s(42)).is(1);
  });
  Test('is', () => expect(s(3)).is(10));
  Test('default', () => expect(s([])).is(3));
  Test('No extra calls', () => {
    expect(spy1).calledOnce();
    expect(spy2).calledOnce();
    expect(spy3).calledOnce();
  });
});
Test("not", (Switch) => {
  const s = Switch(5)
    .isString()(1)
    .not.isString()(2)
    .default(3);
  expect(s).is(2);
});
Test((Switch, Spy) => {
  const spy1 = Spy();
  const spy2 = Spy(() => 2);
  const spy3 = Spy();
  const s = Switch('qwe')
    .isNumber().use(spy1)
    .isString().use(spy2)
    .is(3)(4)
    .default.use(spy3);
  expect(s).is(2);
  expect(spy1).not.called();
  expect(spy2).calledTimes(1);
  expect(spy2).calledWith('qwe');
  expect(spy3).not.called();
});
Test("switch equal", (Switch, Spy) => {
  const spy1 = Spy();
  const spy3 = Spy();
  const s = Switch('qwe')
    .isNumber().use(spy1)
    .is('qwe')(4)
    .default.use(spy3);
  expect(spy1).not.called();
  expect(spy3).not.called();
  expect(s).is(4);
});
Test((is) => {
  const n = nice.Num(1);
  expect(n.is(1)).is(true);
  expect(n.is(2)).is(false);
});
})();
(function(){"use strict";def(nice, 'expectPrototype', {});
const toString = v => {
  if(v === undefined) return "undefined";
  const s = (v && v.toString) ? v.toString() : JSON.stringify(v);
  return typeof s === 'string' ? s : '' + s;
}
reflect.on('Check', ({name}) => {
  name && def(nice.expectPrototype, name, function(...a){
    const res = this._preF ? this._preF(nice[name](this.value, ...a)) : nice[name](this.value, ...a);
    if(!res || (res && res._isAnything && res._type === nice.Err)){
      const e = new Error(this.text || ['Expected (', toString(this.value), ')',
        this._preMessage || '', 'to be (',
        name, ...a.map(toString), ')'].join(' '));
      e.shift = 1;
      throw e;
    }
    delete this._preF;
    delete this._preMessage;
    return this;
  });
});
def(nice, function expect(value, ...texts){
  return create(nice.expectPrototype, { value, texts, item: this});
});
defGet(nice.expectPrototype, function text(){
  return nice.format(...this.texts);
});
defGet(nice.expectPrototype, function not(){
  this._preF = v => !v;
  this._preMessage = 'not';
  return this;
});
def(nice.expectPrototype, function message(...a){
  this.texts = a;
  return this;
});
expect = nice.expect;
Test('Not expect followed by expect.', () => {
  expect(1).not.is(3).is(1);
  expect(1).is(1).not.is(3);
});
})();
(function(){"use strict";
nice.Type({
  name: 'Spy',
  extends: 'Anything',
  defaultValueBy: () => [],
  customCall: call,
  initBy: (z, f) => {
    typeof f === 'function' ? (z._f = f) : (z._returnValue = f);
  },
});
function call(spy, ...a){
  spy._logCalls && console.log('Spy called with:', ...a);
  spy._value.push(a);
  if(spy._f)
    return spy._f(...a);
  return spy._returnValue;
};
Test((Spy) => {
  Test('Use function', () => {
    expect(Spy(() => 2)()).is(2);
  });
  Test('Return value', () => {
    expect(Spy(2)()).is(2);
  });
});
Action.Spy('logCalls', z => z._logCalls = true);
Check.Spy('called', s => s._value.length > 0);
Test((Spy, called) => {
  const spy = Spy();
  expect(spy.called()).is(false);
  spy();
  expect(spy.called()).is(true);
});
Check.Spy('calledOnce', s => s._value.length === 1);
Test((Spy, calledOnce) => {
  const spy = Spy();
  expect(spy.calledOnce()).is(false);
  spy();
  expect(spy.calledOnce()).is(true);
  spy();
  expect(spy.calledOnce()).is(false);
});
Check.Spy('calledTwice', s => s._value.length === 2);
Test((Spy, calledTwice) => {
  const spy = Spy();
  expect(spy.calledTwice()).is(false);
  spy();
  spy();
  expect(spy.calledTwice()).is(true);
  spy();
  expect(spy.calledTwice()).is(false);
});
Check.Spy('calledTimes', (s, n) => s._value.length === n);
Test((Spy, calledTimes) => {
  const spy = Spy();
  expect(spy.calledTimes(0)).is(true);
  spy();
  expect(spy.calledTimes(1)).is(true);
  spy();
  expect(spy.calledTimes(2)).is(true);
  expect(spy.calledTimes(3)).is(false);
});
Check.Spy('calledWith', (s, ...as) => s._value.some(a => {
  return as.every((v, k) => nice.is(a[k], v));
}));
Test((Spy, calledWith) => {
  const spy = Spy();
  expect(spy.calledWith(1)).is(false);
  spy(1);
  expect(spy.calledWith(1)).is(true);
  expect(spy.calledWith(1, 2)).is(false);
  spy(1, 2);
  expect(spy.calledWith(1, 2)).is(true);
});
})();
(function(){"use strict";nice.Check('isType', v => Anything.isPrototypeOf(v) || v === Anything);
nice.ReadOnly.Anything(function jsValue(z) { return z._value; });
function s(name, parent, description, ){
  const value = Object.freeze({ _type: name });
  nice.Type({
    name,
    extends: parent,
    description,
    proto: {
    }
  })();
}
s('Nothing', 'Anything', 'Parent type for all falsy values.');
s('Undefined', 'Nothing', 'Wrapper for JS undefined.');
s('Null', 'Nothing', 'Wrapper for JS null.');
s('NotFound', 'Nothing', 'Value returned by lookup functions in case nothing is found.');
NotFound = nice.NotFound;
s('Fail', 'Nothing', 'Empty negative signal.');
s('Pending', 'Nothing', 'State when item awaits input.');
s('Stop', 'Nothing', 'Value used to stop iterationin .each() and similar functions.');
s('NumberError', 'Nothing', 'Wrapper for JS NaN.');
s('AssignmentError', 'Nothing', `Can't assign`);
s('Something', 'Anything', 'Parent type for all non falsy values.');
s('Ok', 'Something', 'Empty positive signal.');
nice.Nothing.defaultValueBy = () => null;
nice.ReadOnly.Nothing(function jsValue(z) {
  return {[nice.TYPE_KEY]: z._type.name};
});
defGet(nice.Null.proto, function jsValue() {
  return null;
});
defGet(nice.Undefined.proto, function jsValue() {
  return undefined;
});
nice.simpleTypes = {
  number: {
    cast(v){
      const type = typeof v;
      if(type === 'number')
        return v;
      if(v === undefined)
        throw `undefined is not a number`;
      if(v === null)
        throw `undefined is not a number`;
      if(v._isNum)
        return v._value;
      if(type === 'string'){
        const n = +v;
        if(!isNaN(n))
          return n;
      }
      throw `${v}[${type}] is not a number`;
    }
  },
  string: {
    cast(v){
      const type = typeof v;
      if(type === 'string')
        return v;
      if(v === undefined)
        throw `undefined is not a string`;
      if(v === null)
        throw `undefined is not a string`;
      if(v._isStr)
        return v._value;
      if(type === 'number')
        return '' + v;
      if(Array.isArray(v))
        return nice.format(...v);
      throw `${v}[${type}] is not a string`;
    }
  },
  boolean: {
    cast(v){
      const type = typeof v;
      if(type === 'boolean')
        return v;
      if(v === undefined)
        false;
      if(v === null)
        false;
      if(v._isBool)
        return v._value;
      if(type === 'number' || type === 'string')
        return !!v;
      throw `${v}[${type}] is not a boolean`;
    }
  },
  function: {
    cast(v){
      const type = typeof v;
      if(type === 'function')
        return v;
      throw `${v}[${type}] is not a function`;
    }
  },
  object: {
    cast(v){
      const type = typeof v;
      if(type === 'object')
        return v;
      throw `${v}[${type}] is not an object`;
    }
  }
};
const defaultValueBy = {
  string: () => '',
  boolean: () => false,
  number: () => 0,
  object: () => ({}),
  'function': x => x,
};
['string', 'boolean', 'number', 'object', 'function'].forEach(typeName => {
  nice.Anything.configProto[typeName] = function (name, defaultValue) {
    Object.defineProperty(this.target.proto, name, {
      get: function(){
        let v = this._value[name];
        if(v === undefined){
          v = this._value[name] = defaultValue !== undefined
            ? nice.simpleTypes[typeName].cast(defaultValue)
            : defaultValueBy[typeName]();
        }
        return v;
      },
      set: function(value){
        this._value[name] = nice.simpleTypes[typeName].cast(value);
      },
      enumerable: true
    });
    return this;
  };
});
nice.Anything.configProto.array = function (name, defaultValue = []) {
  Object.defineProperty(this.target.proto, name, {
    get: function(){
      let value = this._value[name];
      if(value === undefined)
        value = this._value[name] = defaultValue;
      return value;
    },
    set: function(value){
      if(!Array.isArray(value))
        throw `Can't set ${name}[${typeName}] to ${value}[${typeof value}]`;
      this._value[name] = value;
    },
    enumerable: true
  });
  return this;
};
Func('partial', (f, template, ...cfgAs) => {
  const a = template.split('');
  const l = cfgAs.length;
  const useThis = template[0] === 'z';
  useThis && a.shift();
  return function(...callAs){
    let cur = 0;
    const as = a.map(n => {
      return n === '$' ? cfgAs[cur++]: callAs[n-1];
    });
    cur < l && as.push(...cfgAs.slice(cur));
    return useThis ? f.apply(as.shift(), as) : f(...as);
  };
});
Test('Arguments order', (partial) => {
  const f = partial((...as) => as.join(''), '21');
  expect(f('a', 'b')).is('ba');
});
Test('Partial arguments', (partial) => {
  const f = partial((...as) => as.join(''), '2$1', 'c', 'd');
  expect(f('a', 'b')).is('bcad');
});
Test('Partial `this` argument', (partial) => {
  const f = partial(String.prototype.concat, 'z2$1', 'c', 'd');
  expect(f('a', 'b')).is('bcad');
});
Test('Partial type constructor', (partial) => {
  const f = nice.Str.partial('$1', 'Hello');
  expect(f('world')).is('Hello world');
});
})();
(function(){"use strict";let autoId = 0;
const AUTO_PREFIX = '_nn_';
nice.Type({
  name: 'Box',
  extends: 'Something',
  customCall: (z, ...as) => {
    return as.length === 0 ? z._value : z.setState(as[0]);
  },
  initBy: (z, v) => z.setState(v),
  proto: {
    setState (v){
      this._value = v;
      this.emit('state', v);
    },
    uniq(){
      this.setState = function(v){
        v === this._value || this.__proto__.setState.call(this, v);
      }
      return this;
    },
    deepUniq(){
      this.setState = function(v){
        nice.diff(v, this._value) === false || this.__proto__.setState.call(this, v);
      }
      return this;
    },
    subscribe(f){
      this.on('state', f);
      if(this._value !== undefined)
        f(this._value);
    },
    unsubscribe(f){
      this.off('state', f);
      if(!this.countListeners('state')){
        this.emit('noMoreSubscribers', this);
      }
    },
    assertId(){
      if(!this._id)
        this._id = nice.genereteAutoId();
      return this._id;
    }
  }
});
Action.Box('assign', (z, o) => z({...z(), ...o}));
Test((Box, Spy) => {
  const b = Box();
  const spy = Spy();
  b.subscribe(spy);
  b(1);
  b(1);
  b(2);
  expect(spy).calledWith(1);
  expect(spy).calledWith(2);
  expect(spy).calledTimes(3);
});
Test((Box, Spy, uniq) => {
  const b = Box().uniq();
  const spy = Spy();
  b.subscribe(spy);
  b(1);
  b(1);
  b(2);
  expect(spy).calledWith(1);
  expect(spy).calledWith(2);
  expect(spy).calledTimes(2);
});
Test((Box, Spy, deepUniq) => {
  const b = Box().deepUniq();
  const spy = Spy();
  b.subscribe(spy);
  b({qwe:1, asd:2});
  b({qwe:1, asd:2});
  b({qwe:1, asd:3});
  expect(spy).calledTimes(2);
});
Test((Box, assign, Spy) => {
  const a = {name:'Jo', balance:100};
  const b = Box(a);
  b.assign({balance:200});
  expect(b().name).is('Jo');
  expect(b().balance).is(200);
});
Action.Box('push', (z, v) => {
  var a = z().slice();
  a.push(v);
  z(a);
});
Test((Box, push, Spy) => {
  const a = [1];
  const b = Box(a);
  b.push(2);
  expect(b()).deepEqual([1,2]);
  expect(a).deepEqual([1]);
});
nice.reflect.on('signature', ({type, name, signature}) => {
  if(type !== 'Action')
    return;
  const first = signature[0];
  if(name && (!first || first.type !== nice.Box) && (!(name in nice.Box.proto))){
    nice.Box.proto[name] = function(...as){
      this(nice[name](this._value, ...as));
      return this;
    }
  };
});
nice.eventEmitter(nice.Box.proto);
Test((Box, Spy) => {
  const b = Box(11);
  expect(b()).is(11);
  const spy = Spy();
  b.on('state', spy);
  b.on('state', console.log);
  b(22);
  expect(spy).calledWith(22);
});
Test('Box action', (Box, Spy) => {
  const b = Box(2);
  b.add(3);
  expect(b()).is(5);
});
})();
(function(){"use strict";nice.Type({
  name: 'BoxSet',
  extends: 'Something',
  customCall: (z, ...as) => {
    throwF('Use access methods');
  },
  initBy: (z, o) => {
    z._value = {};
    o && _each(o, (v, k) => z.set(k, v));
  },
  proto: {
    set (k, v) {
      const values = this._value;
      if(v === values[k]) {
        ;
      } else {
        if(v === null)
          delete this._value[k];
        this._value[k] = v;
        this.emit('value', v, k);
      }
      return this;
    },
    get (k) {
      return this._value[k];
    },
    subscribe (f) {
      _each(this._value, f);
      this.on('value', f);
    },
    unsubscribe (f) {
      this.off('value', f);
    },
    setState (v){
      this._value = v;
      this.emit('state', v);
    }
  }
});
nice.eventEmitter(nice.BoxSet.proto);
Test((BoxSet, Spy) => {
  const b = BoxSet();
  const spy = Spy();
  b.set('a', 1);
  b.subscribe(spy);
  expect(spy).calledWith(1, 'a');
  b.set('z', 3);
  expect(spy).calledWith(3, 'z');
  expect(spy).calledTwice();
});
Action.BoxSet('assign', (z, o) => _each(o, (v, k) => z.set(k, v)));
Test((BoxSet, assign, Spy) => {
  const b = BoxSet();
  const spy = Spy();
  b.set('a', 1);
  b.subscribe(spy);
  expect(spy).calledWith(1, 'a');
  b.assign({z: 3});
  expect(spy).calledWith(3, 'z');
  expect(spy).calledTwice();
});
})();
(function(){"use strict";const IS_READY = 1;
const IS_LOADING = 2;
const IS_HOT = 4;
nice.Type({
  name: 'RBox',
  extends: 'Box',
  initBy: (z, ...inputs) => {
    z._by = inputs.pop();
    if(typeof z._by !== 'function')
      throw `RBox only accepts functions`;
    z._status = 0;
    z._inputs = inputs;
    z._inputValues = [];
    z._inputListeners = new Map();
  },
  customCall: (z, ...as) => {
    if(as.length === 0){
      if(!(z._status & IS_READY))
        z .attemptCompute();
      return z._value;
    }
    throw `Can't set value for reactive box`;
  },
  proto: {
    reconfigure(...inputs) {
      const by = inputs.pop();
      if(typeof by !== 'function')
        throw `RBox only accepts functions`;
      const oldInputs = this._inputs;
      oldInputs.forEach(input => {
        inputs.includes(input) || this.detachSource(input);
      });
      this._by = by;
      this._inputs = inputs;
      this._inputValues = this._inputs.map(v => v._value);
      inputs.forEach(input => {
        oldInputs.includes(input) || this.attachSource(input);
      });
      if(this._status & IS_HOT)
        this.attemptCompute();
    },
    subscribe(f){
      this.warmUp();
      this.on('state', f);
      if(this._status & IS_READY){
        f(this._value);
      }
    },
    unsubscribe(f){
      this.off('state', f);
      if(!this.countListeners('state')){
        this.coolDown();
        this.emit('noMoreSubscribers', this);
      }
    },
    attemptCompute(){
      const ready = this._inputValues.every(v => v !== undefined);
      if(!ready)
        return;
      try {
        const value = this._by(...this._inputValues);
        this.setState(value);
        this._status &= ~IS_LOADING;
        this._status |= IS_READY;
      } catch (e) {
        this.setState(e);
      }
    },
    warmUp(){
      if(this._status & IS_HOT)
        return ;
      this._status |= IS_LOADING;
      this._status |= IS_HOT;
      this._status &= ~IS_READY;
      this._inputs.forEach(input => this.attachSource(input));
      this._inputValues = this._inputs.map(v => v._value);
      this.attemptCompute();
    },
    coolDown(){
      this._status &= ~IS_HOT;
      for (let [input, f] of this._inputListeners) {
        this.detachSource(input);
      };
    },
    attachSource(source, i){
      if(source._isBox){
        const f = state => {
          const position = this._inputs.indexOf(source);
          this._inputValues[position] = state;
          this.attemptCompute();
        };
        this._inputListeners.set(source, f);
        return source.subscribe(f);
      }
    },
    detachSource(source){
      const f = this._inputListeners.get(source);
      if(source._isBox){
        return source.unsubscribe(f);
      }
    }
  }
});
function checkSourceStatus(s){
  return s._isRBox ? (s._status & IS_READY) : true;
}
function extractSourceValue(s){
  return s._isBox ? s._value : s;
}
Test('RBox basic case', (Box, RBox) => {
  const b = Box(1);
  const rb = RBox(b, a => a + 1);
  rb.warmUp();
  expect(rb()).is(2);
  b(3);
  expect(rb()).is(4);
});
Test('RBox subscribe', (Box, RBox, Spy) => {
  const spy = Spy();
  const b = Box(1);
  const rb = RBox(b, a => a + 1);
  rb.subscribe(spy);
  expect(spy).calledWith(2);
  b(3);
  expect(spy).calledWith(4);
});
Test('RBox unsubscribe', (Box, RBox, Spy) => {
  const spy = Spy();
  const b = Box(1);
  const rb = RBox(b, a => a + 1);
  rb.subscribe(spy);
  expect(spy).calledOnce();
  rb.unsubscribe(spy);
  b(7);
  expect(spy).calledOnce();
  expect(rb.countListeners('state')).is(0);
  expect(b.countListeners('state')).is(0);
});
Test('RBox 2 sources', (Box, RBox, Spy) => {
  const spy = Spy();
  const a = Box(1);
  const b = Box(2);
  const rb = RBox(a, b, (a, b) => a * b);
  rb.subscribe(spy);
  expect(spy).calledWith(2);
  b(3);
  expect(spy).calledWith(3);
  a(2);
  expect(spy).calledWith(6);
});
Test('RBox reconfigure', (Box, RBox, Spy) => {
  const spy = Spy();
  const a = Box(1);
  const b = Box(2);
  const c = Box(3);
  const rb = RBox(a, b, (a, b) => a * b);
  rb.subscribe(spy);
  expect(spy).calledWith(2);
  rb.reconfigure(c, a, (c, a) => c + a);
  expect(spy).calledWith(4);
  a(7);
  expect(spy).calledWith(10);
  expect(b.countListeners('state')).is(0);
});
})();
(function(){"use strict";nice.Type({
  name: 'IntervalBox',
  extends: 'Box',
  initBy: (z, ms, f) => {
    if(typeof ms !== 'number')
      throw `1st argument must be number`;
    if(typeof f !== 'function')
      throw `2nd argument must be functions`;
    z._ms = ms;
    z._f = f;
    z._interval = null;
  },
  proto: {
    subscribe(f){
      if(this._interval === null){
        this._interval = setInterval(() => this(this._f(this())), this._ms);
        this._value === undefined && this.setState(this._f());
      }
      this._value !== undefined && f(this._value);
      this.on('state', f);
    },
    unsubscribe(f){
      this.off('state', f);
      if(!this.countListeners('state')){
        if(this._interval !== null){
          clearInterval(this._interval);
          this._interval = null;
        }
        this.emit('noMoreSubscribers', this);
      }
    },
  }
});
Action.Box('changeAfter', (z, ms, f) => setTimeout(() => z(f(z())), ms));
Test((IntervalBox, RBox, Spy) => {
  const n = IntervalBox(450, (old = 0) => old + 1);
  const x2 = RBox(n, n => n * 2);
  const spy = Spy();
  Test(() => {
    expect(n._value).is(undefined);
    expect(spy).calledTimes(0);
    x2.subscribe(spy);
    expect(n._value).is(1);
    expect(spy).calledTimes(1);
  });
  Test(() => {
    x2.unsubscribe(spy);
    expect(n._interval).is(null);
    expect(spy).calledTimes(1);
  });
});
})();
(function(){"use strict";let autoId = 0;
const AUTO_PREFIX = '_nn_';
nice.Type({
  name: 'Stream',
  extends: 'Something',
  initBy: (z, cfg) => {
    z.messages = [];
  },
  customCall: (z) => {
    throw 'Use methods';
  },
  proto: {
    push (m){
      this.messages.push(m);
      this.emit('message', m);
    },
    subscribe(f){
      this.messages.forEach(m => f(m));
      this.on('message', f);
    },
    unsubscribe(f){
      this.off('message', f);
      if(!this.countListeners('message')){
        this.emit('noMoreSubscribers', this);
      }
    },
    assertId(){
      if(!this._id)
        this._id = nice.generateAutoId();
      return this._id;
    },
    map(f){
      const res = nice.Stream();
      this.subscribe(m => res.push(f(m)));
      return res;
    },
    filter(f){
      const res = nice.Stream();
      this.subscribe(m => f(m) && res.push(m));
      return res;
    },
    reduce(...as){
      const box = nice.Box();
      let hasSeed = as.length > 1;
      const f = as[0];
      let value = as[1];
      this.subscribe(m => {
        if(!hasSeed){
          hasSeed = true;
          value = m;
        } else {
          value = f(value, m);
          box(value);
        }
      });
      return box;
    },
    collect(accumulator, f){
      const box = nice.Box();
      this.subscribe(m => {
        f(accumulator, m);
        box(accumulator);
      });
      return box;
    }
  }
});
Test((Box, assign, Spy) => {
  const a = {name:'Jo', balance:100};
  const b = Box(a);
  b.assign({balance:200});
  expect(b().name).is('Jo');
  expect(b().balance).is(200);
});
Action.Box('push', (z, v) => {
  var a = z().slice();
  a.push(v);
  z(a);
});
Test((Box, push, Spy) => {
  const a = [1];
  const b = Box(a);
  b.push(2);
  expect(b()).deepEqual([1,2]);
  expect(a).deepEqual([1]);
});
nice.eventEmitter(nice.Stream.proto);
Test((Stream, Spy) => {
  const stream = Stream();
  const spy = Spy();
  stream.subscribe(spy);
  stream.push(11);
  stream.push(22);
  expect(spy).calledWith(11);
  expect(spy).calledWith(22);
  expect(spy).calledTwice();
});
Test((Stream, Spy, map) => {
  const stream = Stream();
  const stream2 = stream.map(x => 2 * x);
  const spy = Spy();
  stream2.subscribe(spy);
  stream.push(12);
  stream.push(13);
  expect(spy).calledWith(24);
  expect(spy).calledWith(26);
  expect(spy).calledTwice();
});
Test((Stream, Spy, filter) => {
  const stream = Stream();
  const stream2 = stream.filter(x => x < 10);
  const spy = Spy();
  stream2.subscribe(spy);
  stream.push(7);
  stream.push(13);
  expect(spy).calledWith(7);
  expect(spy).calledOnce();
});
Test((Stream, Spy, reduce) => {
  const stream = Stream();
  const spy = Spy();
  stream.reduce((a,b) => a + b).subscribe(spy);
  stream.push(7);
  stream.push(13);
  expect(spy).calledWith(20);
  expect(spy).calledOnce();
});
Test((Stream, Spy, reduce) => {
  const stream = Stream();
  const spy = Spy();
  stream.reduce((a,b) => a + b, 4).subscribe(spy);
  stream.push(7);
  stream.push(13);
  expect(spy).calledWith(11);
  expect(spy).calledWith(24);
  expect(spy).calledTwice();
});
Test((Stream, Spy, collect) => {
  const stream = Stream();
  const spy = Spy();
  const array = [];
  stream.collect(array, (a, v) => a.push(v)).subscribe(spy);
  stream.push(7);
  stream.push(13);
  expect(spy).calledTwice();
  expect(array).deepEqual([7, 13]);
});
})();
(function(){"use strict";Mapping.Anything('or', (...as) => {
  let v;
  for(let i in as){
    v = nice(as[i]);
    if(nice.isSomething(v) && v._value !== false)
      return v;
  }
  return v || nice.Nothing();
});
Func.Anything('and', (...as) => {
  let v;
  for(let i in as){
    v = nice(as[i]);
    if(!nice.isSomething(v) || v._value === false)
      return v;
  }
  return v;
});
Func.Anything('nor', (...as) => {
  let v;
  for(let i in as){
    v = nice(as[i]);
    if(nice.isSomething(v) && v._value !== false)
      return nice(false);
  }
  return nice(true);
});
Func.Anything('xor', (...as) => {
  let count = 0;
  for(let i in as){
    const v = nice(as[i]);
    if(nice.isSomething(v) && v._value !== false)
      count++;
  }
  return nice(count && count < as.length ? true : false);
});
})();
(function(){"use strict";nice.Type({
  name: 'Value',
  extends: 'Something',
  default: () => undefined,
  isSubType,
  initBy: (z, v) => {
    if(v === undefined)
      v = z._type.defaultValueBy();
    z._type.setValue(z, v);
  },
  creator: () => { throw 'Use Single or Object.' },
  proto: create(Anything.proto, {
    valueOf (){ return this._value; }
  }),
  configProto: {
    by(...a){
      if(typeof a[0] === 'function')
        this.target.initBy = a[0];
      else if(typeof a[0] === 'string')
        this.target.initBy = (z, ...vs) => {
          a.forEach((name, i) => z.set(name, vs[i]));
        }
      return this;
    },
    assign (...o) {
      Object.assign(this.target.proto, ...o);
      return this;
    },
    addProperty (name, cfg){
      Object.defineProperty(this.target.proto, name, cfg);
      return this;
    },
    Const (name, value){
      def(this.target, name, value);
      def(this.target.proto, name, value);
      return this;
    },
  },
}).about('Parent type for all values.');
defGet(nice.Value.configProto, function Method() {
  const type = this.target;
  return Func.next({ returnValue: this, signature: [{type}] });
});
['Action', 'Mapping', 'Check'].forEach(t =>
  defGet(nice.Value.configProto, t, function () {
    const type = this.target;
    return nice[t].next({ returnValue: this, signature: [{type}] });
  })
);
function isSubType(t){
  typeof t === 'string' && (t = nice.Type(t));
  return t === this || t.isPrototypeOf(this);
};
nice.jsTypes.isSubType = isSubType;
})();
(function(){"use strict";const Stop = nice.Stop;
nice.Type({
  name: 'Obj',
  extends: nice.Value,
  defaultValueBy: () => ({}),
  setValue (z, value) {
    z._value = z._type.defaultValueBy();
    expect(typeof value).is('object');
    _each(value, (v, k) => z.set(k, v));
  },
  proto: {
    checkKey (i) {
      if(i._isAnything === true)
        i = i();
      return i;
    },
    get (key) {
      if(key._isAnything === true)
        key = key();
      if(key in this._value)
        return this._value[key];
      const type = this._type;
      const childType = type && type.types[key]
      if(childType){
        const child = key in type.defaultArguments
         ? nice._createItem(childType, type.defaultArguments[key])
         : nice._createItem(childType);
        this._value[key] = child;
        return child;
      }
      return undefined;
    },
    assert (key) {
      if(key._isAnything === true)
        key = key();
      const type = this._type;
      const childType = (type && type.types[key]) || Anything;
      const child = key in type.defaultArguments
       ? nice._createItem(childType, type.defaultArguments[key])
       : nice._createItem(childType);
      this._value[key] = child;
      return child;
    },
    getDeep (...path) {
      let res = this, i = 0;
      while(i < path.length) res = res.get(path[i++]);
      return res;
    },
  }
})
  .about('Parent type for all composite types.')
  .ReadOnly(function values(z){
    let a = nice.Arr();
    z.each(v => a.push(v));
    return a;
  })
  .ReadOnly(function jsValue(z){
    const o = (Array.isArray(z) || (z && z._isArr)) ? [] : {};
    z.each((v, k) => o[k] = (v && v._isAnything) ? v.jsValue : v);
    Switch(z._type.name).isString().use(s =>
      ['Arr', 'Obj'].includes(s) || (o[nice.TYPE_KEY] = s));
    return o;
  })
  .Mapping('size', z => Object.keys(z._value).length);
Test("Obj constructor", (Obj) => {
  const a = Obj({a: 3});
  expect(a.get('a')).is(3);
});
Test("Obj deep constructor", Obj => {
  const o = Obj({a: {b: { c:1 }}});
  expect(o.jsValue.a.b.c).is(1);
});
Test("set / get primitive", (Obj) => {
  const a = Obj();
  a.set('a', 1);
  expect(a.get('a')).is(1);
});
Test("set / get with nice.Str as key", (Obj) => {
  const a = Obj();
  a.set('qwe', 1);
  expect(a.get(nice('qwe'))).is(1);
});
const F = Func.Obj, M = Mapping.Obj, A = Action.Obj, C = Check.Obj;
Func.Nothing('each', () => 0);
C('has', (o, key) => {
  if(key._isAnything === true)
    key = key();
  const children = o._value;
  if(key in children){
    return children[key]._type !== NotFound;
  }
  return false;
});
Test((Obj, has) => {
  const o = Obj({q:1,z:3});
  expect(o.has('a')).is(false);
  expect(o.has('q')).is(true);
});
A.about(`Set value if it's missing.`)
  (function setDefault (z, i, ...as) {
    z.has(i) || z.set(i, ...as);
  });
Test((Obj, setDefault) => {
  const o = Obj({a:1});
  o.setDefault('a', 2);
  expect(o.get('a')).is(1);
  o.setDefault('z', 2);
  expect(o.get('z')).is(2);
});
F(function each(z, f){
  const index = z._value;
  for(let i in index){
    const item = index[i];
    if(f(item, i) === Stop)
      break;
  }
});
Test("each stop", (each, Obj, Spy) => {
  const spy = Spy(() => Stop);
  Obj({qwe: 1, asd: 2}).each(spy);
  expect(spy).calledOnce();
  expect(spy).calledWith(1);
});
Mapping.Object('get', (o, path) => {
  if(Array.isArray(path)){
    let k = 0;
    while(k < path.length) {
      o = o[path[k++]];
      if(!o)
        return o;
    }
    return o;
  } else {
    typeof path === 'function' && (path = path());
    return o[path];
  }
});
Test((Obj, NotFound) => {
  const o = Obj({q:1});
  expect(o.get('q')).is(1);
});
Action.Object('set', (o, i, v) => {
  typeof i === 'function' && (i = i());
  o[i] = v;
});
A('set', (z, key, value, ...tale) => {
  const _name = z.checkKey(key);
  if(value === undefined)
    throw `Can't set ${key} to undefined`;
  if(value === null)
    return z.remove(_name);
  const type = z._type;
  const childType = (type && type.types[key]);
  if(childType) {
    if(!z._value[_name]){
      z._value[_name] = nice._createItem(childType);
    }
    z._value[_name](value, ...tale);
  }
  z._value[_name] = value;
});
A('assign', (z, o) => _each(o, (v, k) => z.set(k, v)));
A.about('Remove element at `i`.')
('remove', (z, key) => {
  if(key._isAnything === true)
    key = key();
  if(!(key in z._value))
    return;
  delete z._value[key];
});
Test((remove, Obj) => {
  const o = Obj({ q:1, a:2 });
  expect( o.size() ).is(2);
  expect( remove(o, 'q').jsValue ).deepEqual({ a:2 });
  expect( o.size() ).is(1);
});
A('removeAll', z => {
  _each(z._value, (v, k) => z.get(k).toNotFound());
});
M(function reduce(o, f, res){
  o.each((v,k) => res = f(res, v, k));
  return res;
});
M(function mapToArray(c, f){
  return c.reduceTo([], (a, v, k) => a.push(f(v, k)));
});
Mapping.Nothing('map', () => nice.Nothing);
Mapping.Object('map', (o, f) => nice.apply({}, res => {
  for(let i in o)
    res[i] = f(o[i], i);
}));
M.rObj(function map(r, c, f){
  c.each((v,k) => r.set(k, f(v, k)));
});
Test("map", function(Obj, map) {
  const a = Obj({q: 3, a: 2});
  const b = a.map(x => x * 2);
  expect(b.jsValue).deepEqual({q:6, a:4});
});
M.rObj('filter', (r, c, f) => c.each((v, k) => f(v,k) && r.set(k, v)));
Test("filter", function(Obj, filter) {
  const a = Obj({q: 3, a: 2, z:5});
  const b = a.filter(n => n % 2);
  expect(b.jsValue).deepEqual({q:3, z:5});
});
M('sum', (c, f) => c.reduce((n, v) => n + (f ? f(v) : v), 0));
C.Function(function some(c, f){
  let res = false;
  c.each((v,k) => {
    if(f(v, k)){
      res = true;
      return Stop;
    }
  });
  return res;
});
Test((Obj, some) => {
  const o = Obj({a:1,b:2});
  expect(o.some(v => v % 2)).is(true);
  expect(o.some(v => v < 3)).is(true);
  expect(o.some(v => v < 0)).is(false);
});
C.about(`Check if every element in colection matches given check`)
  (function every(c, f){
    return !!c.reduce((res, v, k) => res && f(v, k), true);
  });
Test((Obj, every) => {
  const o = Obj({a:1,b:2});
  expect(o.every(v => v % 2)).is(false);
  expect(o.every(v => v < 3)).is(true);
  expect(o.every(v => v < 0)).is(false);
});
M(function find(c, f){
  let res;
  c.each((v, k) => {
    if(f(v, k)){
      res = v;
      return Stop;
    }
  });
  return res === undefined ? NotFound() : res;
});
M(function findKey(c, f){
  nice.isFunction(f) || (f = is(f, nice));
  let res;
  c.each((v, k) => {
    if(f(v, k)){
      res = k;
      return Stop;
    }
  });
  return res === undefined ? NotFound() : res;
});
M.Function(function count(o, f) {
  let n = 0;
  o.each((v, k) => f(v, k) && n++);
  return nice.Num(n);
});
Check.Object('includes', (o, t) => {
  for(let i in o)
    if(is(o[i], t))
      return true;
  return false;
});
Test((includes) => {
  const o = {q:1,z:3};
  expect(includes(o, 2)).is(false);
  expect(includes(o, 3)).is(true);
});
Check.Obj('includes', (o, t) => {
  let res = false;
  o.each(v => {
    if(nice.is(v, t)){
      res = true;
      return Stop;
    }
  });
  return res;
});
Test((includes, Obj) => {
  const o = Obj({q:1,z:3});
  expect(o.includes(2)).is(false);
  expect(o.includes(3)).is(true);
  expect(includes(o, 2)).is(false);
  expect(includes(o, 3)).is(true);
});
M('getProperties',  z => apply([], res => {
  for(let i in z) z[i]._isProperty && res.push(z[i]);
}));
Func.Object('reduceTo', (o, res, f) => {
  _each(o, (v, k) => f(res, v, k));
  return res;
});
Test("reduceTo", function(reduceTo, Num) {
  const c = {qwe: 1, ads: 3};
  const a = nice.Num();
  expect(reduceTo(c, a, (z, v) => z.inc(v))).is(a);
  expect(a()).is(4);
});
reflect.on('type', type => {
  const smallName = nice._decapitalize(type.name);
  function createProperty(z, name, ...as){
    const targetType = z.target;
    if(name[0] !== name[0].toLowerCase())
      throw new Error("Property name should start with lowercase letter. "
            + `"${nice._decapitalize(name)}" not "${name}"`);
    targetType.types[name] = type;
    as.length && (targetType.defaultArguments[name] = as);
    defGet(targetType.proto, name, function(){
      return this.get(name);
    });
    reflect.emitAndSave('Property', { type, name, targetType });
  }
  def(nice.Obj.configProto, smallName, function (name, ...as) {
    createProperty(this, name, ...as);
    return this;
  });
});
Test(function getDeep(Obj){
  const o = Obj({q:Obj({a:2})});
  expect(o.getDeep('q', 'a')).is(2);
  expect(o.getDeep() === o).isTrue();
});
})();
(function(){"use strict";nice.Type({
  name: 'Err',
  extends: 'Nothing',
  initBy: (z, e, ...as) => {
    const type = typeof e;
    let stack, message;
    if(type  === 'object') {
      if(e.stack){
        ({ stack, message } = e);
      } else {
        throw `Can't create error from ` + JSON.stringify(e);
      }
    } else if (type  === 'string') {
      message = as.length ? nice.format(e, ...as) : e;
    }
    if(!stack)
      stack = new Error().stack;
    const a = stack.split('\n');
    a.splice(0, 4);
    z._type.setValue(z, { message, trace: a.join('\n') });
    console.log('Error created:', message);
  },
  creator: () => ({}),
  proto: {
    valueOf () { return Err(this._value.message); },
    toString () { return `Error: ${this._value.message}`; }
  }
}).about('Represents error.');
Err = nice.Err;
})();
(function(){"use strict";nice.Type({
  name: 'Single',
  extends: nice.Value,
  itemArgs0: z => {
    return z._value;
  },
  itemArgs1: (z, v) => {
    z._type.setValue(z, v);
  },
  isFunction: true,
  proto: {
    [Symbol.toPrimitive]() {
      return this.valueOf();
    }
  }
}).about('Parent type for all single value types.');
reflect.on('type', type => {
  def(nice.Single.configProto, type.name, () => {
    throw new Error("Can't add properties to SingleValue types");
  });
});
})();
(function(){"use strict";const whiteSpaces = ' \f\n\r\t\v\u00A0\u2028\u2029';
const allowedSources = {boolean: 1, number: 1, string: 1};
nice.Single.extend({
  name: 'Str',
  defaultValueBy: () => '',
  initBy: (z, ...as) => {
    z._type.setValue(z, as.length > 1 ? nice.format(...as) : as[0] || '');
  },
  itemArgs1: (z, v) => {
    z._type.setValue(z, nice.simpleTypes.string.cast(v));
  },
  itemArgsN: (z, a) => z._type.setValue(z, nice.format(...a)),
})
  .about('Wrapper for JS string.')
  .ReadOnly('length', z => z._value.length);
Test(Str => {
  const s = Str();
  expect(s).is('');
  s(3);
  expect(s).is('3');
  s('/%d/', 1);
  expect(s).is('/1/');
  s(['/%d/', 2]);
  expect(s).is('/2/');
  expect(() => s({})).throws();
});
_each({
  endsWith: (s, p, l) => s.endsWith(p, l),
  startsWith: (s, p, i) => s.startsWith(p, i),
  includes: (s, p, i) => s.includes(p, i),
  test: (s, r) => r.test(s),
}, (f, name) => Check.String(name, f));
const M = Mapping.String;
const sf = {
  trimLeft: (s, a = whiteSpaces) => {
    let i = 0;
    while(a.indexOf(s[i]) >= 0) i++;
    return s.substr(i);
  },
  trimRight: (s, a = whiteSpaces) => {
    let i = s.length - 1;
    while(a.indexOf(s[i]) >= 0) i--;
    return s.substr(0, i + 1);
  },
  trim: (s, a) => sf.trimRight(sf.trimLeft(s, a), a),
  truncate: (s, n, tale) => s.length > n ? s.substr(0, n) + (tale || '') : s,
  capitalize: nice._capitalize,
  deCapitalize: nice._decapitalize
};
_each(sf, (v, k) => M(k, v));
`toLocaleLowerCase
toLocaleUpperCase
toLowerCase
toUpperCase
charAt
charCodeAt
codePointAt
concat
indexOf
lastIndexOf
normalize
padEnd
padStart
repeat
substr
substring
slice
split
search
replace
match
localeCompare`.split('\n').forEach(k => M
    .about(`Calls \`String.prototype.${k}\`.`)
    (k, (s, ...a) => s[k](...a)));
nice.Mapping.Number(String.fromCharCode);
nice.Mapping.Number(String.fromCodePoint);
Test(format => {
  expect(format('/%d/', 1)).is('/1/');
  expect(format('%s:%s', 'foo', 'bar', 'baz')).is('foo:bar baz');
  expect(format(1, 2, 3)).is('1 2 3');
  expect(format('%% %s')).is('%% %s');
});
typeof Symbol === 'function' && Func.String(Symbol.iterator, z => {
  let i = 0;
  const l = z.length;
  return { next: () => ({ value: z[i], done: ++i > l }) };
});
})();
(function(){"use strict";nice.Obj.extend({
  name: 'Arr',
  defaultValueBy: () => [],
  initBy: (z, ...as) => {
    if(as.length === 1 && Array.isArray(as[0]))
      as = as[0];
    as.forEach(v => z.push(v));
  },
  itemArgsN: (z, vs) => {
    z.removeAll();
    vs.forEach( v => z.push(v));
  },
  proto: {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
    },
    checkKey (i) {
      if(i._isAnything === true)
        i = i();
      if(typeof i !== 'number')
        if(+i != i)
          throw 'Arr only likes number keys.';
      if(i < 0)
        throw 'Arr only likes positive keys.';
      return i;
    },
}).about('Ordered list of elements.')
  .ReadOnly('size', z => z._value.length)
  .Action(function push(z, ...a) {
    a.forEach(v => z.insertAt(z._value.length, v));
  });
Test("constructor", function(Arr) {
  let a = Arr(1, 5, 8);
  a.push(9);
  expect(a.get(1)).is(5);
  expect(a.get(3)).is(9);
});
Test("setter", function(Arr) {
  const a = Arr();
  a.push(2)(3, 4).push(5);
  expect(a.get(0)).is(3);
  expect(a.get(2)).is(5);
});
Test("push", (Arr, push) => {
  const a = Arr(1, 4);
  a.push(2, 1);
  expect(a.jsValue).deepEqual([1, 4, 2, 1]);
});
Test("push links", (Arr, push, Num) => {
  const a = Arr();
  const n = Num(5);
  const n2 = Num(7);
  a.push(n, n2);
  expect(a.jsValue).deepEqual([5,7]);
});
Test("size", (Arr, push, Num) => {
  const a = Arr(2);
  const n = Num(5);
  const n2 = Num(7);
  a.push(3, n2);
  expect(a.size).is(3);
  a.remove(2);
  expect(a.size).is(2);
  a.remove(0);
  expect(a.size).is(1);
});
const Arr = nice.Arr;
const F = Func.Arr, M = Mapping.Arr, A = Action.Arr;
A('set', (a, key, value, ...tale) => {
  const k = a.checkKey(key);
  if(value === undefined)
    throw `Can't set ${key} to undefined`;
  const order = a._value;
  if(k > order.length)
    throw `Can't set ${key} array has only ${order.length} elements`;
  if(value === null)
    return a.remove(k);
  const item = a.get(k);
  item(value, ...tale);
  order[k] = item;
});
F('each', (a, f) => {
  const o = a._value;
  for(let i = 0; i < o.length; i++)
    if(nice.isStop(f(a.get(i), i)))
      break;
  return a;
});
Test("each", (Arr, Spy, each) => {
  const a = Arr(1, 2);
  const spy = Spy();
  a.each(spy);
  expect(spy).calledTwice();
  expect(spy).calledWith(1, 0);
  expect(spy).calledWith(2, 1);
});
M.Function('reduce', (a, f, res) => {
  _each(a, (v, k) => res = f(res, v, k));
  return res;
});
M.Function('reduceRight', (a, f, res) => {
  a.eachRight((v, k) => res = f(res, v, k));
  return res;
});
M.rStr('join', (r, a, s = '') => r(a.jsValue.join(s)));
Test((Arr, join) => {
  const a = Arr(1,2);
  expect(a.join(' ')()).is('1 2');
});
M('sum', (a, f) => a.reduce(f ? (sum, n) => sum + f(n) : (sum, n) => sum + n, 0));
A('unshift', (z, ...a) => a.reverse().forEach(v => z.insertAt(0, v)));
A('add', (z, ...a) => {
  a.forEach(v => z.includes(v) || z.push(v));
});
Test((add, Arr) => {
  expect(Arr(1,2).add(2).jsValue).deepEqual([1,2]);
  expect(Arr(1,2).add(3).jsValue).deepEqual([1,2,3]);
});
A('pull', (z, item) => {
  const k = is.Value(item)
    ? z.items.indexOf(item)
    : z.findKey(v => item === v());
  (k === -1 || k === undefined) || z.remove(k);
});
A.Number('insertAt', (z, i, v) => {
  i = +i;
  z.each((c, k) => k > i && (c._name = k + 1));
  z._value.splice(i, 0, v);
});
A('insertAfter', (z, target, v) => {
  z.each((v, k) => nice.is(v, target) && z.insertAt(+k+1, v) && nice.Stop);
});
A('remove', (z, k) => {
  k = +k;
  if(k >= z._value.length)
    return;
  z._value.splice(k, 1);
});
Test((Arr, remove) => {
  const a = Arr(1,2,3,4);
  expect(a.size).is(4);
  expect(a.get(1)).is(2);
  a.remove(1);
  expect(a.size).is(3);
  expect(a.get(1)).is(3);
});
F('callEach', (z, ...a) => {
  z().forEach( f => f.apply(z, ...a) );
  return z;
});
A.about('Remove all values equal to `v` from `a`.')
  ('removeValue', (z, target) => {
    z.each((v, k) => nice.is(v, target) && z.remove(k));
  });
Test((removeValue, Arr) => {
  expect(removeValue(Arr(1,2,3), 2).jsValue).deepEqual([1,3]);
});
Action.Array.about('Remove all values equal to `v` from `a`.')
  ('removeValue', (a, v) => {
    nice.eachRight(a, (_v, k) => is(_v, v) && a.splice(k,1));
  });
Test(removeValue => {
  expect(removeValue([1,2,3], 2)).deepEqual([1,3]);
});
Func.Array.Function(function eachRight(a, f){
  let i = a.length;
  while (i-- > 0)
    if(nice.isStop(f(a[i], i)))
      break;
  return a;
});
F(function eachRight(a, f){
  const o = a._value;
  for(let i = o.length - 1; i >= 0; i--)
    if(nice.isStop(f(a.get(i), i)))
      break;
  return a;
});
Test("eachRight", () => {
  let a = Arr(1, 2);
  let b = [];
  a.eachRight(v => b.push(v));
  expect(b).deepEqual([2, 1]);
});
A(function fill(z, v, start = 0, end){
  const l = z.size;
  end === undefined && (end = l);
  start < 0 && (start += l);
  end < 0 && (end += l);
  for(let i = start; i < end; i++)
    z.insertAt(i, v);
});
M.Function.rArr('map', (r, a, f) => a.each((v, k) => r.push(f(v, k))));
Test("map", () => {
  expect(Arr(4, 3, 5).map(x => x * 2).jsValue).deepEqual([8,6,10]);
});
Mapping.Array.Function(function map(a, f){
  return a.reduce((z, v, k) => { z.push(f(v, k)); return z; }, []);
});
M.Function(function filter(a, f){
  return a.reduceTo(Arr(), (res, v, k) => f(v, k, a) && res.push(v));
});
M(function random(a){
  return a.get(Math.random() * a._value.length | 0);
});
M('sortedIndex', (a, v, f = (a, b) => a - b) => {
  let i = a.size;
  a.each((vv, k) => {
    if(f(v, vv) <= 0){
      i = k;
      return nice.Stop;
    }
  });
  return i;
});
M.Array('intersection', (a, b) => {
  const res = Arr();
  a.each(v => b.includes(v) && res.push(v));
  return res;
});
Mapping.Array.Array('intersection', (a, b) => {
  const res = [];
  a.forEach(v => is.includes(b, v) && res.push(v));
  return res;
});
M.about('Creates new array with `separator` between elments.')
(function intersperse(a, separator) {
  const res = Arr();
  const last = a.size - 1;
  a.each((v, k) => res.push(v) && (k < last && res.push(separator)));
  return res;
});
M.about('Returns last element of `a`.')
  (function last(a) {
  return a._value[a._value.length - 1];
});
Test((last, Arr) => {
  expect(Arr(1,2,4).last()).is(4);
});
M.about('Returns first element of `a`.')
  (function first(a) {
    return a.get(0);
  });
Test((Arr, first) => {
  expect(Arr(1,2,4).first()).is(1);
});
A('removeAll', z => z._value.length = 0);
Test("removeAll", (Arr, removeAll) => {
  let a = Arr(1, 4);
  a.removeAll();
  expect(a.jsValue).deepEqual([]);
});
M.Number.about('Returns `n` first elements of `a`.')
  ('firstN', (a, n) => a._type(a._value.slice(0, n)));
Test((Arr, firstN) => {
  const a = Arr([1,2,4]);
  expect(a.firstN(2)).deepEqual([1,2]);
  expect(a.firstN(0)).deepEqual([]);
});
typeof Symbol === 'function' && F(Symbol.iterator, z => {
  let i = 0;
  const l = z.size;
  return { next: () => ({ value: z.get(i), done: ++i > l }) };
});
})();
(function(){"use strict";nice.Single.extend({
  name: 'Num',
  itemArgs1: (z, v) => {
    z._type.setValue(z, nice.simpleTypes.number.cast(v));
  },
  defaultValueBy: () => 0,
  help: 'Wrapper for JS number.'
});
Test(Num => {
  const n = Num();
  expect(n).is(0);
  n(3);
  expect(n).is(3);
  expect(() => n('qwe')).throws();
});
Check.Single.Single.Single('between', (n, a, b) => n > a && n < b);
_each({
  integer: n => Number.isInteger(n),
  saveInteger: n => Number.isSaveInteger(n),
  finite: n => Number.isFinite(n),
}, (f, name) => Check.Number(name, f));
_each({
  lt: (n, a) => n < a,
  lte: (n, a) => n <= a,
  gt: (n, a) => n > a,
  gte: (n, a) => n >= a,
}, (f, name) => Check.Number.Number(name, f));
const M = Mapping.Number;
_each({
  sum: (a, ...bs) => bs.reduce((x, y) => x + y, a),
  difference: (a, b) => a - b,
  product: (a, b) => a * b,
  fraction: (a, b) => a / b,
  reminder: (a, b) => a % b,
  next: n => n + 1,
  previous: n => n - 1
}, (f, name) => M(name, f));
`acos
asin
atan
ceil
clz32
floor
fround
imul
max
min
round
sqrt
trunc
abs
exp
log
atan2
pow
sign
asinh
acosh
atanh
hypot
cbrt
cos
sin
tan
sinh
cosh
tanh
log10
log2
log1pexpm1`.split('\n').forEach(k =>
  M.about('Wrapper for `Math.' + k + '`')(k, (n, ...a) => Math[k](n, ...a)));
M('clamp', (n, min, max) => {
  if(max === undefined){
    max = min;
    min = 0;
  }
  return n < min
    ? min
    : n > max
      ? max
      : n;
});
Test(clamp => {
  expect(clamp(0, 1, 3)).is(1);
  expect(clamp(2, 1, 3)).is(2);
  expect(clamp(10, 1, 3)).is(3);
});
const A = Action.Num;
A('add', (z, n) => z(z() + n));
A('inc', (z, n = 1) => z(z() + n));
A('dec', (z, n = 1) => z(z() - n));
A('divide', (z, n) => z(z() / n));
A('multiply', (z, n) => z(z() * n));
A('negate', z => z(-z()));
A('setMax', (z, n) => n > z() && z(n));
A('setMin', (z, n) => n < z() && z(n));
})();
(function(){"use strict";nice.Single.extend({
  name: 'Bool',
  defaultValueBy: () => false,
  itemArgs1: (z, v) => {
    z._type.setValue(z, nice.simpleTypes.boolean.cast(v));
  },
}).about('Wrapper for JS boolean.');
Test(Bool => {
  const b = Bool();
  expect(b).is(false);
  b(true);
  expect(b).is(true);
  b('qwe');
  expect(b).is(true);
  b('');
  expect(b).is(false);
  expect(() => b({})).throws();
});
const B = nice.Bool, M = Mapping.Bool;
const A = Action.Bool;
A('turnOn', z => z(true));
A('turnOff', z => z(false));
A('toggle', z => z(!z()));
nice.Single.extensible = false;
})();
(function(){"use strict";nice.Type('Range')
  .about('Represent range of numbers.')
  .by((z, start, end, step = 1) => {
    expect(start).isNumber();
    expect(end).isNumber();
    expect(step).isNumber();
    z._value = { start, end, step };
  })
  .Method(function each(z, f) {
    const { start, end, step } =  z._value;
    let i = start;
    while(i <= end) {
      f(i);
      i += step;
    }
  })
  .Mapping(function map(z, f) {
    const { start, end, step } =  z._value;
    let i = start, n = 0;
    const a = nice.Arr();
    while(i <= end){
      a.push(f(i, n++));
      i += step;
    }
    return a;
  })
  .Mapping(function filter(z, f) {
    const a = nice.Arr();
    z.each(v => f(v) && a.push(v));
    return a;
  })
  .Mapping(function toArray(z) {
    const a = [];
    z.each(v => a.push(v));
    return a;
  })
  .Check(function includes(z, n) {
    const { start, end } =  z._value;
    return n >= start && n <= end;
  });
Func.Number.Range(function within(v, r) {
  const { start, end } =  r._value;
  return v >= start && v <= end;
});
Test((Range, each, Spy) => {
  const spy = Spy();
  Range(1,3).each(spy);
  expect(spy).calledTimes(3);
  expect(spy).calledWith(1);
  expect(spy).calledWith(2);
  expect(spy).calledWith(3);
});
Test('Test Range with step', (Range, each, Spy) => {
  const spy = Spy();
  Range(1, 3, 2).each(spy);
  expect(spy).calledTimes(2);
  expect(spy).calledWith(1);
  expect(spy).calledWith(3);
});
Test((Range, includes) => {
  const r = Range(1, 6);
  expect(r.includes(5)).is(true);
  expect(r.includes(15)).is(false);
});
Test((Range, within, Num) => {
  const r = Range(1, 5);
  expect(within(5, r)).is(true);
  expect(within(15, r)).is(false);
});
Test((Range, map) => {
  const r = Range(2, 4);
  expect(r.map(x => x * 2)).deepEqual([4, 6, 8]);
});
Test((Range, filter) => {
  const r = Range(2, 7);
  expect(r.filter(x => x % 2)).deepEqual([3, 5, 7]);
});
Test((Range, toArray) => {
  const r = Range(2, 7);
  expect(r.toArray()).deepEqual([2, 3, 4, 5, 6, 7]);
});
})();
(function(){"use strict";
const runtime = {};
nice.Type('Html', (z, tag) => tag && (z.tag = tag))
  .about('Represents HTML element.')
  .string('tag', 'div')
  .obj('eventHandlers')
  .obj('cssSelectors')
  .Action.about('Adds event handler to an element.')(function on(e, name, f){
    if(name === 'domNode' && nice.isEnvBrowser()){
      if(!e.id())
        throw `Give element an id to use domNode event.`;
      const el = document.getElementById(e.id());
      el && f(el);
    }
    const handlers = e.eventHandlers._value;
    handlers[name] ? handlers[name].push(f) : e.eventHandlers.set(name, [f]);
    return e;
  })
  .Action.about('Removes event handler from an element.')(function off(e, name, f){
    const handlers = e.eventHandlers.get(name);
    handlers && e.eventHandlers.removeValue(name, f);
    return e;
  })
  .obj('style')
  .obj('attributes')
  .arr('children')
  .Method('assertId', z => {
    z.id() || z.id(nice.genereteAutoId());
    return z.id();
  })
  .Method('assertClass', z => {
    const s = z.attributes.get('className');
    if(s === undefined || s.indexOf(nice.AUTO_PREFIX) < 0){
      const c = nice.genereteAutoId();
      z.attributes.set('className', s !== undefined ? (s + ' ' + c) : c);
    }
    return z;
  })
  .Method.about('Adds values to className attribute.')('class', (z, ...vs) => {
    const current = z.attributes.get('className') || '';
    if(!vs.length)
      return current;
    const a = current ? current.split(' ') : [];
    vs.forEach(v => !v || a.includes(v) || a.push(v));
    z.attributes.set('className', a.join(' '));
    return z;
  })
  .ReadOnly(text)
  .ReadOnly(html)
  .ReadOnly(dom)
  .Method.about('Scroll browser screen to an element.')(function scrollTo(z, offset = 10){
    z.on('domNode', n => {
      n && window.scrollTo(n.offsetLeft - offset, n.offsetTop - offset);
    });
    return z;
  })
  .Action.about('Focuses DOM element.')('focus', (z, preventScroll) =>
      z.on('domNode', node => node.focus(preventScroll)))
  .Action.about('Adds children to an element.')(function add(z, ...children) {
    children.forEach(c => {
      if(c === undefined || c === null)
        return;
      if(typeof c === 'string' || c._isStr)
        return z.children.push(c);
      if(Array.isArray(c))
        return c.forEach(_c => z.add(_c));
      if(c._isArr)
        return c.each(_c => z.add(_c));
      if(c._isNum || typeof c === 'number')
        return z.children.push(c);
      if(c._isBox)
        return z.children.push(c);
      if(c === z)
        return z.children.push(`Errro: Can't add element to itself.`);
      if(c._isErr)
        return z.children.push(c.toString());
      if(!c || !nice.isAnything(c))
        return z.children.push('Bad child: ' + c);
      c.up = z;
      c._up_ = z;
      z.children.push(c);
    });
  });
nice.ReadOnly.Anything('dom', z => document.createTextNode("" + z._value));
const Html = nice.Html;
Test('Simple html element with string child', Html => {
  expect(Html().add('qwe').html).is('<div>qwe</div>');
});
Test("insert Html", (Html) => {
  const div = Html('li');
  const div2 = Html('b').add('qwe');
  div.add(div2);
  expect(div.html).is('<li><b>qwe</b></li>');
});
Test("Html tag name", (Html) => {
  expect(Html('li').html).is('<li></li>');
});
Test("Html class name", (Html) => {
  expect(Html().class('qwe').html).is('<div class="qwe"></div>');
});
Test("Html of single value", (Single) => {
  expect(Single(5).html).is('5');
});
Test("Html children array", (Div) => {
  expect(Div(['qwe', 'asd']).html).is('<div>qweasd</div>');
});
Test("Html children Arr", (Div, Arr) => {
  expect(Div(Arr('qwe', 'asd')).html).is('<div>qweasd</div>');
});
nice.Type('Style')
  .about('Represents CSS style.');
const Style = nice.Style;
defGet(Html.proto, function hover(){
  const style = Style();
  this.assertClass();
  this.cssSelectors.set(':hover', style);
  return style;
});
def(Html.proto, 'Css', function(s = ''){
  s = s.toLowerCase();
  if(this.cssSelectors.has(s))
    return this.cssSelectors.get(s);
  this.assertClass();
  const style = Style();
  style.up = this;
  this.cssSelectors.set(s, style);
  return style;
});
function addCreator(type){
  def(Html.proto, type.name, function (...a){
    const res = type(...a);
    this.add(res);
    return res;
  });
  const _t = nice._decapitalize(type.name);
  _t in Html.proto || def(Html.proto, _t, function (...a){
    return this.add(type(...a));
  });
}
reflect.on('extension', ({child, parent}) => {
  if(parent === Html || Html.isPrototypeOf(parent)){
    addCreator(child);
  }
});
'alignContent,alignItems,alignSelf,alignmentBaseline,all,animation,animationDelay,animationDirection,animationDuration,animationFillMode,animationIterationCount,animationName,animationPlayState,animationTimingFunction,appearance,backdropFilter,backfaceVisibility,background,backgroundAttachment,backgroundBlendMode,backgroundClip,backgroundColor,backgroundImage,backgroundOrigin,backgroundPosition,backgroundPositionX,backgroundPositionY,backgroundRepeat,backgroundRepeatX,backgroundRepeatY,backgroundSize,baselineShift,blockSize,border,borderBlockEnd,borderBlockEndColor,borderBlockEndStyle,borderBlockEndWidth,borderBlockStart,borderBlockStartColor,borderBlockStartStyle,borderBlockStartWidth,borderBottom,borderBottomColor,borderBottomLeftRadius,borderBottomRightRadius,borderBottomStyle,borderBottomWidth,borderCollapse,borderColor,borderImage,borderImageOutset,borderImageRepeat,borderImageSlice,borderImageSource,borderImageWidth,borderInlineEnd,borderInlineEndColor,borderInlineEndStyle,borderInlineEndWidth,borderInlineStart,borderInlineStartColor,borderInlineStartStyle,borderInlineStartWidth,borderLeft,borderLeftColor,borderLeftStyle,borderLeftWidth,borderRadius,borderRight,borderRightColor,borderRightStyle,borderRightWidth,borderSpacing,borderStyle,borderTop,borderTopColor,borderTopLeftRadius,borderTopRightRadius,borderTopStyle,borderTopWidth,borderWidth,bottom,boxShadow,boxSizing,breakAfter,breakBefore,breakInside,bufferedRendering,captionSide,caretColor,clear,clip,clipPath,clipRule,color,colorInterpolation,colorInterpolationFilters,colorRendering,colorScheme,columnCount,columnFill,columnGap,columnRule,columnRuleColor,columnRuleStyle,columnRuleWidth,columnSpan,columnWidth,columns,contain,containIntrinsicSize,content,counterIncrement,counterReset,cursor,cx,cy,d,direction,display,dominantBaseline,emptyCells,fill,fillOpacity,fillRule,filter,flex,flexBasis,flexDirection,flexFlow,flexGrow,flexShrink,flexWrap,float,floodColor,floodOpacity,font,fontDisplay,fontFamily,fontFeatureSettings,fontKerning,fontOpticalSizing,fontSize,fontStretch,fontStyle,fontVariant,fontVariantCaps,fontVariantEastAsian,fontVariantLigatures,fontVariantNumeric,fontVariationSettings,fontWeight,gap,grid,gridArea,gridAutoColumns,gridAutoFlow,gridAutoRows,gridColumn,gridColumnEnd,gridColumnGap,gridColumnStart,gridGap,gridRow,gridRowEnd,gridRowGap,gridRowStart,gridTemplate,gridTemplateAreas,gridTemplateColumns,gridTemplateRows,height,hyphens,imageOrientation,imageRendering,inlineSize,isolation,justifyContent,justifyItems,justifySelf,left,letterSpacing,lightingColor,lineBreak,lineHeight,listStyle,listStyleImage,listStylePosition,listStyleType,margin,marginBlockEnd,marginBlockStart,marginBottom,marginInlineEnd,marginInlineStart,marginLeft,marginRight,marginTop,marker,markerEnd,markerMid,markerStart,mask,maskType,maxBlockSize,maxHeight,maxInlineSize,maxWidth,maxZoom,minBlockSize,minHeight,minInlineSize,minWidth,minZoom,mixBlendMode,objectFit,objectPosition,offset,offsetDistance,offsetPath,offsetRotate,opacity,order,orientation,orphans,outline,outlineColor,outlineOffset,outlineStyle,outlineWidth,overflow,overflowAnchor,overflowWrap,overflowX,overflowY,overscrollBehavior,overscrollBehaviorBlock,overscrollBehaviorInline,overscrollBehaviorX,overscrollBehaviorY,padding,paddingBlockEnd,paddingBlockStart,paddingBottom,paddingInlineEnd,paddingInlineStart,paddingLeft,paddingRight,paddingTop,pageBreakAfter,pageBreakBefore,pageBreakInside,paintOrder,perspective,perspectiveOrigin,placeContent,placeItems,placeSelf,pointerEvents,position,quotes,r,resize,right,rowGap,rubyPosition,rx,ry,scrollBehavior,scrollMargin,scrollMarginBlock,scrollMarginBlockEnd,scrollMarginBlockStart,scrollMarginBottom,scrollMarginInline,scrollMarginInlineEnd,scrollMarginInlineStart,scrollMarginLeft,scrollMarginRight,scrollMarginTop,scrollPadding,scrollPaddingBlock,scrollPaddingBlockEnd,scrollPaddingBlockStart,scrollPaddingBottom,scrollPaddingInline,scrollPaddingInlineEnd,scrollPaddingInlineStart,scrollPaddingLeft,scrollPaddingRight,scrollPaddingTop,scrollSnapAlign,scrollSnapStop,scrollSnapType,shapeImageThreshold,shapeMargin,shapeOutside,shapeRendering,size,speak,stopColor,stopOpacity,stroke,strokeDasharray,strokeDashoffset,strokeLinecap,strokeLinejoin,strokeMiterlimit,strokeOpacity,strokeWidth,tabSize,tableLayout,textAlign,textAlignLast,textAnchor,textCombineUpright,textDecoration,textDecorationColor,textDecorationLine,textDecorationSkipInk,textDecorationStyle,textIndent,textOrientation,textOverflow,textRendering,textShadow,textSizeAdjust,textTransform,textUnderlinePosition,top,touchAction,transform,transformBox,transformOrigin,transformStyle,transition,transitionDelay,transitionDuration,transitionProperty,transitionTimingFunction,unicodeBidi,unicodeRange,userSelect,userZoom,vectorEffect,verticalAlign,visibility,webkitAlignContent,webkitAlignItems,webkitAlignSelf,webkitAnimation,webkitAnimationDelay,webkitAnimationDirection,webkitAnimationDuration,webkitAnimationFillMode,webkitAnimationIterationCount,webkitAnimationName,webkitAnimationPlayState,webkitAnimationTimingFunction,webkitAppRegion,webkitAppearance,webkitBackfaceVisibility,webkitBackgroundClip,webkitBackgroundOrigin,webkitBackgroundSize,webkitBorderAfter,webkitBorderAfterColor,webkitBorderAfterStyle,webkitBorderAfterWidth,webkitBorderBefore,webkitBorderBeforeColor,webkitBorderBeforeStyle,webkitBorderBeforeWidth,webkitBorderBottomLeftRadius,webkitBorderBottomRightRadius,webkitBorderEnd,webkitBorderEndColor,webkitBorderEndStyle,webkitBorderEndWidth,webkitBorderHorizontalSpacing,webkitBorderImage,webkitBorderRadius,webkitBorderStart,webkitBorderStartColor,webkitBorderStartStyle,webkitBorderStartWidth,webkitBorderTopLeftRadius,webkitBorderTopRightRadius,webkitBorderVerticalSpacing,webkitBoxAlign,webkitBoxDecorationBreak,webkitBoxDirection,webkitBoxFlex,webkitBoxOrdinalGroup,webkitBoxOrient,webkitBoxPack,webkitBoxReflect,webkitBoxShadow,webkitBoxSizing,webkitClipPath,webkitColumnBreakAfter,webkitColumnBreakBefore,webkitColumnBreakInside,webkitColumnCount,webkitColumnGap,webkitColumnRule,webkitColumnRuleColor,webkitColumnRuleStyle,webkitColumnRuleWidth,webkitColumnSpan,webkitColumnWidth,webkitColumns,webkitFilter,webkitFlex,webkitFlexBasis,webkitFlexDirection,webkitFlexFlow,webkitFlexGrow,webkitFlexShrink,webkitFlexWrap,webkitFontFeatureSettings,webkitFontSizeDelta,webkitFontSmoothing,webkitHighlight,webkitHyphenateCharacter,webkitJustifyContent,webkitLineBreak,webkitLineClamp,webkitLocale,webkitLogicalHeight,webkitLogicalWidth,webkitMarginAfter,webkitMarginBefore,webkitMarginEnd,webkitMarginStart,webkitMask,webkitMaskBoxImage,webkitMaskBoxImageOutset,webkitMaskBoxImageRepeat,webkitMaskBoxImageSlice,webkitMaskBoxImageSource,webkitMaskBoxImageWidth,webkitMaskClip,webkitMaskComposite,webkitMaskImage,webkitMaskOrigin,webkitMaskPosition,webkitMaskPositionX,webkitMaskPositionY,webkitMaskRepeat,webkitMaskRepeatX,webkitMaskRepeatY,webkitMaskSize,webkitMaxLogicalHeight,webkitMaxLogicalWidth,webkitMinLogicalHeight,webkitMinLogicalWidth,webkitOpacity,webkitOrder,webkitPaddingAfter,webkitPaddingBefore,webkitPaddingEnd,webkitPaddingStart,webkitPerspective,webkitPerspectiveOrigin,webkitPerspectiveOriginX,webkitPerspectiveOriginY,webkitPrintColorAdjust,webkitRtlOrdering,webkitRubyPosition,webkitShapeImageThreshold,webkitShapeMargin,webkitShapeOutside,webkitTapHighlightColor,webkitTextCombine,webkitTextDecorationsInEffect,webkitTextEmphasis,webkitTextEmphasisColor,webkitTextEmphasisPosition,webkitTextEmphasisStyle,webkitTextFillColor,webkitTextOrientation,webkitTextSecurity,webkitTextSizeAdjust,webkitTextStroke,webkitTextStrokeColor,webkitTextStrokeWidth,webkitTransform,webkitTransformOrigin,webkitTransformOriginX,webkitTransformOriginY,webkitTransformOriginZ,webkitTransformStyle,webkitTransition,webkitTransitionDelay,webkitTransitionDuration,webkitTransitionProperty,webkitTransitionTimingFunction,webkitUserDrag,webkitUserModify,webkitUserSelect,webkitWritingMode,whiteSpace,widows,width,willChange,wordBreak,wordSpacing,wordWrap,writingMode,x,y,zIndex,zoom'
  .split(',').forEach( property => {
    def(Html.proto, property, function(...a) {
      const s = this.style;
      if(a.length === 0)
        return s[property]();
      nice.Switch(a[0])
        .isObject().use(o => _each(o, (v, k) => s.set(property + nice.capitalize(k), v)))
        .default.use(() => s.set(property, a.length > 1 ? nice.format(...a) : a[0]))
      return this;
    });
    def(Style.proto, property, function(...a) {
      nice.isObject(a[0])
        ? _each(a[0], (v, k) => this.set(property + nice.capitalize(k), v))
        : this.set(property, a.length > 1 ? nice.format(...a) : a[0]);
      return this;
    });
  });
'value,checked,accept,accesskey,action,align,alt,async,autocomplete,autofocus,autoplay,autosave,bgcolor,buffered,challenge,charset,cite,code,codebase,cols,colspan,contentEditable,contextmenu,controls,coords,crossorigin,data,datetime,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,for,form,formaction,headers,hidden,high,href,hreflang,icon,id,integrity,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,manifest,max,maxlength,media,method,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,seamless,selected,shape,sizes,slot,spellcheck,src,srcdoc,srclang,srcset,start,step,summary,tabindex,target,title,type,usemap,wrap'
  .split(',').forEach( property => {
    const f = function(...a){
      if(a.length){
        this.attributes.set(property, a.length > 1 ? nice.format(...a) : a[0]);
        return this;
      } else {
        return this.attributes.get(property);
      }
    };
    def(Html.proto, property, f);
    def(Html.proto, property.toLowerCase(), f);
  });
Test('Css propperty format', Div => {
  expect(Div().border('3px', 'silver', 'solid').html)
    .is('<div style="border:3px silver solid"></div>');
});
function text(z){
  return z.children
      .map(v => v.text
        ? v.text
        : nice.htmlEscape(nice.isFunction(v) ? v() : v))
      .jsValue.join('');
};
function compileStyle (s){
  let a = [];
  s.each((v, k) =>
    a.push(k.replace(/([A-Z])/g, "-$1").toLowerCase() + ':' + v));
  return a.join(';');
};
function compileSelectors (h){
  const a = [];
  h.cssSelectors.each((v, k) => a.push('.', getAutoClass(h.attributes.get('className')),
    ' ', k, '{', compileStyle(v), '}'));
  return a.length ? '<style>' + a.join('') + '</style>' : '';
};
const _html = v => v._isAnything ? v.html : nice.htmlEscape(v);
nice.ReadOnly.Single('html', z => _html(z._value));
nice.ReadOnly.Arr('html', z => z.reduceTo([], (a, v) => a.push(_html(v)))
    .map(_html).join(''));
function html(z){
  const tag = z.tag;
  const selectors = compileSelectors(z) || '';
  let as = '';
  let style = compileStyle(z.style);
  style && (as = ' style="' + style + '"');
  z.attributes.each((v, k) => {
    k === 'className' && (k = 'class', v.trim());
    as += ` ${k}="${v}"`;
  });
  let body = '';
  z.children.each(c => body += c._isAnything ? c.html : nice.htmlEscape(c));
  return `${selectors}<${tag}${as}>${body}</${tag}>`;
};
function toDom(e) {
  if(e === undefined)
    return document.createTextNode('');
  if(e && e._isBox)
    throw `toDom(e) shoud never recieve Box`;
  return e._isAnything
    ? e.dom
    : document.createTextNode(e);
 };
function dom(e){
  const res = document.createElement(e.tag);
  e.style.each((v, k) => {
    res.style[k] = '' + v;
  });
  e.attributes.each((v, k) => res[k] = v);
  e.children.each(c => attachNode(c, res));
  e.eventHandlers.each((ls, type) => {
    if(type === 'domNode')
      return ls.forEach(f => f(res));
    ls.forEach(f => res.addEventListener(type, f, true));
  });
  addSelectors(e.cssSelectors, res);
  return res;
}
const childrenCounter = (o, v) => {
  v && (o[v] ? o[v]++ : (o[v] = 1));
  return o;
};
function cancelNestedSubscription(subscription){
  const nested = subscription.nestedSubscription;
  nested.source.unsubscribe(nested);
  delete subscription.nestedSubscription;
  delete nested.parentSubscription;
  nested.nestedSubscription !== undefined && cancelNestedSubscription(nested);
}
function createSubscription(box, state, dom){
  const f = function(newState){
    if(f.nestedSubscription !== undefined){
      cancelNestedSubscription(f);
    }
    if(newState !== undefined && newState._isBox === true){
      f.nestedSubscription = createSubscription(newState, f.state, f.dom);
      f.nestedSubscription.parentSubscription = f;
      newState.subscribe(f.nestedSubscription);
    } else {
      const newDom = nice.refreshElement(newState, f.state, f.dom);
      if(newDom !== f.dom){
        f.dom = newDom;
        let parent = f;
        while (parent = parent.parentSubscription) {
          parent.dom = newDom;
        };
      }
    }
    f.state = newState;
  };
  dom.boxListener = f;
  f.dom = dom;
  f.source = box;
  f.state = state;
  return f;
}
function attachNode(child, parent, position){
  if(child && child._isBox){
    
    let state = '-';
    let dom = toDom(state);
    insertAt(parent, dom, position);
    child.subscribe(createSubscription(child, state, dom));
  } else {
    insertAt(parent, toDom(child), position);
  }
}
function detachNode(dom, parentDom){
  const f = dom.boxListener;
  f !== undefined && f.source.unsubscribe(f);
  const children = dom.childNodes;
  if(children !== undefined) {
    for (let child of children) {
      detachNode(child);
    }
  }
  parentDom !== undefined && parentDom.removeChild(dom);
}
const extractKey = v => {
  let res;
  if(v._isBox){
    return v.assertId();
  }
  if(v._isAnything){
    v = v.jsValue;
  }
  if(typeof v === 'object')
    res = v.id || v.attributes?.id || v.key;
  else
    res = v;
  return res;
};
defAll(nice, {
  refreshElement(e, old, domNode){
    const eTag = (e !== undefined) && e._isHtml && e.tag,
          oldTag = (old !== undefined) && old._isHtml && old.tag;
    let newDom = domNode;
    if (eTag !== oldTag){
      newDom = toDom(e);
      const children = domNode.childNodes;
      if(children !== undefined) {
        for (let child of children) {
          detachNode(child);
        }
      }
      domNode.parentNode.replaceChild(newDom, domNode);
    } else if(!eTag) {
      domNode.nodeValue = e;
    } else {
      
      const newStyle = e.style.jsValue, oldStyle = old.style.jsValue;
      _each(oldStyle, (v, k) => (k in newStyle) || (domNode.style[k] = ''));
      _each(newStyle, (v, k) => oldStyle[k] !== v && (domNode.style[k] = v));
      const newAtrs = e.attributes.jsValue, oldAtrs = old.attributes.jsValue;
      _each(oldAtrs, (v, k) => (k in newAtrs) || domNode.removeAttribute(k));
      _each(newAtrs, (v, k) => oldAtrs[k] !== v && domNode.setAttribute(k, v));
      const newHandlers = e.eventHandlers._value, oldHandlers = old.eventHandlers._value;
      nice._eachEach(oldHandlers, (f, i, type) => {
        if(!(newHandlers[type] && newHandlers[type].includes(f)))
          domNode.removeEventListener(type, f, true);
      });
      nice._eachEach(newHandlers, (f, i, type) => {
        if(!(oldHandlers[type] && oldHandlers[type].includes(f)))
          domNode.addEventListener(type, f, true);
      });
      nice.refreshChildren(e.children._value, old.children._value, domNode);
    }
    return newDom;
  },
  refreshChildren(aChildren, bChildren, domNode){
    const aKeys = aChildren.map(extractKey);
    const bKeys = bChildren.map(extractKey);
    const aCount = aKeys.reduce(childrenCounter, {});
    const bCount = bKeys.reduce(childrenCounter, {});
    let ai = 0, bi = 0;
    while(ai < aKeys.length){
      const aChild = aKeys[ai], bChild = bKeys[bi];
      
      if(aChild === bChild && aChild !== undefined){
        ai++, bi++;
      } else if(!bCount[aChild]){
        attachNode(aChildren[ai], domNode, ai);
        ai++;
      } else if(!aCount[bChild]) {
        detachNode(domNode.childNodes[ai], domNode);
        bi++;
      } else {
        
        const old = domNode.childNodes[bi];
        attachNode(aChildren[ai], domNode, bi);
        old && detachNode(old, domNode);
        ai++, bi++;
      }
    };
    while(bi < bKeys.length){
      detachNode(domNode.childNodes[ai], domNode);
      bi++;
    }
  },
  htmlEscape: s => (''+s).replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
});
const getAutoClass = s => s.match(/(_nn_\d+)/)[0];
if(nice.isEnvBrowser()){
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);
  runtime.styleSheet = styleEl.sheet;
  function insertBefore(node, newNode){
    node.parentNode.insertBefore(newNode, node);
    return newNode;
  }
  function insertAfter(node, newNode){
    node.parentNode.insertBefore(newNode, node.nextSibling);
    return newNode;
  }
  Func.Html('show', (div, parentNode = document.body, position) => {
    return insertAt(parentNode, div.dom, position);
  });
}
function insertAt(parent, node, position){
  typeof position === 'number'
    ? parent.insertBefore(node, parent.childNodes[position])
    : parent.appendChild(node);
  return node;
}
def(nice, 'iterateNodesTree', (f, node = document.body) => {
  f(node);
  if(node.childNodes)
    for (let n of node.childNodes) {
      nice.iterateNodesTree(f, n);
    };
});
if(nice.isEnvBrowser()){
  function killNode(n){
    n && n !== document.body && n.parentNode && n.parentNode.removeChild(n);
    n && nice._eachEach(n.__niceListeners, (listener, i, type) => {
      n.removeEventListener(type, listener);
    });
  }
  function insertBefore(node, newNode){
    node.parentNode.insertBefore(newNode, node);
    return newNode;
  }
  function insertAfter(node, newNode){
    node.parentNode.insertBefore(newNode, node.nextSibling);
    return newNode;
  }
  Func.primitive('show', (v, parentNode = document.body, position) => {
    const node = document.createTextNode(v);
    return insertAt(parentNode, node, position);
  });
  Func.primitive('hide', (v, node) => {
    killNode(node);
  });
  Func.Single('show', (e, parentNode = document.body, position) => {
    const node = document.createTextNode('');
    e._shownNodes = e._shownNodes || new WeakMap();
    e._shownNodes.set(node, e.listen(v => node.nodeValue = v()));
    return insertAt(parentNode, node, position);
  });
  Func.Single('hide', (e, node) => {
    const subscription = e._shownNodes && e._shownNodes.get(node);
    subscription();
    killNode(node);
  });
  Func.Nothing('show', (e, parentNode = document.body, position) => {
    return insertAt(parentNode, document.createTextNode(''), position);
  });
  Func.Err('show', (e, parentNode = document.body, position) => {
    return insertAt(parentNode,
        document.createTextNode('Error: ' + e().message), position);
  });
  Func.Bool('show', (e, parentNode = document.body, position) => {
    if(e())
      throw `I don't know how to display "true"`;
    return insertAt(parentNode, document.createTextNode(''), position);
  });
  Func.Html('show', (e, parentNode = document.body, position = 0) => {
    const node = document.createElement(e.tag());
    
    insertAt(parentNode, node, position);
    e.attachNode(node);
    return node;
  });
  Func.Html('hide', (e, node) => {
    const subscriptions = e._shownNodes && e._shownNodes.get(node);
    e._shownNodes.delete(node);
    subscriptions && subscriptions.forEach(f => f());
    node && e.children.each((c, k) => nice.hide(c, node.childNodes[0]));
    killNode(node);
  });
  function removeNode(node, v){
    node && node.parentNode.removeChild(node);
    v && v.cssSelectors && v.cssSelectors.size && killAllRules(v);
  }
};
const addRules = (vs, selector, className) => {
  const rule = assertRule(selector, className);
  vs.each((value, prop) => rule.style[prop] = value);
};
const findRule = (selector, className) => {
  const s = `.${className} ${selector}`.toLowerCase();
  let rule;
  for (const r of runtime.styleSheet.cssRules)
    r.selectorText === s && (rule = r);
  return rule;
};
const findRuleindex = (selector, className) => {
  const s = `.${className} ${selector}`.toLowerCase();
  let res;
  const rules = runtime.styleSheet.cssRules;
  for (const i in rules)
    rules[i].selectorText === s && (res = i);
  return res;
};
const assertRule = (selector, className) => {
  return findRule(selector, className) || runtime.styleSheet
      .cssRules[runtime.styleSheet.insertRule(`.${className}${selector}` + '{}')];
};
function killSelectors(v) {
  const c = getAutoClass(v.attributes.get('className'));
  v.cssSelectors.each((v, k) => killRules(v, k, c));
};
const killRules = (vs, selector, id) => {
  const rule = findRule(selector, id);
  rule && vs.each((value, prop) => rule.style[prop] = null);
};
const killAllRules = v => {
  const c = getAutoClass(v.attributes.get('className'));
  const a = [];
  [...runtime.styleSheet.cssRules].forEach((r, i) =>
      r.selectorText.indexOf(c) === 1 && a.unshift(i));
  a.forEach(i => runtime.styleSheet.deleteRule(i));
};
function addSelectors(selectors, node){
  selectors.each((v, k) => addRules(v, k, getAutoClass(node.className)));
};
})();
(function(){"use strict";const Html = nice.Html;
'Div,I,B,Span,H1,H2,H3,H4,H5,H6,P,Li,Ul,Ol,Pre,Table,Tr,Td,Th'.split(',').forEach(t => {
  const l = t.toLowerCase();
  Html.extend(t).by((z, a, ...as) => {
    z.tag = l;
    if(a === undefined)
      return;
    const type = nice.getType(a).name;
    constructors[type]
      ? constructors[type](z, a, as[0] || ((t === 'Li' || t === 'Ol')
        ? (v => (v && v._isLi) ? v : nice.Li(v))
        : (v => v)))
      : z.add(a, ...as);
  })
    .about('Represents HTML <%s> element.', l);
});
const protocolRe = /^([a-zA-Z0-9]{3,5})\:\/\//;
Html.extend('A').by((z, url, ...children) => {
  z.tag = 'a';
  z.add(...children);
  if (nice.isFunction(url) && !url._isAnything) {
    z.on('click', e => {url(e); e.preventDefault();}).href('#');
  } else {
    const router = nice.Html.linkRouter;
    if(!router || (protocolRe.exec(url) && !url.startsWith(router.origin))) {
      z.href(url || '#');
    } else {
      z.on('click', e => e.preventDefault(router.go(url))).href(url);
    }
  }
}).about('Represents HTML <a> element.');
Html.extend('Img').by((z, src, x, y) => {
  z.tag = 'img';
  z.src(src);
  x === undefined || z.width(x);
  y === undefined || z.height(y);
})
  .about('Represents HTML <img> element.');
const constructors = {
  Object: (z, o, f) => Object.values(o).forEach((v, k) => z.add(f(v, k))),
  Arr: (z, a, f) => a.each((v, k) => z.add(f(v, k))),
  Array: (z, a, f) => a.forEach((v, k) => z.add(f(v, k)))
};
})();
(function(){"use strict";
const Html = nice.Html;
function defaultSetValue(t, v){
  t.attributes.set('value', v);
};
const changeEvents = ['change', 'keyup', 'paste', 'search', 'input'];
function attachValue(target, setValue = defaultSetValue, value){
  let node, mute, box;
  if(value && value._isBox){
    box = value;
    
    setValue(target, value());
  } else {
    box = nice.Box(value || "");
    setValue(target, value || "");
  }
  def(target, 'value', box);
  if(nice.isEnvBrowser()){
    changeEvents.forEach(k => target.on(k, e => {
      mute = true;
      target.value((e.target || e.srcElement).value);
      mute = false;
      return true;
    }));
    target.assertId();
    target.on('domNode', n => {
      node = n;
      node.value = box();
    });
  }
  target.value.on('state', v => {
    if(mute)
      return;
    node ? node.value = v : setValue(target, v);
  });
  return target;
}
Html.extend('Input', (z, type) => {
    z.tag = 'input';
    z.attributes.set('type', type || 'text');
    attachValue(z);
  })
  .about('Represents HTML <input> element.');
const Input = nice.Input;
Html.extend('Button', (z, text = '', action) => {
    z.super('button').on('click', action);
    z.add(text);
  })
  .about('Represents HTML <input type="button"> element.');
Input.extend('Textarea', (z, value) => {
    z.tag = 'textarea';
    attachValue(z, (t, v) =>  t.children.removeAll().push(v), value);
  })
  .about('Represents HTML <textarea> element.');
Test(Textarea => {
  const ta = Textarea('qwe');
  expect(ta.value()).is('qwe');
});
Html.extend('Submit', (z, text, action) => {
    z.tag = 'input';
    z.attributes.set('type', 'submit');
    z.attributes.set('value',  text || 'Submit');
    action && z.on('click', action);
  })
  .about('Represents HTML <input type="submit"> element.');
Html.extend('Form', (z, handler) => {
    z.tag = 'form';
    handler && z.on('submit', e => {
      const input = {}, form = e.currentTarget;
      e.preventDefault();
      for(let field of form.elements) {
        field.name && (input[field.name] = field.value);
      }
        handler(input);
    });
  })
  .about('Represents HTML <input type="submit"> element.');
Input.extend('Checkbox', (z, status) => {
    let node;
    z.tag = 'input';
    z.attributes.set('type', 'checkbox');
    const value = Box(status || false);
    def(z, 'checked', value);
    def(z, 'value', value);
    let mute;
    z.on('change', e => {
      mute = true;
      value((e.target || e.srcElement).checked);
      mute = false;
      return true;
    });
    if(nice.isEnvBrowser()){
      z.assertId();
      z.on('domNode', n => node = n);
    }
    value.subscribe(v => node ? node.checked = v : z.attributes.set('checked', v));
  })
  .about('Represents HTML <input type="checkbox"> element.');
  Input.extend('Select', (z, values) => {
    let node;
    z.tag = 'select';
    const value = Box(null);
    def(z, 'value', value);
    let mute;
    z.on('change', e => {
      mute = true;
      value((e.target || e.srcElement).value);
      mute = false;
      return true;
    });
    if(nice.isEnvBrowser()){
      z.assertId();
      z.on('domNode', n => node = n);
    }
    z.options.listenChildren(v => z.add(Html('option').add(v.label)
        .apply(o => o.attributes.set('value', v.value)))
    );
    Switch(values)
      .isObject().each(z.option.bind(z))
      .isArray().each(v => Switch(v)
        .isObject().use(o => z.options.push(o))
        .default.use(z.option.bind(z)));
    value.listen(v => node && z.options.each((o, k) =>
        o.value == v && (node.selectedIndex = k)));
  })
  .arr('options')
  .Action.about('Adds Option HTML element to Select HTML element.')
    (function option(z, label, value){
      value === undefined && (value = label);
      z.options.push({label, value});
    })
  .about('Represents HTML <select> element.');
})();
(function(){"use strict";const paramsRe = /\:([A-Za-z0-9_]+)/g;
nice.Type('Router')
  .object('staticRoutes')
  .arr('queryRoutes')
  .Method(addRoute)
  .Method(function resolve(z, path){
    path[0] === '/' || (path = '/' + path);
    let url = path;
    const query = {};
    const i = url.indexOf('?');
    if(i >= 0){
      url.substring(i+1).split('&').forEach(v => {
        const pair = v.split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
      });
      url = url.substring(0, i);
    }
    const rurl = '/' + nice.trimRight(url, '/');
    let route = z.staticRoutes[url];
    route || z.queryRoutes.some(f => route = f(url, query));
    return route || (() => `Page "${url}" not found`);
  });
function addRoute(router, pattern, f){
  if(!pattern || pattern === '/'){
    router.staticRoutes['/'] = f;
    return router;
  }
  pattern[0] === '/' || (pattern = '/' + pattern);
  const params = pattern.match(paramsRe);
  if(!params){
    router.staticRoutes[nice.trimRight(pattern, '/')] = f;
    return router;
  }
  const s = pattern.replace('.', '\\.');
  const re = new RegExp('^' + s.replace(paramsRe, '(.+)'));
  const res = (s, query) => {
    const a = re.exec(s);
    if(!a)
      return false;
    params.forEach((v, k) => query[v.substr(1)] = a[k+1]);
    return () => f(query);
  };
  res.pattern = pattern;
  const i = router.queryRoutes
      .map(r => r.pattern)
      .sortedIndex(pattern, nice.routeSort);
  router.queryRoutes.insertAt(i, res);
  return router;
}
Test((Router, Spy) => {
  const r = Router();
  const f = () => 1;
  r.addRoute('/', f);
  expect(r.resolve('/')).is(f);
  let res;
  const f2 = o => res = o.id;
  r.addRoute('/page/:id', f2);
  r.resolve('/page/123')();
  expect(res).is('123');
});
nice.Type({
  name: 'WindowRouter',
  extends: 'Router',
  initBy: (z, div = nice.Div()) => {
    if(window && window.addEventListener){
      nice.Html.linkRouter = z;
      z.origin = window.location.origin;
      div.add(nice.RBox(z.currentUrl, url => {
        const route = z.resolve(url);
        let content = route();
        if(content.__proto__ === Object.prototype && content.content){
          content.title && (window.document.title = content.title);
          content = content.content;
        }
        if(Array.isArray(content))
          content = nice.Div(...content);
        return content;
      })).show();
      window.addEventListener('popstate', function(e) {
        z.currentUrl(e.target.location.pathname);
        return false;
      });
    }
  },
})
  .box('currentUrl')
  .Method(go);
function go(z, originalUrl){
  let url = originalUrl.pathname || originalUrl;
  const location = window.location;
  const origin = location.origin;
  if(url.startsWith(origin))
    url = url.substr(origin.length);
  z.currentUrl(url);
  if(location.pathname + location.hash !== url)
    window.history.pushState(url, url, url);
  window.scrollTo(0, 0);
}
})();
(function(){"use strict";Test((genereteAutoId) => {
  expect(genereteAutoId()).isString();
  expect(genereteAutoId()).not.is(genereteAutoId());
});
Test("named type", (Type) => {
  Type('Cat').str('name');
  const cat = nice.Cat().name('Ball');
  expect(cat._type.name).is('Cat');
  expect(cat.name()).is('Ball');
});
Test("primitive property", (Type) => {
  Type('Cat2').string('name', 'a cat');
  const cat = nice.Cat2();
  expect(cat.name).is('a cat');
  cat.name = 'Ball';
  expect(cat.name === 'Ball').is(true);
});
Test("primitive type check", (Type) => {
  Type('Cat3').string('name');
  const cat = nice.Cat2();
  expect(() => cat.name(2)).throws();
  cat.name = 2;
  expect(cat.name).is('2');
  cat.name = ['Cat #%d', 2];
  expect(cat.name).is('Cat #2');
});
Test("js object property", (Type) => {
  Type('Cat41').object('friends');
  const cat = nice.Cat41();
  expect(cat.friends).deepEqual({});
  cat.friends['Ball'] = 1;
  expect(cat.friends.Ball).is(1);
  expect(() => cat.friends = 2).throws();
});
Test("js array property", (Type) => {
  Type('Cat4').array('friends');
  const cat = nice.Cat4();
  expect(cat.friends).deepEqual([]);
  cat.friends.push('Ball');
  expect(cat.friends).deepEqual(['Ball']);
  expect(() => cat.friends = 2).throws();
});
Test('isFunction', (isFunction) => {
  const x = nice(1);
  expect(x).not.isFunction();
  expect(() => 1).isFunction();
});
Test('isError', (isError) => {
  const x = new Error('qwe');
  expect(x).isError();
  const x2 = new SyntaxError('qwe');
  expect(x2).isError();
  expect(x2).isSyntaxError();
});
Test((times) => {
  const x = times(2, (n, a) => a.push(n), []);
  expect(x).deepEqual([0,1]);
});
})();;nice.version = "0.3.3";})();; export let length = nice.length,name = nice.name,_counter = nice._counter,define = nice.define,defineAll = nice.defineAll,TYPE_KEY = nice.TYPE_KEY,SOURCE_ERROR = nice.SOURCE_ERROR,LOCKED_ERROR = nice.LOCKED_ERROR,curry = nice.curry,_createItem = nice._createItem,_initItem = nice._initItem,_setType = nice._setType,_newItem = nice._newItem,valueType = nice.valueType,defineCached = nice.defineCached,defineGetter = nice.defineGetter,types = nice.types,checkTypeName = nice.checkTypeName,registerType = nice.registerType,_each = nice._each,_removeArrayValue = nice._removeArrayValue,_removeValue = nice._removeValue,serialize = nice.serialize,deserialize = nice.deserialize,apply = nice.apply,AUTO_PREFIX = nice.AUTO_PREFIX,genereteAutoId = nice.genereteAutoId,_map = nice._map,_pick = nice._pick,_size = nice._size,orderedStringify = nice.orderedStringify,objDiggDefault = nice.objDiggDefault,objDiggMin = nice.objDiggMin,objDiggMax = nice.objDiggMax,objMax = nice.objMax,objByKeys = nice.objByKeys,eraseProperty = nice.eraseProperty,rewriteProperty = nice.rewriteProperty,stripFunction = nice.stripFunction,stringCutBegining = nice.stringCutBegining,seconds = nice.seconds,minutes = nice.minutes,speedTest = nice.speedTest,generateId = nice.generateId,parseTraceString = nice.parseTraceString,create = nice.create,_eachEach = nice._eachEach,format = nice.format,objectComparer = nice.objectComparer,mapper = nice.mapper,clone = nice.clone,cloneDeep = nice.cloneDeep,diff = nice.diff,memoize = nice.memoize,once = nice.once,argumentNames = nice.argumentNames,prototypes = nice.prototypes,keyPosition = nice.keyPosition,_capitalize = nice._capitalize,_decapitalize = nice._decapitalize,times = nice.times,fromJson = nice.fromJson,Configurator = nice.Configurator,generateDoc = nice.generateDoc,_set = nice._set,_get = nice._get,eventEmitter = nice.eventEmitter,EventEmitter = nice.EventEmitter,reflect = nice.reflect,jsTypes = nice.jsTypes,jsBasicTypesMap = nice.jsBasicTypesMap,typesToJsTypesMap = nice.typesToJsTypesMap,jsBasicTypes = nice.jsBasicTypes,Anything = nice.Anything,ANYTHING = nice.ANYTHING,extend = nice.extend,type = nice.type,Type = nice.Type,typeOf = nice.typeOf,getType = nice.getType,Func = nice.Func,Action = nice.Action,Mapping = nice.Mapping,Check = nice.Check,ReadOnly = nice.ReadOnly,Test = nice.Test,runTests = nice.runTests,isCheck = nice.isCheck,isAction = nice.isAction,isMapping = nice.isMapping,is = nice.is,isExactly = nice.isExactly,deepEqual = nice.deepEqual,isTrue = nice.isTrue,isFalse = nice.isFalse,isAnyOf = nice.isAnyOf,isTruly = nice.isTruly,isFalsy = nice.isFalsy,isEmpty = nice.isEmpty,isSubType = nice.isSubType,isEnvBrowser = nice.isEnvBrowser,throws = nice.throws,isjs = nice.isjs,isprimitive = nice.isprimitive,isObject = nice.isObject,isString = nice.isString,isBoolean = nice.isBoolean,isNumber = nice.isNumber,isundefined = nice.isundefined,isnull = nice.isnull,isSymbol = nice.isSymbol,isFunction = nice.isFunction,isDate = nice.isDate,isRegExp = nice.isRegExp,isArray = nice.isArray,isError = nice.isError,isArrayBuffer = nice.isArrayBuffer,isDataView = nice.isDataView,isMap = nice.isMap,isWeakMap = nice.isWeakMap,isSet = nice.isSet,isWeakSet = nice.isWeakSet,isPromise = nice.isPromise,isEvalError = nice.isEvalError,isRangeError = nice.isRangeError,isReferenceError = nice.isReferenceError,isSyntaxError = nice.isSyntaxError,isTypeError = nice.isTypeError,isUriError = nice.isUriError,isAnything = nice.isAnything,Switch = nice.Switch,expectPrototype = nice.expectPrototype,expect = nice.expect,Spy = nice.Spy,isSpy = nice.isSpy,logCalls = nice.logCalls,called = nice.called,calledOnce = nice.calledOnce,calledTwice = nice.calledTwice,calledTimes = nice.calledTimes,calledWith = nice.calledWith,isType = nice.isType,Nothing = nice.Nothing,isNothing = nice.isNothing,Undefined = nice.Undefined,isUndefined = nice.isUndefined,Null = nice.Null,isNull = nice.isNull,NotFound = nice.NotFound,isNotFound = nice.isNotFound,Fail = nice.Fail,isFail = nice.isFail,Pending = nice.Pending,isPending = nice.isPending,Stop = nice.Stop,isStop = nice.isStop,NumberError = nice.NumberError,isNumberError = nice.isNumberError,AssignmentError = nice.AssignmentError,isAssignmentError = nice.isAssignmentError,Something = nice.Something,isSomething = nice.isSomething,Ok = nice.Ok,isOk = nice.isOk,simpleTypes = nice.simpleTypes,partial = nice.partial,Box = nice.Box,isBox = nice.isBox,assign = nice.assign,push = nice.push,BoxSet = nice.BoxSet,isBoxSet = nice.isBoxSet,RBox = nice.RBox,isRBox = nice.isRBox,IntervalBox = nice.IntervalBox,isIntervalBox = nice.isIntervalBox,changeAfter = nice.changeAfter,Stream = nice.Stream,isStream = nice.isStream,or = nice.or,and = nice.and,nor = nice.nor,xor = nice.xor,Value = nice.Value,isValue = nice.isValue,Obj = nice.Obj,isObj = nice.isObj,size = nice.size,each = nice.each,has = nice.has,setDefault = nice.setDefault,get = nice.get,set = nice.set,remove = nice.remove,removeAll = nice.removeAll,reduce = nice.reduce,mapToArray = nice.mapToArray,map = nice.map,filter = nice.filter,sum = nice.sum,some = nice.some,every = nice.every,find = nice.find,findKey = nice.findKey,count = nice.count,includes = nice.includes,getProperties = nice.getProperties,reduceTo = nice.reduceTo,Err = nice.Err,isErr = nice.isErr,Single = nice.Single,isSingle = nice.isSingle,Str = nice.Str,isStr = nice.isStr,endsWith = nice.endsWith,startsWith = nice.startsWith,test = nice.test,trimLeft = nice.trimLeft,trimRight = nice.trimRight,trim = nice.trim,truncate = nice.truncate,capitalize = nice.capitalize,deCapitalize = nice.deCapitalize,toLocaleLowerCase = nice.toLocaleLowerCase,toLocaleUpperCase = nice.toLocaleUpperCase,toLowerCase = nice.toLowerCase,toUpperCase = nice.toUpperCase,charAt = nice.charAt,charCodeAt = nice.charCodeAt,codePointAt = nice.codePointAt,concat = nice.concat,indexOf = nice.indexOf,lastIndexOf = nice.lastIndexOf,normalize = nice.normalize,padEnd = nice.padEnd,padStart = nice.padStart,repeat = nice.repeat,substr = nice.substr,substring = nice.substring,slice = nice.slice,split = nice.split,search = nice.search,replace = nice.replace,match = nice.match,localeCompare = nice.localeCompare,fromCharCode = nice.fromCharCode,fromCodePoint = nice.fromCodePoint,Arr = nice.Arr,isArr = nice.isArr,reduceRight = nice.reduceRight,join = nice.join,unshift = nice.unshift,add = nice.add,pull = nice.pull,insertAt = nice.insertAt,insertAfter = nice.insertAfter,callEach = nice.callEach,removeValue = nice.removeValue,eachRight = nice.eachRight,fill = nice.fill,random = nice.random,sortedIndex = nice.sortedIndex,intersection = nice.intersection,intersperse = nice.intersperse,last = nice.last,first = nice.first,firstN = nice.firstN,Num = nice.Num,isNum = nice.isNum,between = nice.between,integer = nice.integer,saveInteger = nice.saveInteger,finite = nice.finite,lt = nice.lt,lte = nice.lte,gt = nice.gt,gte = nice.gte,difference = nice.difference,product = nice.product,fraction = nice.fraction,reminder = nice.reminder,next = nice.next,previous = nice.previous,acos = nice.acos,asin = nice.asin,atan = nice.atan,ceil = nice.ceil,clz32 = nice.clz32,floor = nice.floor,fround = nice.fround,imul = nice.imul,max = nice.max,min = nice.min,round = nice.round,sqrt = nice.sqrt,trunc = nice.trunc,abs = nice.abs,exp = nice.exp,log = nice.log,atan2 = nice.atan2,pow = nice.pow,sign = nice.sign,asinh = nice.asinh,acosh = nice.acosh,atanh = nice.atanh,hypot = nice.hypot,cbrt = nice.cbrt,cos = nice.cos,sin = nice.sin,tan = nice.tan,sinh = nice.sinh,cosh = nice.cosh,tanh = nice.tanh,log10 = nice.log10,log2 = nice.log2,log1pexpm1 = nice.log1pexpm1,clamp = nice.clamp,inc = nice.inc,dec = nice.dec,divide = nice.divide,multiply = nice.multiply,negate = nice.negate,setMax = nice.setMax,setMin = nice.setMin,Bool = nice.Bool,isBool = nice.isBool,turnOn = nice.turnOn,turnOff = nice.turnOff,toggle = nice.toggle,Range = nice.Range,isRange = nice.isRange,toArray = nice.toArray,within = nice.within,Html = nice.Html,isHtml = nice.isHtml,on = nice.on,off = nice.off,assertId = nice.assertId,assertClass = nice.assertClass,scrollTo = nice.scrollTo,focus = nice.focus,Style = nice.Style,isStyle = nice.isStyle,refreshElement = nice.refreshElement,refreshChildren = nice.refreshChildren,htmlEscape = nice.htmlEscape,iterateNodesTree = nice.iterateNodesTree,Div = nice.Div,isDiv = nice.isDiv,I = nice.I,isI = nice.isI,B = nice.B,isB = nice.isB,Span = nice.Span,isSpan = nice.isSpan,H1 = nice.H1,isH1 = nice.isH1,H2 = nice.H2,isH2 = nice.isH2,H3 = nice.H3,isH3 = nice.isH3,H4 = nice.H4,isH4 = nice.isH4,H5 = nice.H5,isH5 = nice.isH5,H6 = nice.H6,isH6 = nice.isH6,P = nice.P,isP = nice.isP,Li = nice.Li,isLi = nice.isLi,Ul = nice.Ul,isUl = nice.isUl,Ol = nice.Ol,isOl = nice.isOl,Pre = nice.Pre,isPre = nice.isPre,Table = nice.Table,isTable = nice.isTable,Tr = nice.Tr,isTr = nice.isTr,Td = nice.Td,isTd = nice.isTd,Th = nice.Th,isTh = nice.isTh,A = nice.A,isA = nice.isA,Img = nice.Img,isImg = nice.isImg,Input = nice.Input,isInput = nice.isInput,Button = nice.Button,isButton = nice.isButton,Textarea = nice.Textarea,isTextarea = nice.isTextarea,Submit = nice.Submit,isSubmit = nice.isSubmit,Form = nice.Form,isForm = nice.isForm,Checkbox = nice.Checkbox,isCheckbox = nice.isCheckbox,Select = nice.Select,isSelect = nice.isSelect,option = nice.option,Router = nice.Router,isRouter = nice.isRouter,addRoute = nice.addRoute,resolve = nice.resolve,WindowRouter = nice.WindowRouter,isWindowRouter = nice.isWindowRouter,go = nice.go,version = nice.version; export default nice;