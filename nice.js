let nice;(function(){const IS_BROWSER = typeof window !== "undefined";let create,Div,NotFound,Func,Test,Switch,expect,is,_each,def,defAll,defGet,Anything,Action,Mapping,Check,reflect,Err,each;
(function(){"use strict";nice = (...a) => {
  if(a.length === 0)
    return reflect.createItem(Anything);
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
  _each: (o, f) => {
    if(o)
      for(let i in o)
        if(i !== nice.TYPE_KEY)
          f(o[i], i);
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
})();
(function(){"use strict";def(nice, 'reflect', {
  functions:{},
  types:{},
  bodies:[],
  list (name) {
    this._events[name].forEach(e => console.log(e));
  },
  registerType (type) {
    const name = type.name;
    name[0] !== name[0].toUpperCase() &&
      nice.error('Please start type name with a upper case letter');
    reflect.types[name] = type;
    def(nice, name, type);
    def(type.proto, '_is' + name, true);
    reflect.emitAndSave('type', type);
  },
  createItem(type, args){
    if(!type._isNiceType)
      throw new Error('Bad type');
    if(type.hasOwnProperty('abstract'))
      throw new Error(type.name + ' is abstract type.');
    let item;
    if(type.isFunction === true){
      item = reflect.newItem();
      Object.setPrototypeOf(item, type.proto);
    } else {
      item = Object.create(type.proto);
    }
    item._type = type;
    if("defaultValueBy" in type){
      item._value = type.defaultValueBy();
    };
    reflect.initItem(item, type, args);
    return item;
  },
  initItem(z, type, args) {
    if(args === undefined || args.length === 0){
      type.initBy && type.initBy(z);
    } else if (type.initBy){
      type.initBy(z, ...args);
    } else {
      throw type.name + ' doesn\'t know what to do with arguments';
    }
    return z;
  },
  newItem() {
    
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
  }
});
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
  _every (o, f) {
    for(let i in o)
      if(!f(o[i], i))
        return false;
    return true;
  },
  _some (o, f) {
    for(let i in o)
      if(f(o[i], i))
        return true;
    return false;
  },
  sortedPosition(a, v, f = (a, b) => a === b ? 0 : a > b ? 1 : -1){
    let low = 0;
    let high = a.length;
    while (low < high) {
      let m = (high + low) >> 1;
      let cmp = f(a[m], v);
      if (cmp < 0) {
        low = m + 1;
      } else if(cmp > 0) {
        high = m;
      } else {
        return m;
      }
    }
    return low;
  },
  _if(c, f1, f2) {
    return c ? f1(c) : (typeof f2 === 'function' ? f2(c) : f2);
  },
  orderedStringify: o => o === null
    ? 'null'
    : !nice.isObject(o)
      ? JSON.stringify(o)
      : Array.isArray(o)
        ? '[' + o.map(v => nice.orderedStringify(v)).join(',') + ']'
        : '{' + nice.reduceTo(Object.keys(o).sort(), [], (a, key) => {
            a.push("\"" + key + '\":' + nice.orderedStringify(o[key]));
          }).join(',') + '}',
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
    return a ? { location: '/' + a[1], line: +a[2], symbol: +a[3]} : a;
  },
  throttle (f, dt = 250) {
    let lastT = 0, lastAs = null, lastThis = null, r, timeout = null;
    return function (...as) {
      const t = Date.now();
      lastThis = this;
      if((lastT + dt) < t){
        r = f.apply(lastThis, as);
        lastT = t;
      } else {
        lastAs = as;
        if(timeout === null){
          timeout = setTimeout(() => {
            timeout = null;
            r = f.apply(lastThis, as);
            lastT = t;
            lastAs = null;
            lastThis = null;
          }, dt);
        }
      }
      return r;
    };
  },
  throttleTrailing (f, dt = 250) {
    let lAs = null, lThis = null, r, t = null;
    return function (...as) {
      lThis = this;
      lAs = as;
      if(t === null){
        t = setTimeout(() => {
          t = null;
          r = f.apply(lThis, lAs);
          lAs = null;
        }, dt);
      }
      return r;
    };
  },
  throttleLeading (f, dt = 250) {
    let lastT = 0, r;
    return function (...as) {
      const t = Date.now();
      if((lastT + dt) < t){
        r = f.apply(this, as);
        lastT = t;
      }
      return r;
    };
  },
  _count (o, f){
    let n = 0;
    _each(o, (v, k) => f(v,k,o) && n++);
    return n;
  },
  _findFirstKeys (o, f, n) {
    const res = [];
    for(let k in o){
      if(f(o[k], k)){
        res.push(k);
        if(res.length === n)
          break;
      }
    };
    return res;
  }
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
      res = reflect.newItem(o._type);
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
  memoize: (f, keyConverter) => {
    const res = (...a) => {
      const key = keyConverter ? keyConverter(a) : a[0];
      if(key in res.cache)
        return res.cache[key];
      return res.cache[key] = f(...a);
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
  times: (n, f, a) => {
    n = n > 0 ? n : 0;
    let i = 0;
    if(Array.isArray(a)){
      while(i < n)
        a.push(f(i++, a));
    } else if (a !== undefined){
      throw 'Accumulator should be an Array';
    } else {
      while(i < n)
        f(i++);
    }
    return a;
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
    
    o.type = s.type;
    res.functions.push(o);
    (res.fs[s.name] = res.fs[s.name] || {})[o.title] = o;
  });
  reflect.on('type', t => {
    if(!t.name || t.name[0] === '_')
      return;
    const o = { title: t.name, properties: [] };
    t.hasOwnProperty('description') && (o.description = t.description);
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
      es && es[name] && es[name].forEach(v =>
        f.notify ? f.notify(...v) : f(...v));
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
    this.listeners(name).forEach(f => {
      f.notify
        ? f.notify(...a)
        : Function.prototype.apply.apply(f, [this, a]);
    });
    return this;
  },
  emitAndSave (name, ...a) {
    assertEvents(this, name).push(a);
    this.emit(name, ...a)
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
create(EventEmitter, nice.reflect);
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
  'undefined': 'Undefined',
  'null': 'Null'
};
nice.jsBasicTypesMap = {
  object: 'Obj',
  array: 'Arr',
  number: 'Num',
  boolean: 'Bool',
  string: 'Str',
};
nice.typesToJsTypesMap = {
  Str: 'String',
  Num: 'Number',
  Obj: 'Object',
  Arr: 'Array',
  Bool: 'Boolean',
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
nice.jsTypes.Function.primitiveName = 'function';
})();
(function(){"use strict";reflect.registerType({
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
})();
(function(){"use strict";def(nice, function extend(child, parent){
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
let _counter = 0;
defAll(nice, {
  type: t => {
    typeof t === 'string' && (t = nice[t]);
    expect(Anything.isPrototypeOf(t) || Anything === t,
      '' + t + ' is not a type').is(true);
    return t;
  },
  Type: (config = {}, by) => {
    if(typeof config === 'string'){
      if(reflect.types[config])
        throw `Type "${config}" already exists`;
      config = {name: config};
    }
    nice.isObject(config)
      || nice.error("Need object for type's prototype");
    config.name = config.name || 'Type_' + (_counter++);
    config.types = {};
    config.proto = config.proto || {};
    config.configProto = config.configProto || {};
    config.defaultArguments = config.defaultArguments || {};
    by === undefined || (config.initBy = by);
    if(config.customCall !== undefined || config.itemArgs0 !== undefined
        || config.itemArgs1 !== undefined || config.itemArgsN !== undefined){
      config.isFunction = true;
    }
    const type = (...a) => reflect.createItem(type, a);
    Object.defineProperty(type, 'name', { writable: true });
    Object.assign(type, config);
    nice.extend(type, 'extends' in config ? nice.type(config.extends) : nice.Obj);
    const cfg = create(config.configProto, nice.Configurator(type, ''));
    config.name && reflect.registerType(type);
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
    res.push(`const cur = args[${step}];
const type = cur._type === undefined ? typeof cur : cur._type.name;
throw "Function ${name} do not accept " + type + " as #${step+1} argument"; `);
  }
  return res.join('\n');
}
function compileCall(f, type) {
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
  if(!type.name)
    console.log('No type name');
  return type._isJsType
    ? type.primitiveName
      ? 'typeof ' + name + " === '" + type.primitiveName + "'"
      : name + ' instanceof ' + type.name
    : name + ' !== undefined && ' + name + '._is' + type.name;
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
    if(ss.action){
      throw 'Signature already defined: ' + JSON.stringify(types);
    }
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
    f.name !== name && nice.rewriteProperty(f, 'name', name);
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
(function(){"use strict";
def(nice, 'TestSet', (core) => {
  const tests = [];
  const res = (...a) => {
    const [description, body] = a.length === 2 ? a : [a[0].name, a[0]];
    const position = nice.parseTraceString(Error().stack.split('\n')[2]);
    const test = { body, description, ...position };
    if(res.runner === false)
      tests.push(test);
    else
      runTest(test, res.runner);
  };
  res.core = core;
  res.tests = tests;
  res.runner = false;
  res.run = run;
  return res;
});
Test = nice.TestSet(nice);
def(nice, 'Test', Test);
const colors = {
  blue: s => '\x1b[34m' + s + '\x1b[0m',
  red: s => '\x1b[31m' + s + '\x1b[0m',
  green: s => '\x1b[32m' + s + '\x1b[0m',
  gray: s => '\x1b[38;5;245m' + s + '\x1b[0m'
};
function run(key) {
  this.runner = {
    key: key,
    good: 0,
    bad: 0,
    start: Date.now(),
    core: this.core
  };
  console.log('');
  console.log(colors.blue('Running tests'));
  console.log('');
  this.tests.forEach(t => runTest(t, this.runner));
  console.log(' ');
  const { bad, good, start } = this.runner;
  console.log(colors[bad ? 'red' : 'green']
    (`Tests done. OK: ${good}, Error: ${bad}`), `(${Date.now() - start}ms)`);
  console.log('');
  this.runner = false;
};
function runTest(t, runner){
  const argNames = nice.argumentNames(t.body);
  if(runner.key && !args.includes(runner.key))
    return;
  const args = argNames.map(n => runner.core[n] || nice[n]);
  try {
    t.body(...args);
    runner.good++;
  } catch (e) {
    if(typeof e === 'string') {
      console.log(colors.red('Error while testing ' + (t.description || '')));
      console.log(t.body.toString());
      console.log(e);
    } else {
      const k = 1 + (e.shift || 0);
      const parse = nice.parseTraceString;
      const stackArray = e.stack.split('\n');
      const { line, symbol, location } = parse(stackArray[k])
       || parse(stackArray[k + 1]) || {};
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
    runner.bad++;
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
  isAnyOf: (v, ...vs) => {
    if(v && v._isAnything && '_value' in v)
      v = v._value;
    return vs.includes(v);
  },
  isNeitherOf: (v, ...vs) => {
    if(v && v._isAnything && '_value' in v)
      v = v._value;
    return !vs.includes(v);
  },
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
      ('is' + i, v => v && v._isAnything
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
  if(!type.name)
    return;
  const body = type.singleton
    ? v => v === type || (v && v._type
        ? (type === v._type || type.isPrototypeOf(v._type))
        : false)
    : v => v && v._type
        ? (type === v._type || type.isPrototypeOf(v._type))
        : false
  Check.about('Checks if `v` has type `' + type.name + '`')
    ('is' + type.name, body);
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
  && (common[name] = function (...a) {
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
Test("singleton type", () => {
  const s = nice.Stop;
  expect(s).isStop();
});
Test((isFunction) => {
  expect(isFunction(() => 1)).is(true);
  expect(isFunction(2)).is(false);
  expect(isFunction()).is(false);
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
Test((between) => {
  expect(between(1, 2, 3)).is(false);
  expect(between(2, 1, 3)).is(true);
});
})();
(function(){"use strict";def(nice, 'expectPrototype', {});
function isFail (v) {
  return !v || (v && v._isAnything && v._type === nice.Err);
};
function composeCallName(name, a) {
  return name + '(' + a.map(showValue).join(', ') + ')';
};
function showValue(v) {
  if(v === undefined)
    return "undefined:undefined";
  if(v === null)
    return "null:null";
  const type = typeof v;
  let s = '' + ((v && v.toString !== Object.prototype.toString)
      ? v.toString() : JSON.stringify(v));
  if(type === 'string')
    s = '"' + s + '"';
  if(type === 'object'){
    s += ':' + (v._type ? 'nice:' + v._type.name : 'object:' + v.constructor.name);
  } else {
    s += ':' + type
  }
  return s;
};
reflect.on('Check', ({name}) => {
  name && (nice.expectPrototype[name] = function(...a){
    const res = this._preF ? this._preF(nice[name](this.value, ...a)) : nice[name](this.value, ...a);
    if(isFail(res)){
      const s = this.text ||
          `Expected (${showValue(this.value)}) ${this._preMessage|| ''} ${composeCallName(name, a)}`;
      const e = new Error(s);
      e.shift = ('' + s).split('\n').length;
      throw e;
    }
    if(this._postCall !== undefined){
      this._postCall(this, name, a);
    }
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
  this._preF = v => isFail(v);
  this._preMessage = 'not';
  this._postCall = z => {
    delete z._preF;
    delete z._preMessage;
    delete z._postCall;
  }
  return this;
});
defGet(nice.expectPrototype, function either(){
  this._either = this._either || [];
  this._preF = res => { this._either.push(res); return true };
  this._postCall = (z, name, a) => {
    this._preMessage = this._preMessage || '';
    this._preMessage += composeCallName(name, a) + ' or ';
  };
  return this;
});
defGet(nice.expectPrototype, function or(){
  this._either = this._either || [];
  this._preF = res => {
    var b = this._either.some(v => !isFail(v)) || !isFail(res);
    return b;
  };
  delete this._postCall;
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
Test('either or', () => {
  expect(1).either.is(2).is(1).or.is(nice.Div());
  expect(1).either.is(1).is(2).or.is(nice.Div());
  expect(1).either.is(5).is(2).or.is(1);
  expect('qwe').either.isNumber(2).or.isString();
  expect(1).either.is(2).or.not.is(5);
  expect(() => {
    expect(4).either.is(2).is(1).or.is(5);
  }).throws();
  expect(() => {
    expect(1).either.is(2).or.not.is(1);
  }).throws();
});
})();
(function(){"use strict";nice.Check('isType', v => Anything.isPrototypeOf(v) || v === Anything);
nice.ReadOnly.Anything(function jsValue(z) { return z._value; });
function s(name, parent, description){
  const value = Object.freeze({ _type: name });
  nice.Type({
    name,
    extends: parent,
    description,
    singleton: true,
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
['string', 'boolean', 'number', 'function'].forEach(typeName => {
  def(nice.Anything.configProto, typeName, function (name, defaultValue) {
    if(defaultValue !== undefined && typeof defaultValue !== typeName)
      defaultValue = nice.simpleTypes[typeName].cast(defaultValue);
    def(this.target.proto, name, function(...vs){
      if(vs.length === 0)
        return name in this._value ? this._value[name] : defaultValue;
      if(typeof vs[0] !== typeName)
        vs[0] = nice.simpleTypes[typeName].cast(vs[0]);
      this._value[name] = vs[0];
      return this;
    });
    return this;
  });
});
def(nice.Anything.configProto, 'object', function (name, defaultValue) {
  if(defaultValue !== undefined && typeof defaultValue !== 'object')
    throw `Default value for ${name} should be object.`;
  def(this.target.proto, name, function(...vs){
    const v = this._value;
    if(!(name in v))
      v[name] = defaultValue ? Object.assign({}, defaultValue) : {};
    if(vs.length === 0)
      return v[name];
    if(vs.length === 1)
      return v[name][vs[0]];
    v[name][vs[0]] = vs[1];
    return this;
  });
  return this;
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
        throw `Can't set ${name}[Array] to ${value}[${typeof value}]`;
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
def(nice, 'sortedIndex', (a, v, f) => {
  let low = 0,
      high = a === null ? low : a.length;
  while (low < high) {
    var mid = (low + high) >>> 1,
        vv = a[mid];
    if (vv !== null && (f === undefined ? vv < v : f(vv, v) < 0)) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return high;
});
Test((sortedIndex) => {
  const a = [1,5,7,8];
  const f = (a, b) => a - b;
  expect(sortedIndex(a, 0)).is(0);
  expect(sortedIndex(a, 0, f)).is(0);
  expect(sortedIndex(a, 2)).is(1);
  expect(sortedIndex(a, 2, f)).is(1);
  expect(sortedIndex(a, 7)).is(2);
  expect(sortedIndex(a, 7, f)).is(2);
  expect(sortedIndex(a, 11)).is(4);
  expect(sortedIndex(a, 11, f)).is(4);
  expect(sortedIndex([], -11)).is(0);
  expect(sortedIndex([], 11)).is(0);
});
Test((sortedIndex) => {
  const a = ['a', 'aaa', 'aaaaa', 'aaaaaa'];
  const f = (a, b) => a.length - b.length;
  expect(sortedIndex(a, 'aa', f)).is(1);
  expect(sortedIndex(a, 'aaaa', f)).is(2);
  expect(sortedIndex(a, '', f)).is(0);
});
})();
(function(){"use strict";nice.Type({
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
Check.Spy('neverCalled', s => s._value.length === 0);
Test((Spy, neverCalled) => {
  const spy = Spy();
  expect(spy.neverCalled()).is(true);
  spy();
  expect(spy.neverCalled()).is(false);
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
  expect(spy).calledWith(1, 2);
});
})();
(function(){"use strict";
nice.Type({
  name: 'DataSource',
  extends: 'Something',
  abstract: true,
  initBy(z){
    z.subscribers = new Set();
  },
  proto: {
    get version(){
      return this._version;
    },
    warmUpBy(f){ this.warmUp = f; return this; },
    coolDownBy(f){ this.warmUp = f; return this; },
    coldComputeBy(f){ this.warmUp = f; return this; },
    subscribe(f, v){
      const z = this;
      if(!z.subscribers)
        z.subscribers = new Set();
      if(z.warmUp && z._isHot !== true){
        z.warmUp();
        z._isHot = true;
      } else if (z.coldCompute){
        z.coldCompute();
      }
      if(typeof f !== 'function' && typeof f === 'object' && !f.notify){
        const o = f;
        f = x => o[x]?.();
      }
      z.subscribers.add(f);
      if(v === -1)
        return;
      if(v === undefined || v < z._version)
        z.notifyExisting(f);
    },
    notifyExisting(f){
      f.notify ? f.notify(this._value) : f(this._value);
    },
    unsubscribe(f){
      this.subscribers.delete(f);
      if(this.subscribers.size === 0 && this.coolDown){
        this.coolDown();
        this._isHot = false;
      }
    },
  }
});
nice.eventEmitter(nice.DataSource.proto);
})();
(function(){"use strict";
nice.Type({
  name: 'Box',
  extends: 'DataSource',
  customCall: (z, ...as) => {
    if(as.length === 0) {
      z.coldCompute && !z._isHot && z.coldCompute();
      return z._value;
    } else {
      return z.setState(as[0]);
    }
  },
  initBy: (z, v) => {
    z._version = 0;
    z.setState(v);
  },
  proto: {
    setState (v) {
      if(this._value === v) return;
      this._version ++;
      this._value = v;
      this.notify(v);
    },
    notify(v){
      if(this.subscribers)
        for (const f of this.subscribers) {
          f.notify
            ? f.notify(v)
            : f(v);
        }
    },
    deepUniq(){
      this.setState = function(v){
        nice.diff(v, this._value) === false || this.__proto__.setState.call(this, v);
      }
      return this;
    },
    assertId(){
      if(!this._id)
        this._id = nice.genereteAutoId();
      return this._id;
    }
  }
});
const Box = nice.Box;
Action.Box('assign', (z, o) => z({...z(), ...o}));
Test((Box, Spy) => {
  const b = Box();
  const spy = Spy();
  b.subscribe(spy);
  b(1);
  b(1);
  b(2);
  expect(spy).calledWith(undefined);
  expect(spy).calledWith(1);
  expect(spy).calledWith(2);
  expect(spy).calledTimes(3);
});
Test((Box) => {
  const b = Box();
  let version = b.version;
  b(1);
  expect(b.version).gt(version);
  version = b.version;
  b(1);
  expect(b.version).is(version);
  b(2);
  expect(b.version).gt(version);
});
Test((Box, Spy) => {
  const b = Box();
  const spy = Spy();
  b.subscribe(spy, -1);
  b(1);
  b(1);
  b(2);
  expect(spy).calledWith(1);
  expect(spy).calledWith(2);
  expect(spy).calledTimes(2);
});
Test((Box, Spy, deepUniq) => {
  const b = Box({qwe:1, asd:2}).deepUniq();
  const spy = Spy();
  b.subscribe(spy);
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
Action.Box('removeValue', (z, v) => {
  z(z().filter(r => r !== v));
});
Action.Box('add', (z, n = 1) => z(z() + n));
Test('Box action', (Box, Spy) => {
  const b = Box(2);
  b.add(3);
  expect(b()).is(5);
});
Test((Box, Spy) => {
  const b = Box(1);
  const spy1 = Spy();
  const spy2 = Spy();
  b.subscribe({ 1: spy1, 2: spy2 });
  expect(spy1).calledWith();
});
})();
(function(){"use strict";nice.Type({
  name: 'BoxSet',
  extends: 'DataSource',
  customCall: (z, ...as) => {
    if(as.length)
      throw 'Use access methods';
    return z._value;
  },
  initBy: (z, ...a) =>  {
    z._version = 0;
    z._value = new Set(a);
  },
  proto: {
    [Symbol.iterator](){
      return this._value[Symbol.iterator]();
    },
    notify(v, old){
      if(this.subscribers)
        for (const f of this.subscribers) {
          f.notify
            ? f.notify(v, old)
            : f(v, old);
        }
    },
    notifyExisting(f){
      this._value.forEach(v => f(v));
    },
    add (v) {
      if(v === null)
        throw `BoxSet does not accept null`;
      const values = this._value;
      if(!values.has(v)) {
        values.add(v);
        this.notify(v);
      }
      return this;
    },
    has (v) {
      return this._value.has(v);
    },
    delete (v) {
      this.notify(null, v);
      return this._value.delete(v);
    },
    get size() {
      return this._value.size;
    },
    forEach (f) {
      this._value.forEach(f);
    },
    each (f) {
      this._value.forEach(f);
    },
    intersection (b) {
      const av = this._value;
      const bv = b._value;
      const res = nice.BoxSet();
      if(av.size > bv.size) {
        bv.forEach(v => av.has(v) && res.add(v));
      } else {
        av.forEach(v => bv.has(v) && res.add(v));
      }
      this.subscribe((v, oldV) => {
        v === null
          ? res.delete(oldV)
          : bv.has(v) && res.add(v);
      });
      b.subscribe((v, oldV) => {
        v === null
          ? res.delete(oldV)
          : av.has(v) && res.add(v);
      });
      return res;
    },
  }
});
nice.defineCached(nice.BoxSet.proto, function boxArray() {
  const ba = BoxArray();
  this.subscribe((a, b) => a === null ? ba.removeValue(b) : ba.push(a));
  return ba;
});
Test((BoxSet, Spy) => {
  const b = BoxSet();
  const spy = Spy();
  b.add(1);
  b.subscribe(spy);
  expect(spy).calledWith(1);
  b.add('z');
  expect(spy).calledWith('z');
  expect(spy).calledTwice();
  Test(has => {
    expect(b.has(1)).is(true);
    expect(b.has('1')).is(false);
    expect(b.has('z')).is(true);
    expect(b.has('@')).is(false);
  });
  Test('delete',  () => {
    expect(b.delete(1)).is(true);
    expect(b.has(1)).is(false);
    expect(spy).calledWith(null, 1);
  });
});
Test((BoxSet, intersection, Spy) => {
  const a = BoxSet(1,2,3);
  const b = BoxSet(2,4,6);
  const c = a.intersection(b);
  expect([...c()]).deepEqual([2]);
  a.add(4);
  expect([...c()]).deepEqual([2,4]);
  a.delete(2);
  expect([...c()]).deepEqual([4]);
  b.delete(4);
  expect([...c()]).deepEqual([]);
});
})();
(function(){"use strict";nice.Type({
  name: 'BoxMap',
  extends: 'DataSource',
  customCall: (z, ...as) => {
    if(as.length)
      throwF('Use access methods to change BoxMap');
    z.coldCompute && !z._isHot && z.coldCompute();
    return z._value;
  },
  initBy: (z, o) => {
    z._value = {};
    _each(o, (v, k) => z.set(k, v));
  },
  proto: {
    set (k, v) {
      const values = this._value;
      if(v === values[k]) {
        ;
      } else {
        const oldValue = k in values ? values[k] : null;
        if(v === null)
          delete values[k];
        else
          values[k] = v;
        this.notify(v, ''+k, oldValue);
      }
      return this;
    },
    notify(q,w,e){
      if(this.subscribers)
        for (const f of this.subscribers) (f.notify || f)(q,w,e);
    },
    delete (k) {
      return this.set(k, null);
    },
    get (k) {
      return this._value[k];
    },
    notifyExisting(f){
      _each(this._value, (v, k) => f(v, k, null));
    },
    map (f) {
      const res = nice.BoxMap();
      this.subscribe((v,k) => res.set(k, f(v)));
      return res;
    },
    filter (f) {
      const res = nice.BoxMap();
      this.subscribe((v,k) => f(v, k)
          ? res.set(k, v)
          : k in res._value && res.set(k, null)
      );
      return res;
    },
    sortedEntities(){
      const res = nice.BoxArray();
      const sortBy = (a, b) => {
        const _a = a[1];
        return _a === b ? 0 : _a > b ? 1 : -1;
      };
      const compareBy = (a, b) => a[0] === b[0];
      const vs = res._value;
      this.subscribe((v, k, oldV) => {
        if(oldV === null) {
          const i = nice.sortedIndex(vs, v, sortBy);
          res.insert(i, [k, v]);
        } else if (v === null) {
          const i = nice.sortedIndex(vs, oldV, sortBy);
          if(vs[i][0] === k)
            res.remove(i);
          else
            throw '342f3f';
        } else {
          const oldI = nice.sortedIndex(vs, oldV, sortBy);
          const newI = nice.sortedIndex(vs, v, sortBy);
          if(oldI > newI){
            res.remove(oldI);
            res.insert(newI, [k, v]);
          } else if (oldI < newI){
            res.insert(newI, [k, v]);
            res.remove(oldI);
          }
        }
      });
      return res;
    }
  }
});
Test((BoxMap, Spy) => {
  const b = BoxMap();
  const spy = Spy();
  b.set('a', 1);
  b.subscribe(spy);
  expect(spy).calledWith(1, 'a');
  b.set('z', 3);
  expect(spy).calledWith(3, 'z');
  b.set('a', null);
  expect(spy).calledWith(null, 'a');
  expect(b()).deepEqual({z:3});
});
Action.BoxMap('assign', (z, o) => _each(o, (v, k) => z.set(k, v)));
Test((BoxMap, assign, Spy) => {
  const b = BoxMap();
  const spy = Spy();
  b.set('a', 1);
  b.subscribe(spy);
  expect(spy).calledWith(1, 'a');
  b.assign({z: 3});
  expect(spy).calledWith(3, 'z');
  expect(spy).calledTwice();
  expect(b()).deepEqual({a:1, z:3});
});
Test((BoxMap, map, Spy) => {
  const a = BoxMap({a:1, b:2});
  const b = a.map(x => x * 2);
  const spy = Spy();
  b.subscribe(spy);
  expect(spy).calledTwice();
  expect(spy).calledWith(2, 'a');
  expect(spy).calledWith(4, 'b');
  a.set('a', 3);
  expect(spy).calledWith(6, 'a');
  expect(spy).calledTimes(3);
  a.set('c', 4);
  expect(b()).deepEqual({a:6, b:4, c:8});
});
Test((BoxMap, filter) => {
  const a = BoxMap({a:1, b:2, c: 3});
  const b = a.filter(x => x % 2);
  expect(b()).deepEqual({a:1, c:3});
  a.set('a', 4);
  expect(b()).deepEqual({c:3});
  a.set('d', 5);
  expect(b()).deepEqual({c:3, d:5});
  a.set('z', null);
  expect(b()).deepEqual({c:3, d:5});
});
Mapping.BoxMap('sort', (z) => {
  const res = nice.BoxArray();
  const values = [];
  z.subscribe((v, k, oldV) => {
    if(oldV !== null) {
      const i = nice.sortedIndex(values, oldV);
      values.splice(i, 1);
      res.remove(i);
    }
    if(v !== null) {
      const i = nice.sortedIndex(values, v);
      values.splice(i, 0, v);
      res.insert(i, k);
    }
  });
  return res;
});
Test('sort keys by values', (BoxMap, sort) => {
  const a = BoxMap({a:1, c: 3, b:2});
  const b = a.sort();
  expect(b()).deepEqual(['a', 'b', 'c']);
  a.set('a', 4);
  expect(b()).deepEqual(['b', 'c', 'a']);
  a.set('d', 5);
  expect(b()).deepEqual(['b', 'c', 'a', 'd']);
  a.set('c', null);
  expect(b()).deepEqual(['b', 'a', 'd']);
});
Mapping.BoxMap.Function('sort', (z, f) => {
  const res = nice.BoxArray();
  const values = [];
  z.subscribe((v, k, oldV) => {
    if(oldV !== null) {
      const i = nice.sortedIndex(values, f(oldV, k));
      values.splice(i, 1);
      res.remove(i);
    }
    if(v !== null) {
      const computed = f(v, k);
      const i = nice.sortedIndex(values, computed);
      values.splice(i, 0, computed);
      res.insert(i, k);
    }
  });
  return res;
});
Test('sort keys by function', (BoxMap, sort) => {
  const a = BoxMap({a:1, c: 3, b:2});
  const b = a.sort((v, k) => 1 / v);
  expect(b()).deepEqual(['c', 'b', 'a']);
  a.set('a', 4);
  expect(b()).deepEqual(['a', 'c', 'b']);
  a.set('d', 5);
  expect(b()).deepEqual(['d', 'a', 'c', 'b']);
  a.set('c', null);
  expect(b()).deepEqual(['d', 'a', 'b']);
});
Mapping.BoxMap.BoxMap('sort', (z, index) => {
  const res = nice.BoxArray();
  const targetValues = z._value;
  const indexValues = index._value;
  const values = [];
  z.subscribe((v, k, oldV) => {
    if(oldV !== null) {
      const i = nice.sortedIndex(values, indexValues[k]);
      values.splice(i, 1);
      res.remove(i);
    }
    if(v !== null) {
      const computed = indexValues[k];
      const i = nice.sortedIndex(values, computed);
      values.splice(i, 0, computed);
      res.insert(i, k);
    }
  });
  let ignoreIndex = true;
  index.subscribe((v, k, oldV) => {
    if(ignoreIndex || !(k in z._value))
      return;
    let oldI = nice.sortedIndex(values, oldV);
    for(let i = oldI; values[i] === oldV; i++){
      if(res._value[i] === k)
        oldI = i;
    }
    const i = nice.sortedIndex(values, v);
    if(oldI !== i){
      values.splice(oldI, 1);
      res.remove(oldI);
      values.splice(i, 0, v);
      res.insert(i, k);
    }
  });
  ignoreIndex = false;
  return res;
});
Test('sort keys by values from another BoxMap', (BoxMap, sort) => {
  const a = BoxMap({a:true, c: true, b:true});
  const index = BoxMap({a:1, c: 3, b:2});
  const b = a.sort(index);
  expect(b()).deepEqual(['a', 'b', 'c']);
  index.set('a', 4);
  expect(b()).deepEqual(['b', 'c', 'a']);
  a.set('d', true);
  expect(b()).deepEqual(['d', 'b', 'c', 'a']);
  index.set('d', 6);
  expect(b()).deepEqual(['b', 'c', 'a', 'd']);
  index.set('c', 6);
  expect(b()).deepEqual(['b', 'a', 'd', 'c']);
  index.set('c', null);
  expect(b()).deepEqual(['c', 'b', 'a', 'd']);
});
Test((BoxMap, sortedEntities) => {
  const m = BoxMap({a:1, c: 3, b:2,d:1.5});
  const se = m.sortedEntities();
  expect(se()).deepEqual([['a',1],['d',1.5],['b',2],['c',3]]);
  m.set('a', 2.5);
  expect(se()).deepEqual([['d',1.5],['b',2],['a',2.5],['c',3]]);
  m.delete('b');
  expect(se()).deepEqual([['d',1.5],['a',2.5],['c',3]]);
  m.set('e', 0);
  expect(se()).deepEqual([['e',0],['d',1.5],['a',2.5],['c',3]]);
  m.set('f', 5);
  expect(se()).deepEqual([['e',0],['d',1.5],['a',2.5],['c',3],['f',5]]);
});
})();
(function(){"use strict";nice.Type({
  name: 'BoxArray',
  extends: 'DataSource',
  customCall: (z, ...as) => as.length === 0 ? z._value : z.setAll(as[0]),
  initBy: (z, v) => {
    z._value = [];
    v && z.setAll(v);
  },
  proto: {
    notify(q,w,e,r){
      if(this.subscribers)
        for (const f of this.subscribers) {
          f.notify
            ? f.notify(q,w,e,r)
            : f(q,w,e,r);
        }
    },
    get (k) {
      return this._value[k];
    },
    last () {
      return this._value[this._value.length - 1];
    },
    set (k, v) {
      if(v === null)
        throw `Can't be set to null`;
      const values = this._value;
      if(v !== values[k]) {
        const old = k in values ? values[k] : null;
        const oldKey = k in values ? k : null;
        values[k] = v;
        this.notify(v, k, old, oldKey);
      }
      return this;
    },
    push (v) {
      this.set(this._value.length, v);
    },
    remove (i) {
      expect(i).isNumber();
      const vs = this._value;
      if(i >= vs.length)
        return;
      const old = vs[i];
      this._value.splice(i, 1);
      this.notify(null, null, old, i);
    },
    removeValue (v) {
      const vs = this._value;
			for(let i = vs.length - 1; i >= 0; i--){
				if(vs[i] === v)
					this.remove(i);
			}
    },
    insert (i, v) {
      const vs = this._value;
      this._value.splice(i, 0, v);
      this.notify(v, i, null, null);
    },
    setAll (a) {
      if(!Array.isArray(a))
        throw 'setAll expect array';
      const newL = a.length;
      const oldA = this._value;
      const oldL = oldA.length;
      a.forEach((v, k) => {
        this.notify(v, k, k >= oldL ? null : oldA[k], k >= oldL ? null : k);
      });
      if(newL < oldL) {
        for(let i = newL; i < oldL ; i++)
          this.notify(null, null, oldA[newL], newL);
      }
      this._value = a;
    },
    notifyExisting(f){
      this._value.forEach((v, k) => f(v, k, null, null));
    },
    map (f) {
      const res = nice.BoxArray();
      this.subscribe((value, index, oldValue, oldIndex) => {
        if(value !== null && oldValue !== null) {
          res.set(index, f(value, index));
        } else if (value === null) {
          res.remove(oldIndex);
        } else {
          res.insert(index, f(value, index));
        }
      });
      return res;
    },
      
    sort (f) {
      const res = nice.BoxArray();
      this.subscribe((value, index, oldValue, oldIndex) => {
        if(oldIndex !== null) {
          const position = nice.sortedIndex(res._value, oldValue);
          res.remove(position);
        }
        if(index !== null) {
          const position = nice.sortedIndex(res._value, value);
          res.insert(position, value);
        }
      });
      return res;
    },
    filter (f) {
      const res = nice.BoxArray();
      const map = [];
      let box;
      if(f._isBox){
        box = f;
        f = f();
      }
      const findPosition = stop => {
        let count = 0;
        let k = 0;
        let l = map.length;
        do {
          if(map[k])
            count++;
        } while( ++k < l && k < stop );
        return count;
      };
      this.subscribe((value, index, oldValue, oldIndex) => {
        const pass = !!f(value);
        const oldPass = oldIndex === null ? null : map[index];
        if(oldIndex === null)
          map.splice(index, 0, pass);
        else {
          if (index === null)
            map.splice(oldIndex, 1);
          else
            map[index] = pass;
        }
        pass && !oldPass && res.insert(findPosition(index), value);
        !pass && oldPass && res.remove(findPosition(index));
      });
      box && box.subscribe(newF => {
        this._value.forEach((v, k) => {
          const pass = !!newF(v);
          const oldPass = map[k];
          if(pass && !oldPass){
            map[k] = true;
            res.insert(findPosition(k), v);
          }
          if(!pass && oldPass){
            map[k] = false;
            res.remove(findPosition(k));
          }
        });
        f = newF;
      });
      return res;
    },
    window(start, length) {
      const res = nice.BoxArray();
      const resValue = res._value;
      const source = this._value;
      const within = n => n >= start && n < start + length;
      this.subscribe((value, index, oldValue, oldIndex) => {
        if(oldIndex !== null) {
          within(oldIndex) && res.remove(oldIndex - start);
          if(oldIndex < start && (index === null || index >= start)) {
            res.remove(0);
            if(res._value.length + start < source.length){
              res.push(source[start + length - 1]);
            }
          };
        }
        if(index !== null) {
          within(index) && res.insert(index - start, value);
          if(index < start && (oldIndex === null || oldIndex >= start)) {
            res.insert(0, source[start]);
          };
        }
        if(res._value.length > length)
          res.remove(length);
      });
      return res;
    }
  }
});
nice.BoxArray.subscribeFunction = ba => {
  return (value, index, oldValue, oldIndex) => {
    if(value !== null && oldValue !== null) {
      ba.set(index, value);
    } else if (value === null) {
      ba.remove(oldIndex);
    } else {
      ba.insert(index, value);
    }
  };
};
Test((BoxArray, Spy, set) => {
  const a = BoxArray([1,2]);
  const spy = Spy();
  a.subscribe(spy);
  expect(spy).calledWith(1, 0, null, null);
  expect(spy).calledWith(2, 1, null, null);
  a.set(0, 3);
  expect(spy).calledWith(3, 0, 1, 0);
  expect(spy).calledTimes(3);
  expect(a()).deepEqual([3,2]);
});
Test((BoxArray, Spy, insert) => {
  const a = BoxArray([1,2]);
  const spy = Spy();
  a.subscribe(spy);
  a.insert(1, 3);
  expect(spy).calledWith(3, 1, null, null);
  expect(spy).calledTimes(3);
  expect(a()).deepEqual([1,3,2]);
});
Test((BoxArray, Spy, remove) => {
  const a = BoxArray([1,2,3]);
  const spy = Spy();
  a.subscribe(spy);
  a.remove(1);
  expect(spy).calledWith(null, null, 2, 1);
  expect(spy).calledTimes(4);
  expect(a()).deepEqual([1,3]);
});
Test((BoxArray, Spy, removeValue) => {
  const a = BoxArray([1,2,3]);
  const spy = Spy();
  a.subscribe(spy);
  a.removeValue(2);
  expect(spy).calledWith(null, null, 2, 1);
  expect(spy).calledTimes(4);
  expect(a()).deepEqual([1,3]);
});
Test((BoxArray, Spy, map) => {
  const a = BoxArray([1,2]);
  const b = a.map(x => x * 2);
  expect(b()).deepEqual([2,4]);
  a.setAll([2,3]);
  expect(b()).deepEqual([4,6]);
  a.set(2, 5);
  a.set(1, 6);
  expect(b()).deepEqual([4,12,10]);
  a.remove(1);
  expect(b()).deepEqual([4,10]);
});
Test((BoxArray, Spy, filter) => {
  const a = BoxArray([1,2]);
  const b = a.filter(x => x % 2);
  expect(b()).deepEqual([1]);
  a.setAll([2,3]);
  expect(a()).deepEqual([2,3]);
  expect(b()).deepEqual([3]);
  a.set(2, 5);
  expect(a()).deepEqual([2,3,5]);
  expect(b()).deepEqual([3,5]);
  a.set(1, 6);
  expect(a()).deepEqual([2,6,5]);
  expect(b()).deepEqual([5]);
  a.remove(1);
  expect(a()).deepEqual([2,5]);
  expect(b()).deepEqual([5]);
  a.push(7);
  expect(a()).deepEqual([2,5,7]);
  expect(b()).deepEqual([5,7]);
  a.set(1, 10);
  expect(b()).deepEqual([7]);
});
Test((BoxArray, sort) => {
  const a = BoxArray([3,2,4]);
  const b = a.sort();
  expect(b()).deepEqual([2,3,4]);
  a.remove(1);
  expect(b()).deepEqual([3,4]);
  a.push(7);
  a.push(7);
  a.push(1);
  expect(b()).deepEqual([1,3,4,7,7]);
});
Test((BoxArray, window) => {
  const a = BoxArray([1,2,3,4]);
  const b = a.window(2,2);
  expect(b()).deepEqual([3,4]);
  a.remove(2);
  expect(b()).deepEqual([4]);
  a.push(5);
  expect(b()).deepEqual([4,5]);
  a.insert(0,0);
  expect(b()).deepEqual([2,4]);
  a.remove(0);
  expect(b()).deepEqual([4,5]);
});
})();
(function(){"use strict";
class Connection{
  constructor(cfg) {
    Object.assign(this, cfg);
    this.version = 0;
  }
  attach(){
    const { source } = this;
    if(source._isBox){
      const needUpdate = source._version === 0 || this.version < source._version;
      source.subscribe(this, this.version);
      return needUpdate;
    } else {
    }
  }
  detach() {
    this.source.unsubscribe(this);
  }
  notify(v){
    const target = this.target;
    this.version = this.source._version;
    target._inputValues[this.position] = v;
    target.warming || target.attemptCompute();
  }
};
nice.DataSource.Connection = Connection;
nice.Type({
  name: 'RBox',
  extends: 'Box',
  initBy: (z, ...inputs) => {
    z._version = 0;
    let by = inputs.pop();
    inputs.forEach((v, k) => {
      if(v instanceof Promise){
        const b = Box();
        v.then(b).catch(e => b(new Error(e)));
        inputs[k] = b;
      }
    });
    inputs.forEach((v, k) => {
      if(!v._isBox)
        throw new Error(`Argument ${k} is not a Box`);
    });
    if(Array.isArray(by)){
      z._left = by[1];
      by = by[0];
    }
    if(typeof by === 'object')
      by = objectPointers[inputs.length](by);
    if(typeof by !== 'function')
      throw `Last argument to RBox should be function or object`;
    z._by = by;
    z._ins = inputs.map((source, position) => new Connection({
      source, target:z, value: undefined, position
    }));
    z._isHot = false;
    z.warming = false;
    z._inputValues = Array(inputs.length).fill(undefined);
  },
  customCall: (z, ...as) => {
    if(as.length === 0) {
      z._isHot === true || z.coldCompute();
      return z._value;
    }
    throw `Can't set value to reactive box`;
  },
  proto: {
    reconfigure(...inputs) {
      const rememberIsHot = this._isHot;
      this._by = inputs.pop();
      if(typeof this._by !== 'function')
        throw `Last argument to RBox should be function`;
			this.warming = true;
      inputs.forEach((source, position) => {
        const old = this._ins[position];
        if(source !== old.source) {
          this._isHot && old.detach();
          const c = new Connection({
            source, target:this, value: undefined, position
          });
          this._isHot && c.attach();
          this._ins[position] = c;
        }
      });
			this.warming = false;
      this._isHot && this.attemptCompute();
    },
    attemptCompute(){
      let v;
      try {
        if('_left' in this && this._inputValues.some(i => i === undefined))
          v = typeof this._left === 'function' ? this._left() : this._left;
        else
          v = this._by(...this._inputValues);
      } catch (e) {
        v = e;
      }
      this.setState(v);
    },
    coldCompute(){
      let needCompute = false;
      for (let c of this._ins){
        const v = c.source();
        if(c.version === 0 || c.version < c.source._version){
          this._inputValues[c.position] = v;
          c.version = c.source._version;
          needCompute = true;
          break;
        }
      }
      needCompute && this.attemptCompute();
    },
    warmUp(){
      this.warming = true;
      let needCompute = false;
      for (let c of this._ins)
        needCompute |= c.attach();
			this.warming = false;
      needCompute && this.attemptCompute();
    },
    coolDown(){
      this._inputValues = [];
      for (let c of this._ins)
        c.detach();
    }
  }
});
const objectPointers = {
  1: o => k => o[k](),
  2: o => (k1, k2) => o?.[k1]?.[k2](),
  2: o => (k1, k2, k3) => o?.[k1]?.[k2]?.[k3]()
};
Test('RBox basic case', (Box, RBox) => {
  const b = Box(1);
  const rb = RBox(b, a => a + 1);
  expect(rb()).is(2);
  b(3);
  expect(rb()).is(4);
});
Test('RBox cold compute', (Box, RBox, Spy) => {
  const b = Box(1);
  const spy = Spy(a => a + 1);
  const spy2 = Spy();
  const rb = RBox(b, spy);
  expect(rb._value).is(undefined);
  expect(rb()).is(2);
  expect(spy).calledOnce();
  expect(rb()).is(2);
  expect(spy).calledOnce();
  b(3);
  expect(spy).calledOnce();
  expect(rb._value).is(2);
  expect(rb()).is(4);
  expect(spy).calledTwice();
  rb.subscribe(spy2);
  expect(spy).calledTwice();
  expect(spy2).calledOnce();
  expect(spy2).calledWith(4);
});
Test('RBox undefined input', (Box, RBox) => {
  const b = Box();
  const rb = RBox(b, a => a + 1);
  expect(isNaN(rb())).is(true);
  b(1);
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
Test('lazy compute', (Box, RBox, Spy) => {
  const heavyFunction = Spy(a => a + 1);
  const b = Box(1);
  const rb = RBox(b, heavyFunction);
  expect(heavyFunction).not.called();
  expect(rb()).is(2);
  expect(heavyFunction).calledTimes(1);
  expect(rb()).is(2);
  expect(heavyFunction).calledTimes(1);
  b(2);
  expect(rb()).is(3);
  expect(heavyFunction).calledTimes(2);
  expect(rb()).is(3);
  expect(heavyFunction).calledTimes(2);
});
Test('lazy wakeup', (Box, RBox, Spy) => {
  const spy = Spy();
  const heavyFunction = Spy(a => a + 1);
  const b = Box(1);
  const rb = RBox(b, heavyFunction);
  expect(heavyFunction).not.called();
  rb.subscribe(spy);
  expect(heavyFunction).calledTimes(1);
  expect(rb()).is(2);
  expect(heavyFunction).calledTimes(1);
  rb.unsubscribe(spy);
  expect(heavyFunction).calledTimes(1);
  expect(rb()).is(2);
  expect(heavyFunction).calledTimes(1);
  b(2);
  expect(rb()).is(3);
  expect(heavyFunction).calledTimes(2);
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
Test('RBox cold compute', (Box, RBox) => {
  var a = Box(1);
  var b = RBox(a, x => x + 3);
  expect(b()).is(4);
});
Test('Array as subscriber', (Box, RBox, Spy) => {
  var a = Box();
  const spy = Spy();
  var b = RBox(a, [x => x + 3, 0]);
  b.subscribe(spy);
  expect(b()).is(0);
  expect(spy).calledWith(0);
  a(1);
  expect(b()).is(4);
  expect(spy).calledWith(4);
});
Test((RBox, Box) => {
  const b = Box();
  const rb = RBox(b, v => '12');
  expect(rb()).is('12');
});
})();
(function(){"use strict";nice.Type({
  name: 'IntervalBox',
  extends: 'Box',
  initBy: (z, ms, f) => {
    z._version = 0;
    if(typeof ms !== 'number')
      throw `1st argument must be number`;
    if(typeof f !== 'function')
      throw `2nd argument must be functions`;
    let interval = null;
    z.warmUp = () => {
      interval = setInterval(() => z(f(z())), ms);
      z._value === undefined && z.setState(f());
    };
    z.coolDown = () => {
      if(interval !== null){
        clearInterval(interval);
        interval = null;
      }
    };
  },
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
    expect(n._isHot).is(false);
    expect(spy).calledTimes(1);
  });
});
})();
(function(){"use strict";nice.Type({
  name: 'BoxIndex',
  extends: 'DataSource',
  customCall: (z, ...as) => {
    if(as.length)
      throw 'Use access methods to change BoxMap';
    return z._value;
  },
  initBy: z => z._value = new Map(),
  proto: {
    add (v, k) {
      
      if(Array.isArray(k))
        throw "Array can't be used as BoxIndex key.";
      const map = this._value;
      if(map.has(v)){
        const current = map.get(v);
        if(current instanceof Set) {
          if(!current.has(k)){
            current.add(k);
            this.emit('add', v, k);
          }
        } else if (current !== k) {
          map.set(v, new Set([current, k]));
          this.emit('add', v, k);
        }
      } else {
        map.set(v, k);
        this.emit('add', v, k);
      }
      return this;
    },
    delete (v, k) {
      const map = this._value;
      if(map.has(v)){
        const current = map.get(v);
        if(current instanceof Set) {
          current.delete(k) && this.emit('delete', v, k);
          if(current.size === 1)
            map.set(v, current.values().next().value);
        } else {
          if(current === k){
            map.delete(v);
            this.emit('delete', v, k);
          }
        }
      }
      return this;
    },
    has (v, k) {
      const map = this._value;
      if(map.has(v)){
        const kk = map.get(v);
        return (kk instanceof Set) ? kk.has(k) : k === kk;
      }
      return false;
    },
    getKeys (v) {
      const map = this._value;
      if(map.has(v)){
        const kk = map.get(v);
        return (kk instanceof Set) ? Array.from(kk) : [kk];
      }
      return null;
    },
    iterateValue (v, f) {
      const map = this._value;
      if(map.has(v)){
        const kk = map.get(v);
        kk instanceof Set ? kk.forEach(_v => f(_v)) : f(kk);
      }
      return this;
    },
    iterateAll (f) {
      this._value.forEach((kk, v) => kk instanceof Set
        ? kk.forEach(k => f(v, k))
        : f(v, kk));
    },
    subscribe ({add, del}) {
      expect(typeof add).is('function');
      expect(typeof del).is('function');
      this.iterateAll(add);
      this.on('add', add);
      this.on('delete', del);
    },
    unsubscribe ({add, del}) {
      this.off('add', add);
      this.off('delete', del);
    },
  }
});
Test((BoxIndex, Spy) => {
  const b = BoxIndex();
  b.add('qwe', 1);
  b.add('qwe', 3);
  b.add('asd', 15);
  expect(b.has('qwe', 1)).isTrue();
  expect(b.has('qwe', 3)).isTrue();
  expect(b.has('qwe', 15)).isFalse();
  expect(b.has('asd', 15)).isTrue();
  b.delete('qwe', 3);
  expect(b.has('qwe', 1)).isTrue();
  expect(b.has('qwe', 3)).isFalse();
  const spy = Spy();
  b.iterateValue('qwe', spy);
  expect(spy).calledOnce();
  b.delete('asd', 15);
  expect(b.has('qwe', 15)).isFalse();
  const spy2 = Spy();
  b.iterateValue('asd', spy2);
  expect(spy2).neverCalled();
  const spy3 = Spy();
  b.iterateAll(spy3);
  expect(spy3).calledOnce();
});
Test((BoxIndex, Spy) => {
  const b = BoxIndex();
  const add = Spy();
  const del = Spy();
  b.subscribe({add, del});
  b.add('a', 1);
  expect(add).calledWith('a', 1);
  b.add('a', 2);
  expect(add).calledWith('a', 2);
  b.add('a', 3);
  expect(add).calledWith('a', 3);
  expect(del).neverCalled();
  b.delete('a', 2);
  expect(del).calledWith('a', 2);
  b.delete('a', 4);
  expect(del).calledTimes(1);
  b.delete('a', 1);
  b.delete('a', 3);
  b.delete('a', 3);
  expect(del).calledTimes(3);
  expect(add).calledTimes(3);
});
})();
(function(){"use strict";const { _eachEach, _pick, once, clone, memoize, sortedPosition, Box } = nice;
const TEMPLATE = -1;
const DELETE = -2;
const COMPRESS = -3;
const VALUE = -4;
const proto = {
	add(o) {
		checkObject(o);
		const id = this.rows.length;
		this.lastId = id;
    const row = clone(o);
		this.rows.push(row);
		this.writeLog(id, row);
    this._newRow(id, row);
		return id;
	},
  _newRow(id, row){
    row._id = id;
    this.ids && this.ids.add(id);
    this._updateMeta(id, row);
  },
  _find(o) {
    let res = null;
    for(let k in o) {
      const v = o[k];
      if(!this.indexes[k])
        return null;
      const map = this.indexes[k]._value;
      if(!map.has(v))
        return null;
      const kk = map.get(v);
      if(res === null){
        res = kk;
      } else {
        if(kk instanceof Set) {
          if(res instanceof Set){
            res = intersectSets(kk, res);
          } else {
            if(!kk.has(res))
              return null;
          }
        } else {
          if(res instanceof Set){
            if(!res.has(kk))
              res = kk;
          } else {
            if(kk !== res)
              return null;
          }
        }
      }
    }
    return res;
  },
  find(o){
    const res = this._find(o);
    return res instanceof Set ? firstOfSet(res) : res;
  },
  findAll(o){
    const res = this._find(o);
    if(res === null)
      return new Set();
    return res instanceof Set ? res : new Set([res]);
  },
  assert(o) {
    const id = this.find(o);
    return id === null ? this.add(o) : id;
  },
  compressField(f){
    expect(f).isString();
    if(f in this.compressedFields)
      return;
    this.compressedFields[f] = true;
    this._pushLog([COMPRESS, f]);
  },
  _pushLog(row){
    if(this.loading)
      throw `Can't write while loading`;
    this.log.push(row);
    expect(this.version).isNumber();
		this.logSubscriptions.forEach(f => f(row, this.version));
    this.version = this.log.length;
  },
  delete(id) {
    this._pushLog([DELETE, id]);
    const data = this.rows[id];
    delete this.rows[id];
    this.ids && this.ids.delete(id);
    const o = {};
    _each(data, (v, k) => o[k] = undefined);
    this._updateMeta(id, o, data);
		if(id in this.rowBoxes)
			this.rowBoxes[id](undefined);
	},
  assertIndex(field) {
		const ii = this.indexes;
    if(!(field in ii))
      ii[field] = nice.BoxIndex();
    return ii[field];
  },
  matchingFilters(field, value){
    const fs = [];
    _eachEach(this.filters[field], (filter, kk, op) => {
      ops[op].f(value, filter.value) && fs.push(filter);
    });
    return fs;
  },
  _changeOptions(filter, newData, oldData){
    _each(filter.options.cache, (ops, field) => {
      if(field in newData && newData[field] !== oldData?.[field]){
        ops.remove(oldData?.[field]);
        ops.add(newData[field]);
      }
    });
  },
  _updateMeta(id, newData, oldData){
    const rowData = this.rows[id];
    this.ids && this._changeOptions(this.ids, newData, oldData);
    _each(newData, (v, k) => {
      const oldV = oldData?.[k];
      this.notifyIndexOneValue(id, k, v, oldV);
      const outFilters = this.matchingFilters(k, oldV);
      const inFilters = this.matchingFilters(k, v);
      outFilters.forEach(f => {
        if(inFilters.includes(f)) {
          this._changeOptions(f, newData, oldData);
        } else {
          f.delete(id);
          _each(f.options.cache, (ops, field) => ops.remove(oldData?.[field]));
        }
      });
      inFilters.forEach(f => {
        if(!outFilters.includes(f)){
          f.add(id);
          _each(f.options.cache, (ops, field) => ops.add(rowData[field]));
        }
      });
    });
    
    _each(rowData, (v, k) => {
      if(k in newData) return;
      const ff = this.matchingFilters(k, v);
      ff.forEach(f => this._changeOptions(f, newData, oldData));
    });
    this.notifyAllSorts(id, newData, oldData);
    if(id in this.rowBoxes)
			this.rowBoxes[id](rowData);
  },
	notifyIndexOneValue(id, field, newValue, oldValue) {
		const ff = this.filters;
		if(newValue === oldValue)
			return;
		const index = this.assertIndex(field);
    oldValue !== undefined && index.delete(oldValue, id);
    newValue !== undefined && index.add(newValue, id);
  },
	notifyAllSorts(id, newValues, oldValues) {
		_each(newValues, (v, field) => {
      this.notifySorts(id, field, v, oldValues?.[field]);
    });
	},
  notifySorts(id, field, newValue, oldValue){
    _each(this.sortResults[field], s => s.considerChange(id, newValue, oldValue));
  },
	get(id) {
		return this.rows[id];
	},
	change(id, o){
    if(!(id in this.rows))
      throw 'Row ' + id + " not found";
    _each(o, (v, k) => {
      if(!(isValidValue(v) || v === undefined))
        throw 'Invalid value ' + ('' + v) + ':' + typeof v;
    });
    this.writeLog(id, o);
    const oldRow = this.rows[id];
    const newRow = this.rows[id] = {};
    _each(oldRow, (v, k) => k in o || (newRow[k] = v));
    _each(o, (v, k) => v === undefined || (newRow[k] = v));
    this._updateMeta(id, o, oldRow);
	},
	writeLog(id, o) {
		const templateId = this.findTemplate(o);
		const template = this.templates[templateId];
    const data = [templateId, id];
    for(let field of template)
      typeof field === 'string' && data.push(o[field]);
    this._pushLog(data);
	},
  _assertValue(k, v){
    let id = this.values[k]?.[v];
    if(id !== undefined)
      return id;
    id = this.valuesIndex.length;
    this.valuesIndex[id] = [k, v];
    this.values[k] = this.values[k] || Object.create(null);
    this.values[k][v] = id;
    this._pushLog([VALUE, id, k, v]);
    return id;
  },
	findTemplate(o) {
    const template = [];
    for(let i in o)
      template.push(i in this.compressedFields ? this._assertValue(i, o[i]) : i);
		template.sort();
		const id = this.templates.findIndex(r => nice.deepEqual(r, template));
		if(id !== -1)
			return id;
		const newId = this.templates.length;
		this.templates.push(template);
    this._pushLog([TEMPLATE, newId, ...template]);
		return newId;
	},
	rowBox(id) {
		if(!(id in this.rowBoxes)){
			this.rowBoxes[id] = Box(this.rows[id]);
		}
		return	this.rowBoxes[id];
	},
	importLogRow(row) {
		const z = this;
		const templateId = row[0];
		const id = row[1];
    const rows = z.rows;
		if(templateId === TEMPLATE){
			z.templates[id] = row.slice(2);
		} else if(templateId === DELETE){
      const oldData = rows[id];
      delete rows[id];
      z.ids && z.ids.delete(id);
      _each(oldData, (v, k) => z.notifyIndexOneValue(id, k, undefined, v));
		} else if(templateId === COMPRESS){
      z.compressedFields[row[1]] = true;
		} else if(templateId === VALUE){
      const [,id, k, value] = row;
      z.values[k] = z.values[k] || Object.create(null);
      z.values[k][value] = id;
      z.valuesIndex[id] = [k, value];
		} else if(templateId >= 0){
      const create = id in rows ? false : true;
      const oldData = rows[id];
      const newData = z._decodeTemplate(row);
      if(create) {
        rows[id] = newData;
        z._newRow(id, newData);
        z.lastId = id;
      } else {
        const newRow = rows[id] = {};
        _each(oldData, (v, k) => k in newData || (newRow[k] = v));
        _each(newData, (v, k) => v === undefined || (newRow[k] = v));
      }
      z._updateMeta(id, newData, oldData);
		} else {
      throw 'Incorect row id';
    }
		z.log.push(row.slice());
    this.logSubscriptions.forEach(f => f(row, this.version));
    z.version++;
	},
  _decodeTemplate(row){
    const templateId = row[0];
    const template = this.templates[templateId];
    const data = {};
    let i = 2;
    for(const f of template){
      let field, value;
      if(typeof f === 'string'){
        field = f;
        value = row[i++];
      } else {
        [field, value] = this.valuesIndex[f];
      }
      data[field] = value;
    };
    return data;
  },
	subscribeLog(f) {
		this.logSubscriptions.add(f);
	},
	unsubscribeLog(f) {
		this.logSubscriptions.delete(f);
	},
  addSortResult(field, sortResult) {
    (this.sortResults[field] ??= []).push(sortResult);
  },
  addOptions(field, options) {
    (this.options[field] ??= []).push(options);
  },
  readOnly() {
    ['add', 'change', 'delete'].forEach(a => this[a] = () => { throw "This model is readonly"; });
  },
  assertIds(){
    if(!this.ids){
      this.ids = nice.BoxSet();
      this.rows.forEach((_, id) => this.ids.add(id));
      this.ids.options = memoize(field => nice.FilterOptions(this, this.ids, field));
    }
    return this.ids;
  },
  errorBox(){
    return this.error;
  }
};
function RowModel(){
  const res = create(proto, {
    loading: false,
		lastId: -1,
    version: 0,
		templates: [],
		compressedFields: Object.create(null),
		values: Object.create(null),
		valuesIndex: [],
		lastValueId: 0,
		rows: [],
		log: [],
		indexes: {},
		rowBoxes: {},
		filters: {},
    sortResults: {},
    options: {},
		logSubscriptions: new Set(),
    filterCounter: 0,
    compositQueries: {},
    error: Box(),
	});
  function extractOp(o, field) {
    if(o === null)
      return { field, opName: 'null' };
    const [opName, value] = Object.entries(o)[0];
    return { opName, value, field };
  }
  res.history = memoize(id => {
    const check = r => r[1] === id && r[0] > 0;
    const map = r => res._decodeTemplate(r);
    const h = BoxArray(res.log.filter(check).map(map));
    res.subscribeLog(r => check(r) && h.push(map(r)));
    return h;
  });
  res.filter = function(o = {}) {
    const entities = Object.entries(o);
    if(!entities.length)
      return this.assertIds();
    const f = ([field, q]) => typeof q === 'object'
      ? extractOp(q, field)
      : { field, opName: 'eq', value: q };
    const qs = Array.isArray(o)
      ? o.map(v => f(Object.entries(v)[0]))
      : entities.map(f);
    const filters = qs.map(q => newFilter(res, q))
        .sort((a, b) => a._sortKey - b._sortKey);
    while(filters.length > 1){
      const f = filters.shift();
      const f2 = filters[0];
      const key = f._sortKey + '+' + f2._sortKey;
      filters[0] = res.compositQueries[key] ||
        (res.compositQueries[key] = f.intersection(f2));
    }
    return filters[0];
  };
	return res;
}
nice.RowModel = RowModel;
RowModel.fromLog = (log) => {
	const m = RowModel();
	log.forEach(row => m.importLogRow(row));
	return m;
};
RowModel.shadow = (source) => {
  const m = RowModel.fromLog(source.log);
  m.readOnly();
  source.subscribeLog(row => m.importLogRow(row));
  return m;
};
function matchFilter(ff, row) {
	let res = true;
	ff.forEach(f => {
		const [ field, value ] = f;
		if(row[field] !== value)
			res = false;
	});
	return res;
}
function match(q, row) {
  for(let k in q)
		if(row[k] !== q[k])
			return false;
	return true;
}
function isValidValue(v){
	const t = typeof v;
	return t === 'string' || t === 'number' || t === 'boolean';
}
function checkObject(o){
	_each(o, (v, k) => {
		if(!isValidValue(v))
			throw 'Invalid value ' + ('' + v) + ':' + typeof v;
	});
}
nice.Type({
  name: 'FilterOptions',
  extends: 'BoxMap',
  initBy: (z, model, filter, field) => {
    z.super();
    z.filter = filter;
    model.addOptions(field, z);
    
    filter().forEach(id => z.add(model.rows[id]?.[field]));
  },
  proto: {
    coldCompute(){
    },
    warmUp(){
    },
    add(value){
      if(value !== undefined){
        const count = this.get(value) || 0;
        this.set(value, count + 1);
      }
    },
    remove(value){
      if(value !== undefined){
        const count = this.get(value) || 0;
        const newCount = count - 1;
        newCount ? this.set(value, count - 1) : this.delete(value);
      }
    },
    considerChange(id, newValue, oldValue) {
      if(this.filter.has(id)){
        this.remove(oldValue);
        this.add(newValue);
      }
    }
  }
});
nice.Type({
  name: 'RowsFilter',
  extends: 'BoxSet',
  initBy: (z, model) => {
    z.super();
    z.model = model;
    z.sortAsc = memoize(field => nice.SortResult(z, field, 1));
    z.sortDesc = memoize(field => nice.SortResult(z, field, -1));
    z.options = memoize(field => nice.FilterOptions(model, z, field));
  }
});
nice.Mapping.RowsFilter.String('sort', (filter, field, direction = 1) => {
  return filter[direction > 0 ? 'sortAsc' : 'sortDesc' ](field);
});
nice.Type({
  name: 'SortResult',
  extends: 'BoxArray',
  initBy (z, query, field, direction) {
    z.super();
    query.model.addSortResult(field, z);
    z.query = query;
    z.field = field;
    z.direction = direction;
    const rows = query.model.rows;
    z.sortFunction = direction > 0
      ? (a, b) => rows[a][field] > rows[b][field] ? 1 : -1
      : (a, b) => rows[a][field] > rows[b][field] ? -1 : 1;
    z.sortValueFunction = direction > 0
      ? (a, bv) => rows[a][field] > bv ? 1 : -1
      : (a, bv) => rows[a][field] > bv ? -1 : 1;
    z.take = memoize((a, b) => z.window(a, b), (a, b) => a + '_' + b);
    query.subscribe((v, oldV) => {
      oldV !== undefined && z.deleteId(oldV);
      v !== null && z.insertId(v);
    });
  },
  customCall: (z, ...as) => {
    if(as.length === 0) {
      z._isHot === true || z.coldCompute();
      return z._value;
    }
    throw `Can't set value for reactive box`;
  },
  proto: {
    coldCompute(){
      const ids = [...this.query()].sort(this.sortFunction);
      this._value = ids;
    },
    insertId(id) {
      this.insert(sortedPosition(this._value, id, this.sortFunction), id);
    },
    deleteId(id) {
      
      this.removeValue(id);
    },
    considerChange(id, newValue, oldValue) {
      
      const oldPosition = this._value.indexOf(id);
      if(oldPosition === -1 && (newValue === undefined || newValue !== null))
        return;
      const position = sortedPosition(this._value, newValue, this.sortValueFunction);
      if(oldPosition === position)
        return;
      if(oldPosition > position) {
        this.remove(oldPosition);
        this.insert(position, id);
      } else {
        this.insert(position, id);
        oldPosition >= 0 && this.remove(oldPosition);
      }
    }
  }
});
const ops = {
  'null': { arity: 1, f: a => a === undefined },
  eq: { arity: 2, f: (a, b) => a === b },
  startsWith: { arity: 2, f: (a, b) => {
    if(a === undefined || a === null)
      return false;
    return ('' + a).toLowerCase().startsWith(b);
  }}
};
const newFilter = (model, q) => {
  const { field, opName, value } = q;
  expect(field).isString();
  const filters = model.filters;
  if(!(field in filters))
    filters[field] = Object.create(null);
  if(!(opName in filters[field]))
    filters[field][opName] = Object.create(null);
  const opFilters = filters[field][opName];
  const key = JSON.stringify(value);
  if(!(opName in ops))
    throw `Unknown operation: ${opName}`;
  const op = ops[opName].f;
  if(!(key in opFilters)) {
    const filter = opFilters[key] = nice.RowsFilter(model);
    Object.assign(filter, q);
    model.rows.forEach((row, id) => op(row[field], value) && filter.add(id));
    filter._version = model.version;
    filter._sortKey = model.filterCounter++;
  }
  return opFilters[key];
};
function createFilter(model) {
  const filter = (field, value) => newFilter({field, opName: 'eq', value});
  filter.model = model;
  _each(ops, (f, opName) =>
      filter[opName] = (field, value) => newFilter({field, opName, value}));
  return filter;
}
function intersectSets(a , b){
  const res = new Set();
  for (const item of a) {
    b.has(item) && res.add(item);
  }
  return res;
}
function firstOfSet(set){
  for (const item of set) {
    return item;
  }
  return null;
}
})();
(function(){"use strict";const { orderedStringify, memoize, Box, BoxArray } = nice;
nice.Type({
  name: 'RowModelProxy',
  extends: 'DataSource',
  initBy(z, subscribe){
    z.subscribe = subscribe;
    z.filters = {};
    let error;
    z.errorBox = () => {
      if(!error){
        error = Box();
        z.subscribe([{action: 'errorBox', args: []}], r => error(r));
      }
      return error;
    };
    z.filter = memoize(o => nice.RowModelFilterProxy(o, z), JSON.stringify);
    z.rowBox = memoize(id => {
      const res = Box();
      z.subscribe([{action: 'rowBox', args: [id] }], (aa) => res(aa[0]));
      return res;
    });
    z.history = memoize(id => {
      const res = BoxArray();
      const f = BoxArray.subscribeFunction(res);
      z.subscribe([{action: 'history', args: [id] }], r => f(...r));
      return res;
    });
  },
  proto: {
  }
});
nice.Type({
  name: 'RowModelFilterProxy',
  extends: 'BoxSet',
  initBy(z, query, model){
    z.super();
    const q = [{action: 'filter', args: [ query ] }];
    z.warmUp = () => {
      model.subscribe(q, ([v, oldV]) => v === null ? z.delete(oldV) : z.add(v));
    };
    z.sortAsc = memoize(field => nice.RowModelSortProxy(model, q, field, 1));
    z.sortDesc = memoize(field => nice.RowModelSortProxy(model, q, field, -1));
    z.options = memoize(field => {
      const res = BoxMap();
      res.warmUp = () => {
        model.subscribe([...q, {action: 'options', args: [field] }],
          ([v,k,oldV]) => res.set(k,v));
      };
      return res;
    });
  }
});
nice.Type({
  name: 'RowModelSortProxy',
  extends: 'BoxArray',
  initBy(z, model, prefix, field, direction){
    z.super();
    const action = direction > 0 ? 'sortAsc' : 'sortDesc';
    const q = [...prefix, { action , args: [field] }];
    z.warmUp = () => {
      const f = BoxArray.subscribeFunction(z);
      model.subscribe(q, r => f(...r));
    };
    z.take = memoize((a, b) => {
      const res = BoxArray();
      const q2 = [...q, {action: 'take', args: [a, b] }];
      const f = BoxArray.subscribeFunction(res);
      model.subscribe(q2, r => f(...r));
      return res;
    }, (a, b) => a + '_' + b);
  }
});
nice.Type({
  name: 'RowModelOtptionsProxy',
  extends: 'DataSource',
});
})();
(function(){"use strict";const { RowModel } = nice;
Test((Spy) => {
	const m = RowModel();
  const qHome = m.filter({address:'Home'});
  const qHome2 = m.filter({address:'Home2'});
  const qStartWith = m.filter({name: {startsWith: 'jane'}});
  const optionsHome2age = qHome2.options('age');
  const optionsHome = m.filter().options('address');
  const sortHome2 = qHome2.sort('age');
  const sortHome2desc = qHome2.sort('age', -1);
  expect(qHome()).deepEqual([]);
  expect(qHome2()).deepEqual([]);
  expect(sortHome2()).deepEqual([]);
  expect(sortHome2desc()).deepEqual([]);
  expect(optionsHome2age()).deepEqual({});
  expect(optionsHome()).deepEqual({});
  const o = { name: 'Joe', age: 34 };
  const joeId = m.add(o);
  const janeId = m.add({ name: "Jane", age: 23, address: "Home"});
  const jimId = m.add({ name: "Jim", address: "Home2", age: 45});
  const joeBox = m.rowBox(joeId);
  const joeSpy = Spy();
  joeBox.subscribe(joeSpy);
  Test(() => {
    expect([...m.filter()]).deepEqual([joeId, janeId, jimId]);
		expect(m.get(joeId)).deepEqual({ ...o, _id: joeId });
    expect([...qHome()]).deepEqual([janeId]);
    expect([...qStartWith()]).deepEqual([janeId]);
    expect([...qHome2()]).deepEqual([jimId]);
    expect([...m.filter([o])()]).deepEqual([joeId]);
    expect(sortHome2()).deepEqual([jimId]);
    expect(sortHome2desc()).deepEqual([jimId]);
    expect(optionsHome2age()).deepEqual({45:1});
    expect(optionsHome()).deepEqual({"Home":1,"Home2":1});
    expect(joeBox).is(m.rowBox(joeId));
  });
  Test('find', () => {
  });
  Test('assert', () => {
    expect(m.assert({ name: "Jane" })).is(janeId);
  });
  Test(() => {
		expect(joeBox()).deepEqual({ ...o, _id: joeId });
		expect(joeSpy).calledTimes(1);
		m.change(joeId, {age:33});
		expect(joeSpy).calledTimes(2);
	});
  Test(() => {
		expect(() => m.add({name:undefined})).throws();
		expect(() => m.change(joeId, {name:null})).throws();
	});
  Test('change field', () => {
    m.change(joeId, {address:"Home"});
    expect([...qHome()]).deepEqual([janeId, joeId]);
    expect([...qHome2()]).deepEqual([jimId]);
    expect(m.get(joeId).address).is("Home");
    expect(optionsHome()).deepEqual({"Home":2,"Home2":1});
  });
  Test('delete field', () => {
    m.change(janeId, { address: undefined });
    expect([...qHome()]).deepEqual([joeId]);
    expect(m.get(janeId).address).is(undefined);
    expect(optionsHome()).deepEqual({"Home":1,"Home2":1});
  });
  Test('change home2', () => {
    m.change(janeId, {address:"Home2"});
    expect([...qHome()]).deepEqual([joeId]);
    expect([...qHome2()]).deepEqual([jimId, janeId]);
    expect(optionsHome2age).deepEqual({23:1,45:1});
    expect(sortHome2()).deepEqual([janeId,jimId]);
    expect(sortHome2desc()).deepEqual([jimId,janeId]);
    expect(optionsHome()).deepEqual({"Home":1,"Home2":2});
  });
  Test('change age', () => {
    m.change(janeId, {age:46});
    expect(optionsHome()).deepEqual({"Home":1,"Home2":2});
    expect(optionsHome2age()).deepEqual({46:1,45:1});
    expect(sortHome2()).deepEqual([jimId,janeId]);
    expect(sortHome2desc()).deepEqual([janeId,jimId]);
  });
  Test((fromLog) => {
		const m2 = RowModel.fromLog(m.log);
    expect(m2.get(joeId)).deepEqual(m.get(joeId));
    expect(m2.filter().options("address")()).deepEqual({"Home":1,"Home2":2});
    expect(m2.find({name:'Joe',age:33})).is(joeId);
	});
  Test((shadow) => {
    const m2 = RowModel.shadow(m);
    expect(() => m2.add({q:1})).throws();
    expect(m2.filter().options("address")()).deepEqual({"Home":1,"Home2":2});
		const asc = m2.filter({ address: "Home2" }).sort('age');
    expect(asc()).deepEqual([jimId,janeId]);
    expect([...qHome()]).deepEqual([joeId]);
    m.change(jimId, {address:'Home'});
    expect(asc()).deepEqual([janeId]);
    expect([...qHome()]).deepEqual([joeId, jimId]);
    m.change(jimId, {address:'Home2'});
    expect([...qHome()]).deepEqual([joeId]);
    expect(asc()).deepEqual([jimId,janeId]);
	});
  Test('delete', () => {
    m.delete(joeId);
    expect(m.get(joeId)).is(undefined);
    expect(joeSpy).calledWith(undefined);
    expect([...qHome()]).deepEqual([]);
    expect([...qHome2()].sort()).deepEqual([janeId, jimId]);
    expect(sortHome2()).deepEqual([jimId, janeId]);
    expect(sortHome2desc()).deepEqual([janeId, jimId]);
    m.delete(jimId);
    expect([...qHome()]).deepEqual([]);
    expect([...qHome2()]).deepEqual([janeId]);
    expect(sortHome2()).deepEqual([janeId]);
    expect(sortHome2desc()).deepEqual([janeId]);
    expect(optionsHome2age()).deepEqual({46:1});
	});
  m.compressField('occupation');
});
Test((Spy) => {
	const m = RowModel();
  m.compressField('type');
  const janeId = m.add({ name: "Jane", type:'person', age: 23});
  const bimId = m.add({ name: "Bim", type:'dog'});
  const m2 = RowModel.fromLog(m.log);
  expect(m2.get(janeId)).deepEqual(m.get(janeId));
  expect(m.get(bimId)).deepEqual(m2.get(bimId));
});
Test((Spy) => {
	const m = RowModel();
  m.compressField('type');
  m.assert({ translation: 'nice', type: 'translation', word: 86 });
  m.assert({ translation: 'well', type: 'translation', word: 86 });
  m.assert({ translation: 'properly', type: 'translation', word: 86 });
  m.assert({ translation: 'nicely', type: 'translation', word: 86 });
  m.assert({ translation: 'good', type: 'translation', word: 86 });
  m.assert({ translation: 'right', type: 'translation', word: 86 });
  const m2 = RowModel.fromLog(m.log);
  m2.assert({ translation: 'nice', type: 'translation', word: 86 });
  m2.assert({ translation: 'well', type: 'translation', word: 86 });
  m2.assert({ translation: 'properly', type: 'translation', word: 86 });
  m2.assert({ translation: 'nicely', type: 'translation', word: 86 });
  m2.assert({ translation: 'good', type: 'translation', word: 86 });
  m2.assert({ translation: 'right', type: 'translation', word: 86 });
  expect(m2.find({ translation: 'nice', type: 'translation', word: 86 }))
          .deepEqual(0);
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
         ? reflect.createItem(childType, type.defaultArguments[key])
         : reflect.createItem(childType);
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
       ? reflect.createItem(childType, type.defaultArguments[key])
       : reflect.createItem(childType);
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
      z._value[_name] = reflect.createItem(childType);
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
Test((Obj, some, Stop, Spy) => {
  const o = Obj({a:1,b:2});
  const spy = Spy(v => v > 0);
  expect(o.some(spy)).is(true);
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
nice.Mapping(function wrapMatches (s, re, f = nice.B){
  if(!re)
    return [s];
  typeof re === 'string' && (re = RegExp(re.toLowerCase(), 'gi'));
  const res = [];
  let lastIndex = 0;
  let a = [];
  let max = 100;
  while ((a = re.exec(s)) !== null && max--) {
    const slice = s.slice(lastIndex, a.index);
    lastIndex = a.index + a[0].length;
    slice && res.push(slice);
    res.push(f(a[0]));
  }
  res.push(s.substr(lastIndex));
  return res;
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
  _each(a._value, (v, k) => res = f(res, v, k));
  return res;
});
Test((Arr, reduce) => {
  expect(Arr(1,2,3).reduce((a,b) => a + b, 0)).is(6);
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
  return a.reduce((res, v, k) => {
    f(v, k, a) && res.push(v);
    return res;
  }, Arr());
});
Test((Arr, filter) => {
  const a = Arr(1, 2, 3, 4, 5);
  expect(a.filter(x => x % 2)).deepEqual([1,3,5]);
});
M(function random(a){
  return a.get(Math.random() * a._value.length | 0);
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
Mapping.Array('intersperse', (a, separator) => {
  const res = [];
  const last = a.length - 1;
  a.forEach((v, k) => res.push(v) && (k < last && res.push(separator)));
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
Check('between', (n, a, b) => n > a && n < b);
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
nice.Type('Html', (z, tag) => tag && z.tag(tag))
  .about('Represents HTML element.')
  .string('tag', 'div')
  .boolean('forceRepaint', false)
  .object('eventHandlers')
  .object('cssSelectors')
  .Action.about('Adds event handler to an element.')(function on(e, name, f){
    if(name === 'domNode' && IS_BROWSER){
      if(!e.id())
        throw `Give element an id to use domNode event.`;
      const el = document.getElementById(e.id());
      el && f(el);
    }
    const hs = e.eventHandlers();
    hs[name] ? hs[name].push(f) : e.eventHandlers(name, [f]);
    return e;
  })
  .Action.about('Removes event handler from an element.')(function off(e, name, f){
    const handlers = e.eventHandlers(name);
    handlers && nice.removeValue(handlers, f);
    return e;
  })
  .object('style')
  .object('attributes')
  .object('properties')
  .Method('assertId', z => {
    z.id() || z.id(nice.genereteAutoId());
    return z.id();
  })
  .Method.about('Adds values to className attribute.')('class', (z, ...vs) => {
    const current = z.attributes('className') || '';
    if(!vs.length)
      return current;
    const a = current ? current.split(' ') : [];
    vs.forEach(v => !v || a.includes(v) || a.push(v));
    z.attributes('className', a.join(' '));
    return z;
  })
  .ReadOnly(text)
  .ReadOnly(html)
  .ReadOnly('dom', createDom)
  .Method.about('Scroll browser screen to an element.')(function scrollTo(z, offset = 10){
    z.on('domNode', n => {
      n && window.scrollTo(n.offsetLeft - offset, n.offsetTop - offset);
    });
    return z;
  })
  .Action.about('Focuses DOM element.')('focus', (z, preventScroll) =>
      z.on('domNode', node => node.focus(preventScroll)))
  .Action('rBox', (z, ...as) => z.add(RBox(...as)))
  .Action.about('Adds children to an element.')(function add(z, ...children) {
    if(z._children === undefined){
      z._children = [];
    } else {
      if(z._children && z._children._isBoxArray)
        throw 'Children of this element already bound to BoxArray';
    }
    children.forEach(c => {
      if(c === undefined || c === null)
        return;
      if(typeof c === 'string' || c._isStr)
        return z._children.push(c);
      if(Array.isArray(c))
        return c.forEach(_c => z.add(_c));
      if(c instanceof Set){
        for(let _c of c) z.add(_c);
        return;
      }
      if(c._isArr)
        return c.each(_c => z.add(_c));
      if(c._isNum || typeof c === 'number')
        return z._children.push(c);
      if(c._isBox)
        return z._children.push(c);
      if(c === z)
        return z._children.push(`Errro: Can't add element to itself.`);
      if(c._isErr)
        return z._children.push(c.toString());
      if(!c || !nice.isAnything(c))
        return z._children.push('Bad child: ' +
              (c && c.toString) ? c.toString() : JSON.stringify(c));
      if(c !== undefined){
        c = extractUp(c);
      }
      z._children.push(c);
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
Html.map = function(f = v => v){
  return a => this(...a.map(f));
};
nice.Type('Style')
  .about('Represents CSS style.');
const Style = nice.Style;
defGet(Html.proto, function hover(){
  const style = Style();
  this.needAutoClass = true;
  this.cssSelectors(':hover', style);
  return style;
});
def(Html.proto, 'Css', function(s = ''){
  s = s.toLowerCase();
  if(s in this.cssSelectors())
    return this.cssSelectors(s);
  this.needAutoClass = true;
  const style = Style();
  style.up = this;
  this.cssSelectors(s, style);
  return style;
});
function addCreator(type){
  def(Html.proto, type.name, function (...a){
    const res = type(...a);
    const parent = this;
    this.add(res);
    Object.defineProperty(res, 'up', { configurable: true, get(){
      delete res.up;
      return parent;
    }});
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
    Html.proto[property] = function(...a) {
      if(a.length === 0)
        return this.style(property);
      nice.Switch(a[0])
        .isObject().use(o => _each(o, (v, k) => this.style(property + nice.capitalize(k), v)))
        .default.use(() => this.style(property, a.length > 1 ? nice.format(...a) : a[0]))
      return this;
    };
    Style.proto[property] = function(...a) {
      nice.isObject(a[0])
        ? _each(a[0], (v, k) => this.set(property + nice.capitalize(k), v))
        : this.set(property, a.length > 1 ? nice.format(...a) : a[0]);
      return this;
    };
  });
'value,checked,accept,accesskey,action,align,alt,async,autocomplete,autofocus,autoplay,autosave,bgcolor,buffered,challenge,charset,cite,code,codebase,cols,colspan,contextmenu,controls,coords,crossorigin,data,datetime,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,for,form,formaction,headers,hidden,high,href,hreflang,icon,id,integrity,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,manifest,max,maxlength,media,method,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,seamless,selected,shape,sizes,slot,spellcheck,src,srcdoc,srclang,srcset,start,step,summary,tabindex,target,title,type,usemap,wrap'
  .split(',').forEach( property => def(Html.proto, property, function(...a){
      if(a.length){
        this.attributes(property, a.length > 1 ? nice.format(...a) : a[0]);
        return this;
      } else {
        return this.attributes(property);
      }
    }));
def(Html.proto, 'contentEditable', function(...a){
  if(a.length){
    this.attributes('contentEditable', !!a[0]);
    this.forceRepaint(true);
    return this;
  } else {
    return this.attributes(property);
  }
});
Test('Css propperty format', Div => {
  expect(Div().border('3px', 'silver', 'solid').html)
    .is('<div style="border:3px silver solid"></div>');
});
function text(z){
  return z._children
    ? z._children
      .map(v => v.text
        ? v.text
        : nice.htmlEscape(nice.isFunction(v) ? v() : v))
      .jsValue.join('')
    : '';
};
function compileStyle (s){
  let a = [];
  _each(s, (v, k) =>
    a.push(k.replace(/([A-Z])/g, "-$1").toLowerCase() + ':' + v));
  return a.join(';');
};
function compileSelectors (h){
  const a = [];
  _each(h.cssSelectors(), (v, k) => a.push('.',
    getAutoClass(h.attributes('className')),
    k[0] === ':' ? '' : ' ', k, '{', compileStyle(v), '}'));
  return a.length ? '<style>' + a.join('') + '</style>' : '';
};
const _html = v => v._isAnything ? v.html : nice.htmlEscape(v);
nice.ReadOnly.Single('html', z => _html(z._value));
nice.ReadOnly.Arr('html', z => z.reduceTo([], (a, v) => a.push(_html(v)))
    .map(_html).join(''));
function html(z){
  const tag = z.tag();
  const selectors = compileSelectors(z) || '';
  let as = '';
  let style = compileStyle(z.style());
  style && (as = ' style="' + style + '"');
  _each(z.attributes(), (v, k) => {
    k === 'className' && (k = 'class', v.trim());
    as += ` ${k}="${v}"`;
  });
  let body = '';
  let cc = z._children;
  if(cc){
    cc._isAnything && (cc = cc());
    cc.forEach(c => body += c._isAnything ? c.html : nice.htmlEscape(c));
  }
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
function createDom(e){
  const value = e._value;
  const res = document.createElement(value.tag);
  _each(value.style, (v, k) => res.style[k] = '' + v);
  _each(value.attributes, (v, k) => res.setAttribute(k,v));
  _each(value.properties, (v, k) => res[k] = v);
  if(e._children)
    e._children._isBoxArray
      ? attachBoxArrayChildren(res, e._children)
      : e._children.forEach(c => attachNode(c, res));
  _each(value.eventHandlers, (ls, type) => {
    if(type === 'domNode')
      return ls.forEach(f => f(res));
    ls.forEach(f => res.addEventListener(type, f, true));
  });
  e.needAutoClass === true && assertAutoClass(res);
  addSelectors(value.cssSelectors, res);
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
      while(newState !== undefined && newState._up_ && newState._up_ !== newState)
        newState = newState._up_;
      let old = f.state;
      while(old && old._isBox) old = old();
      const newDom = refreshElement(newState, old, f.dom);
      if(newDom !== f.dom){
        f.dom = newDom;
        f.dom.__boxListener = f;
        let parent = f;
        while (parent = parent.parentSubscription) {
          parent.dom = newDom;
        };
      }
    }
    f.state = newState;
  };
  dom.__boxListener = f;
  f.dom = dom;
  f.source = box;
  f.state = state;
  return f;
}
function attachNode(child, parent, position){
  if(child && child._isBox){
    let state = '';
    let dom = toDom(state);
    insertAt(parent, dom, position);
    child.subscribe(createSubscription(child, state, dom));
  } else {
    insertAt(parent, toDom(child), position);
  }
}
function detachNode(dom, parentDom){
  const bl = dom.__boxListener;
  bl !== undefined && bl.source.unsubscribe(bl);
  const cl = dom.__childrenListener;
  cl !== undefined && cl.source.unsubscribe(cl);
  emptyNode(dom);
  parentDom !== undefined && parentDom.removeChild(dom);
}
function emptyNode(node){
  const children = node.childNodes;
  if(children !== undefined) {
    for (let child of children) {
      detachNode(child);
    }
  }
  const assertedClass = node.assertedClass;
  assertedClass !== undefined && killAllRules(assertedClass);
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
function refreshElement(e, old, domNode){
  expect(e).not.isDataSource();
  expect(old).not.isDataSource();
  const eTag = (e !== undefined) && e._isHtml && e.tag(),
        oldTag = (old !== undefined) && old._isHtml && old.tag();
  let newDom = domNode;
  if (eTag !== oldTag || (old && old._isHtml && old.forceRepaint())){
    newDom = toDom(e);
    emptyNode(domNode);
    domNode.parentNode.replaceChild(newDom, domNode);
  } else if(!eTag) {
    domNode.nodeValue = e;
  } else {
    const newV = e._value, oldV = old._value;
    const newStyle = newV.style || {}, oldStyle = oldV.style || {};
    _each(oldStyle, (v, k) => (k in newStyle) || (domNode.style[k] = ''));
    _each(newStyle, (v, k) => oldStyle[k] !== v && (domNode.style[k] = v));
    const newAtrs = newV.attributes || {}, oldAtrs = oldV.attributes || {};
    _each(oldAtrs, (v, k) => (k in newAtrs) || (domNode.removeAttribute(k)));
    _each(newAtrs, (v, k) => oldAtrs[k] !== v && (domNode.setAttribute(k, v)));
    e.needAutoClass === true && assertAutoClass(domNode);
    if(e.needAutoClass || domNode.assertedClass)
      refreshSelectors(newV.cssSelectors, newV.cssSelectors, domNode);
    const newHandlers = newV.eventHandlers || {}, oldHandlers = newV.eventHandlers || {};
    nice._eachEach(oldHandlers, (f, i, type) => {
      if(!(newHandlers[type] && newHandlers[type].includes(f)))
        domNode.removeEventListener(type, f, true);
    });
    nice._eachEach(newHandlers, (f, i, type) => {
      if(!(oldHandlers[type] && oldHandlers[type].includes(f)))
        domNode.addEventListener(type, f, true);
    });
    refreshChildren(e._children, old._children, domNode);
  }
  return newDom;
};
function refreshBoxChildren(aChildren, bChildren, domNode) {
  let ac = aChildren, bc = bChildren;
  if(bChildren._isBoxArray){
    while (domNode.firstChild) {
      detachNode(domNode.lastChild, domNode);
    }
    bc = [];
  }
  if(aChildren._isBoxArray)
    ac  = [];
  refreshChildren(ac, bc, domNode);
  if(aChildren._isBoxArray)
    attachBoxArrayChildren(domNode, aChildren);
}
function refreshChildren(aChildren, bChildren, domNode){
  if(aChildren === bChildren)
    return;
  aChildren = aChildren || [];
  bChildren = bChildren || [];
  if(bChildren._isBoxArray || aChildren._isBoxArray){
    return refreshBoxChildren(aChildren, bChildren, domNode);
  }
  const aKeys = aChildren.map(extractKey);
  const bKeys = bChildren.map(extractKey);
  const aCount = aKeys.reduce(childrenCounter, {});
  const bCount = bKeys.reduce(childrenCounter, {});
  let ai = 0, bi = 0;
  while(ai < aKeys.length){
    const aChild = aKeys[ai], bChild = bKeys[bi];
    if(aChild === bChild && aChild !== undefined){
      refreshElement(aChildren[ai], bChildren[bi], domNode.childNodes[ai]);
      ai++, bi++;
    } else {
      if(!bCount[aChild]){
        attachNode(aChildren[ai], domNode, ai);
        ai++;
      } else if(!aCount[bChild]) {
        detachNode(domNode.childNodes[ai], domNode);
        bi++;
      } else {
        const old = domNode.childNodes[bi];
        old
          ? refreshElement(aChildren[ai], bChildren[bi], old)
          : attachNode(aChildren[ai], domNode, bi);
  
        ai++, bi++;
      }
    }
  };
  while(bi < bKeys.length){
    detachNode(domNode.childNodes[ai], domNode);
    bi++;
  }
};
nice.htmlEscape = s => (''+s).replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
const getAutoClass = s => s.match(/(_nn_\d+)/)[0];
if(IS_BROWSER){
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
    return insertAt(parentNode, extractUp(div).dom, position);
  });
}
function extractUp(e){
  let up = e.up;
  if(up && up._isHtml)
    return extractUp(up);
  return e;
}
function insertAt(parent, node, position){
  typeof position === 'number'
    ? parent.insertBefore(node, parent.childNodes[position])
    : parent.appendChild(node);
  return node;
}
function attachBoxArrayChildren(node, box) {
  const f = (v, k, oldV, oldK) => {
    if(oldK !== null) {
      const child = node.childNodes[oldK];
      detachNode(child, node);
    }
    if(k !== null)
      attachNode(v, node, k);
  };
  f.source = box;
  node.__childrenListener = f;
  box.subscribe(f);
};
function detachBoxArrayChildren(node, box) {
  box.unsubscribe(f, node.__childrenListener);
};
if(IS_BROWSER){
  function killNode(n){
    n && n !== document.body && n.parentNode && n.parentNode.removeChild(n);
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
  Func.Html.BoxArray('bindChildren', (z, b) => {
    z._children = b;
  });
  Func.Html('hide', (e, node) => {
    const subscriptions = e._shownNodes && e._shownNodes.get(node);
    e._shownNodes.delete(node);
    subscriptions && subscriptions.forEach(f => f());
    node && e._children.forEach((c, k) => nice.hide(c, node.childNodes[0]));
    killNode(node);
  });
};
const addRules = (vs, selector, className) => {
  const rule = assertRule(selector, className);
  vs.each((v, k) => rule.style[k] = v);
};
const changeRules = (values, oldValues, selector, className) => {
  const rule = assertRule(selector, className);
  _each(values, (v, k) => rule.style[k] = v);
  _each(oldValues, (v, k) => k in values || (rule.style[k] = null));
};
const findRule = (selector, className) => {
  const s = `.${className}${selector}`.toLowerCase();
  let rule;
  for (const r of runtime.styleSheet.cssRules)
    r.selectorText === s && (rule = r);
  return rule;
};
const assertRule = (selector, className) => {
  const name = selector[0] === ':'
    ? className + selector
    : className + ' ' + selector;
  return findRule(selector, className) || runtime.styleSheet
      .cssRules[runtime.styleSheet.insertRule(`.${name}` + '{}')];
};
const killRules = (vs, selector, id) => {
  const rule = findRule(selector, id);
  rule && _each(vs, (value, prop) => rule.style[prop] = null);
};
const killAllRules = className => {
  const a = [];
  [...runtime.styleSheet.cssRules].forEach((r, i) =>
      r.selectorText.indexOf(className) === 1 && a.unshift(i));
  a.forEach(i => runtime.styleSheet.deleteRule(i));
};
function addSelectors(selectors, node){
  _each(selectors, (v, k) => addRules(v, k, getAutoClass(node.className)));
};
function refreshSelectors(selectors, oldSelectors, node){
  const className = getAutoClass(node.className);
  _each(selectors, (v, k) => changeRules(v, oldSelectors[k], k, className));
  _each(oldSelectors, (v, k) => (k in selectors) || killRules(v, k, className));
};
function assertAutoClass(node) {
  const className = node.className || '';
  if(className.indexOf(nice.AUTO_PREFIX) < 0){
    let name = node.assertedClass;
    if(!name){
      name = nice.genereteAutoId();
      node.assertedClass = name;
    }
    node.className = className !== '' ? (className + ' ' + name) : name;
  }
}
IS_BROWSER && Test((Div) => {
  const testPane = document.createElement('div');
  document.body.appendChild(testPane);
  Test((Div, show) => {
    const div = Div('q')
      .b('w')
      .I('e').up
      .color('red');
    const node = div.show(testPane);
    expect(node.textContent).is('qwe');
    expect(node.style.color).is('red');
  });
  Test((Div, Box, show) => {
    const box = Box('asd');
    const div = Div(box);
    const node = div.show(testPane);
    expect(node.textContent).is('asd');
    box(Div('zxc'));
    expect(node.textContent).is('zxc');
  });
  Test('Reorder children', (Div, Box, show) => {
    const d1 = Div('d1');
    const d2 = Div('d2');
    const d3 = Div('d3');
    const box = Box(Div(d1,d2,d3));
    const div = Div(box);
    const node = div.show(testPane);
    expect(node.textContent).is('d1d2d3');
    box(Div(d2,d3,d1));
    expect(node.textContent).is('d2d3d1');
  });
  Test((Div, Box, Css, show, I, B) => {
    const box = Box(0);
    const initialRulesCount = runtime.styleSheet.rules.length;
    const div = Div(RBox(box, a => {
      return a === 0 ? I('qwe') : B('asd')
        .Css(':first-child').backgroundColor('red').up;
    }));
    const node = div.show(testPane);
    expect(node.textContent).is('qwe');
    box(1);
    expect(node.textContent).is('asd');
    expect(window.getComputedStyle(node.firstChild).backgroundColor)
        .is('rgb(255, 0, 0)');
    box(0);
    expect(node.textContent).is('qwe');
    expect(window.getComputedStyle(node.firstChild).backgroundColor)
        .is('rgba(0, 0, 0, 0)');
    expect(runtime.styleSheet.rules.length).is(initialRulesCount);
  });
  Test((Div, Box, B) => {
    const box = Box(Div(B(1).id('b1'), B(2)));
    const div = Div(box).show();
    expect(div.textContent).is('12');
    box(Div(B(11).id('b1'), B(2)));
    expect(div.textContent).is('112');
    box(Div(B(2), B(11).id('b1')));
    expect(div.textContent).is('211');
  });
  Test((Div) => {
    const div = Div('1').Div('2').Div('3');
    const node = div.show(testPane);
    expect(node.textContent).is('123');
  });
  Test((Div, prop) => {
    expect(nice.Div().properties('qwe', 'asd').show().qwe).is('asd');
  });
  document.body.removeChild(testPane);
});
})();
(function(){"use strict";const Html = nice.Html;
'Div,I,B,Span,H1,H2,H3,H4,H5,H6,P,Li,Ul,Ol,Pre,Table,Tr,Td,Th'.split(',').forEach(t => {
  const l = t.toLowerCase();
  Html.extend(t).by((z, a, ...as) => {
    z.tag(l);
    if(a === undefined)
      return;
    const type = nice.getType(a).name;
    const f = as[0];
    if(a._isBoxArray){
      z.bindChildren(f ?  a.map(f) : a);
    } else if(a._isBoxSet){
      const ba = nice.BoxArray();
      a.subscribe((v, old) => v === null ? ba.removeValue(old) : ba.push(v));
      z.bindChildren(f ?  ba.map(f) : ba);
    } else if( a._isArr ) {
      a.each((v, k) => z.add(f ? f(v, k) : v));
    } else if( type === 'Array' || type === 'Object') {
      _each(a, (v, k) => z.add(f ? f(v, k) : v));
    } else if( a instanceof Set ) {
      for(let c of a) z.add(f ? f(c) : c);
    } else {
      z.add(a, ...as);
    }
  })
    .about('Represents HTML <%s> element.', l);
});
const protocolRe = /^([a-zA-Z0-9]{3,5})\:\/\//;
Html.extend('A').by((z, url, ...children) => {
  z.tag('a').add(...children);
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
  z.tag('img').src(src);
  x === undefined || z.width(x);
  y === undefined || z.height(y);
})
  .about('Represents HTML <img> element.');
})();
(function(){"use strict";const Html = nice.Html;
function defaultSetValue(t, v){
  t.attributes('value', v);
};
const changeEvents = ['change', 'keyup', 'paste', 'search', 'input'];
function attachValue(target, box, valueAttribute = 'value'){
  let node, mute;
  const initValue = box();
  target.attributes(valueAttribute, initValue);
  if(IS_BROWSER){
    let lastValue = initValue;
    changeEvents.forEach(k => target.on(k, e => {
      mute = true;
      const v = (e.target || e.srcElement)[valueAttribute];
      v !== lastValue && box(lastValue = v);
      mute = false;
      return true;
    }));
    target.on('domNode', n => {
      node = n;
      node[valueAttribute] = box();
    });
  }
  box.subscribe(v => {
    if(mute)
      return;
    node ? node[valueAttribute] = v : target.attributes(valueAttribute, v);
  });
  return target;
}
Html.extend('Input', (z, type) =>
    z.tag('input').attributes('type', type || 'text').assertId())
  .about('Represents HTML <input> element.');
const Input = nice.Input;
nice.defineCached(Input.proto, function boxValue() {
  const res = Box('');
  attachValue(this, res);
  return res;
});
def(Input.proto, 'value', function(v){
  if(v !== undefined && v._isBox) {
    attachValue(this, v);
  } else {
    this.attributes('value', v);
  }
  return this;
});
Test((Input) => {
  const i1 = Input();
  expect(i1.html).is('<input type="text" id="' + i1.id() + '"></input>');
  const i2 = Input('date');
  expect(i2.html).is('<input type="date" id="' + i2.id() + '"></input>');
  const i3 = Input().value('qwe')
  expect(i3.html).is('<input type="text" id="' + i3.id() + '" value="qwe"></input>');
});
Test('Box value html', (Input, Box) => {
  const b = Box('qwe');
  const input = Input().value(b);
  expect(input.html).is('<input type="text" id="' + input.id() + '" value="qwe"></input>');
  b('asd');
  expect(input.html).is('<input type="text" id="' + input.id() + '" value="asd"></input>');
});
IS_BROWSER && Test('Box value dom', (Input, Box) => {
  const b = Box('qwe');
  const input = Input().value(b);
  expect(input.html).is('<input type="text" id="' + input.id() + '" value="qwe"></input>');
  b('asd');
  expect(input.html).is('<input type="text" id="' + input.id() + '" value="asd"></input>');
});
Html.extend('Button', (z, text = '', action) => {
    z.super('button').type('button').on('click', action).add(text);
  })
  .about('Represents HTML <input type="button"> element.');
Test((Button) => {
  const b = Button('qwe');
  expect(b.html).is('<button type="button">qwe</button>');
});
Input.extend('Textarea', (z, v) => {
    z.tag('textarea');
    if(v !== undefined && v._isBox){
      attachValue(this, v, (t, v) =>  t.children.removeAll().push(v));
    } else {
      z.add(v);
    };
  })
  .about('Represents HTML <textarea> element.');
Test(Textarea => {
  const ta = Textarea('qwe');
  expect(ta.html).is('<textarea>qwe</textarea>');
});
Html.extend('Submit', (z, text, action) => {
    z.tag('input')
      .attributes('type', 'submit')
      .attributes('value',  text || 'Submit')
      .assertId();
    action && z.on('click', action);
  })
  .about('Represents HTML <input type="submit"> element.');
Html.extend('Form', (z, handler) => {
    z.tag('form').assertId();
    handler && z.on('submit', e => {
      const input = {}, form = e.currentTarget;
      e.preventDefault();
      for(let field of form.elements) {
        field.name && (input[field.name] = field.value);
      }
      handler(input);
    });
  })
  .about('Represents HTML Form element.');
nice.Form.fromConfig = cfg => {
  expect(cfg.handler).isFunction();
  expect(cfg.fields).isArray();
  const errors = memoize(() => Box(''));
  const index = {};
  const form = nice.Form((data) => {
    _each(errors.cache, e => e(''));
    _some(data, (v, k) => _if(index[k]?.check, check =>
        _if(check(v), res => (errors(k)(res),res)))
    ) || cfg.handler(data);
  });
  form.error = Box('');
  _each(cfg.fields, f => {
    expect(f.name).isString();
    index[f.name] = f;
    const editor = f.editor
        ? f.editor(f)
        : Input().name(f.name).value(f.value || '');
    form.add(cfg.styling ? cfg.styling(f, editor, errors(name)) :
      nice.P(f.title || f.name).div(editor).Div(errors(name)).color('red').up);
  });
  form.reportError = es => _each(es, (v, k) => errors(k)(v));
  form.P()
    .Submit().up
    .div(form.error);
  return form;
};
Input.extend('Checkbox', (z, status = false) => {
    let node;
    z.tag('input');
    z.attributes('type', 'checkbox');
    z.attributes('checked', status);
    z.assertId();
  })
  .about('Represents HTML <input type="checkbox"> element.');
nice.defineCached(nice.Checkbox.proto, function boxValue() {
  const res = Box(this.attributes('checked'));
  attachValue(this, res, 'checked');
  return res;
});
  Input.extend('Select', (z, values, selected) => {
    let node;
    z.tag('select').assertId();
    let mute;
    z.on('change', e => {
      mute = true;
      mute = false;
      return true;
    });
    if(IS_BROWSER){
      z.on('domNode', n => node = n);
    }
    _each(values, (v, k) => {
      const o = Html('option').add(v);
      selected === v && o.selected(true);
      z.add(o);
    });
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
  .Method(addRoutes)
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
    let route = z.staticRoutes(url);
    route || z.queryRoutes.some(f => route = f(url, query));
    return route || false;
  });
function addRoutes(router, rr) {
  _each(rr, (v, k) => addRoute(router, k, v));
}
function addRoute(router, pattern, f){
  if(!pattern || pattern === '/'){
    router.staticRoutes('/', f);
    return router;
  }
  pattern[0] === '/' || (pattern = '/' + pattern);
  const params = pattern.match(paramsRe);
  if(!params){
    router.staticRoutes(nice.trimRight(pattern, '/'), f);
    return router;
  }
  const s = pattern.replace('.', '\\.');
  const re = new RegExp('^' + s.replace(paramsRe, '(.+)'));
  const res = (s, query) => {
    const a = re.exec(s);
    if(!a)
      return false;
    params.forEach((v, k) => query[v.substr(1)] = a[k+1]);
    return (...as) => f(query, ...as);
  };
  res.pattern = pattern;
  const i = nice.sortedIndex(router.queryRoutes._value, res, routeSort);
  router.queryRoutes.insertAt(i, res);
  return router;
}
function routeSort (a, b) {
  a = a.pattern;
  b = b.pattern;
  let res = b[b.length - 1] === '*' ? -1 : 0;
  return res + b.length - a.length;
};
Test((Router, Spy) => {
  const r = Router();
  const f = () => 1;
  r.addRoute('/', f);
  expect(r.resolve('/')).is(f);
  let res;
  const f2 = o => res = o.id;
  r.addRoute('/page/:id', f2);
  r.addRoute('/pages/:type', f);
  r.resolve('/page/123')();
  r.addRoute('/pagesddss', f);
  expect(res).is('123');
});
Test((Router, addRoutes) => {
  const r = Router();
  const f = () => 1;
  r.addRoutes({'/asd': f});
  expect(r.resolve('/asd')).is(f);
  expect(r.resolve('/')).not.is(f);
});
nice.Type({
  name: 'WindowRouter',
  extends: 'Router',
  initBy: (z, div = nice.Div()) => {
    if(window && window.addEventListener){
      if(nice.Html.linkRouter)
        throw new Error('Only one WindowRouter per session is allowed');
      nice.Html.linkRouter = z;
      z.origin = window.location.origin;
      let lastHandlers = null;
      div.add(nice.RBox(z.currentUrl, url => {
        if(lastHandlers !== null)
          _each(lastHandlers, (v, k) => window.removeEventListener(k, v));
        const route = z.resolve(url);
        let content = route ? route() : `Page "${url}" not found`;
        if(content === undefined)
          return '';
        if(content.__proto__ === Object.prototype){
          content.title && (window.document.title = content.title);
          if(content.handlers) {
            lastHandlers = content.handlers;
            _each(lastHandlers, (v, k) => window.addEventListener(k, v));
          }
          content = content.content;
        }
        if(Array.isArray(content))
          content = nice.Div(...content);
        while(content !== undefined && content._up_ && content._up_ !== content)
          content = content._up_;
        return content;
      }));
      window.addEventListener('load', () => div.show());
      window.addEventListener('popstate', function(e) {
        z.currentUrl(e.target.location.pathname);
        return false;
      });
    }
  }
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
  try {
    if(location.pathname + location.hash !== url)
      window.history.pushState(url, url, url);
  } catch (e) {
    console.log(e);
  }
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
  expect(cat.name()).is('a cat');
  cat.name('Ball');
  expect(cat.name()).is('Ball');
});
Test("primitive type check", (Type) => {
  Type('Cat3').string('name');
  const cat = nice.Cat2();
  cat.name(2);
  expect(cat.name()).is('2');
});
Test("js object property", (Type) => {
  Type('Cat41').object('friends');
  const cat = nice.Cat41();
  expect(cat.friends()).deepEqual({});
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
  const x = times(2, (n, a) => n, []);
  expect(x).deepEqual([0,1]);
});
Test((Pipe) => {
  const x2 = a => a * 2;
  const plusOne = a => a + 1;
  const plus = (a, b) => a + b;
  const f = Pipe('count', plusOne, x2, Math.cbrt, [plus, 3]);
  expect(f({count: 3})).is(5);
});
Test((sortedPosition) => {
  const a = [1,2,3,4,5,6];
  expect(sortedPosition(a, 0)).is(0);
  expect(sortedPosition(a, 2.5)).is(2);
  expect(sortedPosition(a, 10)).is(6);
});
Test((orderedStringify) => {
  const o1 = {qwe:1,asd:2};
  const o2 = {asd:2,qwe:1};
  const s1 = orderedStringify(o1);
  const s2 = orderedStringify(o2);
  expect(s1).is('{"asd":2,"qwe":1}');
  expect(s1).is(s2);
});
})();;nice.version = "0.4.0";})();