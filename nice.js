;let nice;(function(){let create,Div,Func,Switch,expect,is,_each,def,defAll,defGet,Anything,Box,Action,Mapping,Check,reflect;
(function(){"use strict";
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
  checkFunctions: {},
  collectionReducers: {},
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
})();
(function(){"use strict";const formatRe = /(%([jds%]))/g;
const formatMap = { s: String, d: Number, j: JSON.stringify };
const ID_SYMBOLS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
defAll(nice, {
  _map (o, f) {
    let res = {};
    for(let i in o)
      res[i] = f(o[i]);
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
  orderedStringify: o => !nice.isObject(o)
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
    t = '' + t;
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
      if(res._items.hasOwnProperty(k))
        return res._items[k];
      return res._items[k] = f(k, ...a);
    };
    res._items = {};
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
    const parent = Object.getPrototypeOf(o);
    return parent
      ? [parent].concat(nice.prototypes(parent))
      : [];
  },
  keyPosition: (c, k) => typeof k === 'number' ? k : Object.keys(c).indexOf(k),
  _capitalize: s => s[0].toUpperCase() + s.substr(1),
  _decapitalize: s => s[0].toLowerCase() + s.substr(1),
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
    o.tests = s.tests.map(wrapTest(s));
    o.type = s.type
    res.functions.push(o);
    (res.fs[s.name] = res.fs[s.name] || {})[o.title] = o;
  });
  reflect.on('Type', t => {
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
  const listeners = o.hasOwnProperty('_listeners')
    ? o._listeners
    : o._listeners = {};
  return listeners[name] || (listeners[name] = []);
}
function assertEvents(o, name){
  const events = o.hasOwnProperty('_events')
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
    this.listeners(name).forEach(f => f.apply(this, a));
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
  listenerCount (name){
    return this._listeners
      ? this._listeners[name]
        ? this._listeners[name].length
        : 0
      : 0;
  },
  off (name, f) {
    if(this.hasOwnProperty('_listeners') && this._listeners[name]){
      nice._removeArrayValue(this._listeners[name], f);
      this.emit('removeListener', name, f);
    }
    return this;
  },
  removeAllListeners (name) {
    if(this.hasOwnProperty('_listeners')){
      const a = this._listeners[name];
      this._listeners[name] = [];
      a.forEach(f => this.emit('removeListener', name, f));
    }
    return this;
  }
};
nice.eventEmitter = o => defAll(o, EventEmitter);
def(nice, 'EventEmitter', EventEmitter);
def(nice, 'reflect', create(EventEmitter));
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
  function: 'Func',
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
  function: nice.jsTypes.Function
};
})();
(function(){"use strict";const configProto = {
  next (o) {
    const c = Configurator(this.name || o.name);
    c.signature = (this.signature || []).concat(o.signature || []);
    ['existing', 'functionType', 'returnValue', 'description', 'tests']
      .forEach(k => c[k] = o[k] || this[k]);
    return c;
  },
  about (s) { return this.next({ description: s}); },
  test (s, f) {
    return this.next({ tests: this.tests.concat([{
      body: f || s,
      description: f ? s : ''
    }])});
  },
};
const functionProto = {
  addSignature (body, signature, name){
    const ss = this.signatures = this.signatures || new Map();
    if(signature && signature.length){
      const combinations = allSignatureCombinations(signature);
      combinations.forEach(combination => {
        let _ss = ss;
        const lastI = combination.signature.length - 1;
        combination.signature.forEach((type, i) => {
          if(_ss.has(type)){
            _ss = _ss.get(type);
          } else {
            const s = new Map();
            _ss.set(type, s);
            _ss = s;
          }
        });
        if(_ss.action) {
          const existingN = nice._size(_ss.transformations);
          const newN = nice._size(combination.transformations);
          if(!existingN && !newN)
            throw `Function "${name}" already have signature
                [${signature.map(v=>v.name + ' ')}]`;
          if(existingN > newN){
            _ss.action = body;
            _ss.transformations = combination.transformations;
          }
        } else {
          _ss.action = body;
          _ss.transformations = combination.transformations;
        }
      });
    } else {
      ss.action = body;
    }
    return this;
  },
  ary (n){
    return (...a) => this(...a.splice(0, n));
  },
  about (s) {
    return configurator({ description: s });
  },
  test (s, f) {
    return configurator({ tests: this.tests.concat([{
      body: f || s,
      description: f ? s : ''
    }])});
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
      description: z.description,
      type: z.functionType,
      existing: z.existing,
      name: z.name || name,
      body: body || z.body,
      signature: (z.signature || []).concat(signature || []),
      tests : z.tests
    });
    return z.returnValue || res;
  });
  nice.rewriteProperty(z, 'name', name || '');
  z.tests = [];
  return z;
}
function configurator(...a){
  const cfg = parseParams(...a);
  return Configurator(cfg.name).next(cfg);
};
function createFunction({ existing, name, body, signature, type, description, tests }){
  if(name && typeof name === 'string' && name[0] !== name[0].toLowerCase())
    throw "Function name should start with lowercase letter. "
          + `"${nice._decapitalize(name)}" not "${name}"`;
  existing = existing || (name && nice[name]);
  const f = existing || createFunctionBody(type);
  if(existing && existing.functionType !== type)
    throw `function '${name}' can't have types '${existing.functionType}' and '${type}' at the same time`;
  
  body && f.addSignature(body, signature.map(v => v.type), name);
  f.maxLength >= signature.length || (f.maxLength = signature.length);
  if(name){
    if(!existing){
      f.name !== name && nice.rewriteProperty(f, 'name', name);
      def(nice, name, f);
      reflect.emitAndSave('function', f);
      type && reflect.emitAndSave(type, f);
    }
    body && reflect.emitAndSave('signature',
      { name, body, signature, type, description, f, tests });
  }
  return f;
};
nice.reflect.on('signature', ({ name, signature, f }) => {
  Anything && !Anything.proto.hasOwnProperty(name) &&
      def(Anything.proto, name, function(...a) { return f(this, ...a); });
  const type = signature[0] && signature[0].type;
  if(type && !type._isJsType){
    type && !type.proto.hasOwnProperty(name)
        && def(type.proto, name, function(...a) { return f(this, ...a); });
  }
});
function createFunctionBody(functionType){
  const {$1,$2,$3,$4,$$} = nice;
  const z = create(functionProto, (...args) => {
    for(let a of args){
      if(a === $1 || a === $2 || a === $3 || a === $4 || a === $$)
        return skip(z, args);
    }
    let target = z.signatures;
    const l = args.length;
    for(let i = 0; i < l; i++) {
      if(target && target.size){
        let type = nice.getType(args[i]);
        let found = null;
        while(type){
          found = target.get(type);
          if(found){
            break;
          } else {
            type = Object.getPrototypeOf(type);
          }
        }
        target = found;
      }
    }
    if(!target)
      throw signatureError(z.name, args);
    if(target.transformations)
      for(let i in target.transformations)
        args[i] = target.transformations[i](args[i]);
    if(functionType === 'Action')
      args[0].transactionStart && args[0].transactionStart();
    const res = target.action(...args);
    if(functionType === 'Action'){
      args[0].transactionStart && args[0].transactionEnd();
      return args[0];
    }
    return res;
  });
  z.functionType = functionType;
  return z;
}
function mirrorType (t) {
  if(t._isJsType){
    return nice[t.niceType];
  } else if (t._isNiceType){
    const jsTypeName = nice.typesToJsTypesMap[t.name];
    return jsTypeName === undefined ? null : nice.jsTypes[jsTypeName] || null;
  }
  throw 'I need type';
};
function addCombination (a, type, mirror, transformation) {
  const res = [];
  const position = a[0].signature.length;
  a.forEach((last, k) => {
    res.push({
      signature: [ ...last.signature, type],
      transformations: Object.assign({}, last.transformations )
    });
    mirror !== null && res.push({
      signature: [ ...last.signature, mirror],
      transformations: Object.assign({}, last.transformations, { [position]: transformation})
    });
  });
  return res;
}
function allSignatureCombinations (ts) {
  let res = [];
  ts.forEach((type, i) => {
    const mirror = mirrorType(type);
    if(i === 0){
      res.push({signature: [type], transformations: []});
      mirror === null || res.push({
        signature: [mirror],
        transformations: { 0: type._isJsType ? v => v() : nice}
      });
    } else {
      res = addCombination (res, type, mirror, type._isJsType ? v => v() : nice);
    }
  });
  return res;
}
function signatureError(name, a, s){
  return `Function ${name} can't handle (${a.map(v => nice.typeOf(v).name).join(',')})`;
}
function handleType(type){
  type.name === 'Something' && create(type.proto, functionProto);
  defGet(functionProto, type.name, function() {
    return configurator({ signature: [{type}], existing: this });
  });
  defGet(configProto, type.name, function() {
    return this.next({signature: [{type}]});
  });
};
const skipedProto = {};
[1,2,3,4].forEach(n => nice['$' + n] = a => a[n - 1]);
nice.$$ = a => a;
function _skipArgs(init, called) {
  const {$1,$2,$3,$4,$$} = nice;
  const res = [];
  init.forEach(v => v === $$
    ? res.push(...called)
    : res.push(( v===$1 || v === $2 || v === $3 || v === $4) ? v(called) : v));
  return res;
};
def(nice, _skipArgs);
function skip(f1, args1){
  const f = create(skipedProto, function (...as) {
    let res;
    f.queue.forEach(({action, args}, k) => {
      const a2 = _skipArgs(args, as);
      res = k ? action(res, ...a2) : action(...a2);
    });
    return res;
  });
  f.queue = [];
  f1 && f.queue.push({action: f1, args: args1});
  return f;
};
def(nice, skip);
reflect.on('function', (f) => {
  f.name && !skipedProto[f.name] && def(skipedProto, f.name, function(...args){
    this.queue.push({action: f, args});
    return this;
  });
});
for(let i in nice.jsTypes) handleType(nice.jsTypes[i]);
reflect.on('Type', handleType);
Func = def(nice, 'Func', configurator());
Action = def(nice, 'Action', configurator({functionType: 'Action'}));
Mapping = def(nice, 'Mapping', configurator({functionType: 'Mapping'}));
Check = def(nice, 'Check', configurator({functionType: 'Check'}));
const ro = def(nice, 'ReadOnly', {});
reflect.on('Type', type => {
  ro[type.name] = function (...a) {
    const [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
    expect(f).isFunction();
    defGet(type.proto, name, function() { return f(this); } );
    return this;
  };
});
def(nice, 'runTests', () => {
  console.log('');
  console.log(' \x1b[34mRunning tests\x1b[0m');
  console.log('');
  let good = 0, bad = 0, start = Date.now();;
  nice.reflect.on('signature', s => {
    s.tests.forEach(t => {
      try {
        t.body(...nice.argumentNames(t.body).map(n => nice[n]));
        good++;
      } catch (e) {
        bad ++;
        console.log(' ', s.name, t.description);
        console.error('  ', e);
      }
    });
  });
  console.log(' ');
  console.log(bad ? '\x1b[31m' : '\x1b[32m',
    `Tests done. OK: ${good}, Error: ${bad}\x1b[0m (${Date.now() - start}ms)`);
  console.log('');
});
})();
(function(){"use strict";defAll(nice, {
  _newItem: (type) => {
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
    nice._assignType(f, type || Anything);
    f._originalType = type;
    return f;
  },
  _assignType: (item, type) => {
    create(type.proto, item);
    'name' in type.proto && nice.eraseProperty(item, 'name');
    'length' in type.proto && nice.eraseProperty(item, 'length');
  }
});
nice.registerType({
  name: 'Anything',
  description: 'Parent type for all types.',
  extend (name, by){
    return nice.Type(name, by).extends(this);
  },
  itemArgs0: z => z._value,
  itemArgs1: (z, v) => z._setValue(v),
  itemArgsN: (z, vs) => {
    throw `${z._type.name} doesn't know what to do with ${vs.length} arguments.`;
  },
  initChildren: () => 0,
  fromValue (_value){
    return Object.assign(this(), { _value });
  },
  deserialize (v){
    const res = this();
    res._value = nice.deserialize(v);
    return res;
  },
  _isNiceType: true,
  proto: {
    _isAnything: true,
    valueOf () {
      return this.hasOwnProperty('_value') ? this._value : undefined;
    },
    super (...as){
      const type = this._type;
      const superType = type.super;
      this._type = superType;
      superType.initBy(this, ...as);
      this._type = type;
      return this;
    },
    apply(f){
      f(this);
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
    _setValue (v){
      if(v === this._value)
        return;
      this.transaction(() => {
        !this.hasOwnProperty('_oldValue') && (this._oldValue = this._value);
        this._value = v;
      });
    },
  },
  checkInvariants (v) {
    this.super && this.super.checkInvariants(v);
    this.invariants && this.invariants.forEach(f => {
      if(!f(v))
        throw 'Badd';
    });
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
      const [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
      expect(f).isFunction();
      defGet(this.target.proto, name, function() {
        return f(this);
      });
      return this;
    },
    invariant (f) {
      this.target.hasOwnProperty('invariants')
        ? this.target.invariants.push(f)
        : def(this.target, 'invariants', [f]);
      return this;
    }
  },
  types: {},
  static (...a) {
    const [name, v] = a.length === 2 ? a : [a[0].name, a[0]];
    def(this, name, v);
    return this;
  }
})
Anything = nice.Anything;
defGet(Anything.proto, function jsValue() { return this._value; });
defGet(Anything.proto, 'switch', function () { return Switch(this); });
nice.ANYTHING = Object.seal(create(Anything.proto, new String('ANYTHING')));
Anything.proto._type = Anything;
})();
(function(){"use strict";const { $1, $2, $3, $4, $$ } = nice;
['Check', 'Action', 'Mapping'].forEach(t => Check
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
  deepEqual: (a, b) => nice.diff(a, b) === false,
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
  isEnvBrowser: () => typeof window !== 'undefined'
};
for(let i in basicChecks)
  Check(i, basicChecks[i]);
is = nice.is;
const basicJS = 'number,function,string,boolean,symbol'.split(',');
for(let i in nice.jsTypes){
  const low = i.toLowerCase();
  Check.about(`Checks if \`v\` is \`${i}\`.`)
    ('is' + i, basicJS.includes(low)
    ? v => typeof v === low
    : v => v && v.constructor ? v.constructor.name === i : false);
};
reflect.on('Type', function defineReducer(type) {
  type.name && Check
    .about('Checks if `v` has type `' + type.name + '`')
    ('is' + type.name, v => v && v._type ? type.proto.isPrototypeOf(v) : false);
});
const throwF = function(...as) {
  this.use(function(){
    throw nice.format(...as);
  });
};
const switchProto = create(nice.checkers, {
  valueOf () { return this.res; },
  check (f) {
    this._check = f;
    const res = switchResult.bind(this);
    res.use = switchUse.bind(this);
    res.throw = throwF;
    return res;
  },
  is (v) {
    this._check = (a) => is(v, a);
    const res = switchResult.bind(this);
    res.use = switchUse.bind(this);
    res.throw = throwF;
    return res;
  },
});
defGet(switchProto, 'default', function () {
  const z = this;
  const res = v => z.done ? z.res : v;
  res.use = f => z.done ? z.res : f(...z.actionArgs);
  res.throw = throwF;
  return res;
});
const actionProto = {};
reflect.on('function', f => {
  if(f.functionType !== 'Check'){
    actionProto[f.name] = function(...a){ return this.use(v => f(v, ...a)); };
  }
});
const delayedProto = create(nice.checkers, {
  check (f) {
    this._check = f;
    const res = create(actionProto, delayedResult.bind(this));
    res.use = delayedUse.bind(this);
    res.throw = throwF;
    return res;
  },
  is (f) {
    this._check = (v) => is(v, f);
    const res = create(actionProto, delayedResult.bind(this));
    res.use = delayedUse.bind(this);
    res.throw = throwF;
    return res;
  },
});
defGet(delayedProto, 'default', function () {
  const z = this, res = v => { z._default = () => v; return z; };
  res.use = f => { z._default = f; return z; };
  res.throw = throwF;
  return res;
});
function switchResult(v){
  const z = this;
  if(!z.done && z._check(...z.checkArgs)){
    z.res = v;
    z.done = true;
  }
  z._check = null;
  return z;
}
function switchUse(f){
  const z = this;
  if(!z.done && z._check(...z.checkArgs)){
    z.res = f(...z.actionArgs);
    z.done = true;
  }
  z._check = null;
  return z;
};
function delayedResult(v){
  const z = this;
  z.cases.push(z._check, () => v);
  z._check = null;
  return z;
}
function delayedUse(f){
  const z = this;
  z.cases.push(z._check, f);
  z._check = null;
  return z;
}
const S = Switch = nice.Switch = (...args) => {
  for(let a of args){
    if(a === $1 || a === $2 || a === $3 || a === $4 || a === $$)
      return DelayedSwitch(args);
  }
  const f = () => f.done ? f.res : args[0];
  f.checkArgs = args;
  f.actionArgs = args;
  f.done = false;
  f.addCheck = check => {
    const preCheck = f._check;
    f._check = preCheck ? (...a) => preCheck(check(...a)) : check;
    const res = create(actionProto, switchResult.bind(f));
    res.use = switchUse.bind(f);
    res.throw = throwF;
    return res;
  };
  return create(switchProto, f);
};
defGet(switchProto, 'not', function (){
  this._check = r => !r;
  return this;
});
defGet(delayedProto, 'not', function (){
  this._check = r => !r;
  return this;
});
reflect.on('Check', f => {
  if(!f.name || nice.checkers[f.name])
    return;
  const tryF = (...a) => {
    try {
      return f(...a);
    } catch (e) {
      return false;
    }
  };
  if(f.maxLength > 1){
    def(nice.checkers, f.name, function (...a) {
      return this.addCheck(v => tryF(v, ...a));
    });
  } else {
    defGet(nice.checkers, f.name, function(){
      return this.addCheck(tryF);
    });
  };
});
create(nice.checkers, S);
function DelayedSwitch(initArgs) {
  const f = (...a) => {
    const l = f.cases.length;
    let action = f._default;
    const args = nice._skipArgs(initArgs, a);
    for(let i = 0 ;  i < l; i += 2){
      if(f.cases[i](...args)){
        action = f.cases[i + 1];
        break;
      }
    }
    return action ? action(...args) : args[0];
  };
  f.cases = [];
  f.addCheck = check => {
    const preCheck = f._check;
    f._check = preCheck ? (...a) => preCheck(check(...a)) : check;
    const res = create(actionProto, delayedResult.bind(f));
    res.use = delayedUse.bind(f);
    res.throw = throwF;
    return res;
  };
  return create(delayedProto, f);
};
})();
(function(){"use strict";def(nice, 'expectPrototype', {
  toBe (value){
    if(!value) {
      if(!this.value)
        throw this.text || 'Value expected';
    } else {
      if(this.value != value)
        throw this.text || value + ' expected';
    }
  },
  notToBe (value){
    if(!value) {
      if(this.value)
        throw this.text || 'No value expected';
    } else {
      if(this.value == value)
        throw this.text || value + ' not expected';
    }
  },
  toMatch (f){
    if(!f(this.value))
      throw this.text || ('Value does not match function ' + f);
  }
});
reflect.on('Check', f => {
  f.name && def(nice.expectPrototype, f.name, function(...a){
    if(!f(this.value, ...a)){
      console.trace();
      throw this.text || ['Expected', this.value, 'to be', f.name, ...a].join(' ');
    }
    return nice.Ok();
  });
});
def(nice, function expect(value, ...texts){
  return create(nice.expectPrototype, { value, texts, item: this});
});
defGet(nice.expectPrototype, function text(){
  return nice.format(...this.texts);
});
def(nice.expectPrototype, function message(...a){
  this.texts = a;
  return this;
});
expect = nice.expect;
})();
(function(){"use strict";const NO_NEED = {};
def(nice, 'observableProto', {
  _isResolved() { return true; },
  listen (f, target) {
    if(typeof f === 'object'){
      f = this._itemsListener(f);
    }
    const key = target || f;
    const ss = this._subscribers = this._subscribers || new Map();
    if(!ss.has(key)){
      this.compute && this.compute();
      ss.set(key, f);
      const val = this._notificationValue ? this._notificationValue() : this;
      nice.isPending(val) || f(val);
    }
    if(target) {
      target._subscriptions = target._subscriptions || [];
      target._subscriptions.push(this);
    }
    return () => this.unsubscribe(key);
  },
  listenChanges(f, target) {
    let counter = 0;
    if(typeof f === 'object'){
      f = this._itemsListener(f);
    }
    this.listen((...a) => counter++ && f(...a), target || f);
  },
  listenChildren (f, path = [], skip = true) {
    this.listen(this.isObj()
      ? {
          onRemove: (v, k) => {
            
            v.unsubscribe && v.unsubscribe(f);
            f(null, path.concat(k));
          },
          onAdd: (v, k) => {
            const _path = path.concat(k);
            skip || f(v, _path);
            v && v._isAnything&& v.listenChildren(f, _path, skip);
          }
        }
      : v => skip || f(v, path),
    f);
    skip = false;
  },
  transactionStart (){
    if(this._locked)
      throw nice.LOCKED_ERROR;
    if(!this._transactionDepth){
      this._transactionDepth = 0;
    }
    this._transactionDepth++;
    return this;
  },
  transactionEnd (){
    if(--this._transactionDepth > 0)
      return false;
    this._type.checkInvariants(this);
    this._transactionDepth = 0;
    this._oldValue === this._value || notify(this);
    delete this._newValue;
  },
  transactionRollback (){
    this._transactionDepth && (this._result = this.initState);
    this._transactionDepth = 0;
    this.initState = null;
    delete this._newValue;
    return this;
  },
  _isHot (){
    return this._hotChildCount ||
      (this._subscribers && this._subscribers.size);
  },
  transaction (f) {
    this.transactionStart();
    f(this);
    this.transactionEnd();
    return this;
  },
  listenOnce (f, target) {
    this._isResolved() || this.compute();
    if(this._isResolved())
      return f(this._notificationValue ? this._notificationValue() : this);
    const key = target || f;
    const _f = v => {
      f(v);
      this.unsubscribe(key);
    };
    (this._subscribers = this._subscribers || new Map());
    this._subscribers.set(key, f);
    return this;
  },
  unsubscribe (target){
    this._subscribers.delete(target);
    if(!this._subscribers.size){
      this._subscriptions &&
        this._subscriptions.forEach(_s => _s.unsubscribe(this));
    }
  }
});
defAll(nice.Anything.proto, nice.observableProto);
function notify(z){
  let needNotification = false;
  let oldValue;
  if(z.hasOwnProperty('_oldValue')) {
    needNotification = true;
    oldValue = z._oldValue;
    delete z._oldValue;
  }
  if(needNotification && z._subscribers){
    z._notifing = true;
    z._subscribers.forEach(s => {
      z._isResolved()
          && s(z._notificationValue ? z._notificationValue() : z, oldValue);
    });
    z._notifing = false;
  }
};
})();
(function(){"use strict";def(nice, function extend(child, parent){
  if(parent.extensible === false)
    throw `Type ${parent.name} is not extensible.`;
  create(parent, child);
  create(parent.proto, child.proto);
  create(parent.configProto, child.configProto);
  create(parent.types, child.types);
  parent.defaultArguments && create(parent.defaultArguments, child.defaultArguments);
  reflect.emitAndSave('Extension', { child, parent });
  child.super = parent;
});
defAll(nice, {
  type: t => {
    nice.isString(t) && (t = nice[t]);
    expect(nice.Anything.isPrototypeOf(t) || nice.Anything === t,
      '' + t + ' is not a type').toBe();
    return t;
  },
  Type: (config = {}, by) => {
    if(nice.isString(config)){
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
    const {$1,$2,$3,$4,$$} = nice;
    const type = (...a) => {
      for(let v of a){
        if(v === $1 || v === $2 || v === $3 || v === $4 || v === $$)
          return nice.skip(type, a);
      }
      const item = nice._newItem(type);
      type.onCreate && type.onCreate(item);
      type.initChildren(item);
      type.initBy
        ? type.initBy(item, ...a)
        : (a.length && item(...a));
      return item;
    };
    config.proto._type = type;
    Object.defineProperty(type, 'name', { writable: true });
    Object.assign(type, config);
    nice.extend(type, config.hasOwnProperty('extends') ? nice.type(config.extends) : nice.Obj);
    const cfg = create(config.configProto, nice.Configurator(type, ''));
    config.name && nice.registerType(type);
    return cfg;
  },
});
nice.Check('isType', v => nice.Anything.isPrototypeOf(v));
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
(function(){"use strict";function s(name, parent, description, ){
  const value = Object.freeze({ _type: name });
  nice.Type({
    name,
    extends: parent,
    onCreate: z => z._value = value,
    description,
    proto: {
    }
  })();
}
s('Nothing', 'Anything', 'Parent type for all falsy values.');
s('Undefined', 'Nothing', 'Wrapper for JS undefined.');
s('Null', 'Nothing', 'Wrapper for JS null.');
s('Fail', 'Nothing', 'Empty negative signal.');
s('NeedComputing', 'Nothing', 'State of the Box in case it need some computing.');
s('Pending', 'Nothing', 'State of the Box when it awaits input.');
s('Stop', 'Nothing', 'Value used to stop iterationin .each() and similar functions.');
s('NumberError', 'Nothing', 'Wrapper for JS NaN.');
s('Something', 'Anything', 'Parent type for all non falsy values.');
s('Ok', 'Something', 'Empty positive signal.');
defGet(nice.Nothing.proto, function jsValue() {
  return {[nice.TYPE_KEY]: this._type.name};
});
defGet(nice.Null.proto, function jsValue() {
  return null;
});
defGet(nice.Undefined.proto, function jsValue() {
  return undefined;
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
  creator: () => { throw 'Use Single or Object.' },
  proto: create(nice.Anything.proto, {
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
(function(){"use strict";nice.Type({
  name: 'Obj',
  extends: nice.Value,
  onCreate: z => z._items = {},
  itemArgs0: z => z._items,
  itemArgs1: (z, o) => {
    const t = typeof o;
    if( t !== 'object' )
      throw z._type.name + ` doesn't know what to do with ` + t;
    _each(o, (v, k) => z.set(k, v));
  },
  itemArgsN: (z, os) => _each(os, o => z(o)),
  fromValue (v) {
    const res = this();
    Object.assign(res._items, nice._map(v, nice.fromJson));
    return res;
  },
  deserialize (js) {
    const res = this();
    _each(js, (v, k) => res._items[k] = nice.deserialize(v));
    return res;
  },
  initChildren (item){
    _each(this.defaultArguments, (as, k) => {
      item._items[k] = this.types[k](...as);
    });
  },
  proto: {
    checkKey (i) {
      if(i._isAnything === true)
        i = i();
      return i;
    },
    setDefault (i, f, ...tale) {
      const z = this;
      if(i._isAnything === true)
        i = i();
      if(!z._items.hasOwnProperty(i))
        z.set(i, f(), ...tale);
      return z;
    },
    _itemsListener (o) {
      const { onRemove, onAdd, onChange } = o;
      return (v, old) => {
        if(old === undefined){
          onAdd && v.each(onAdd);
          onChange && v.each((_v, k) => onChange(k, _v));
        } else {
          _each(old, (c, k) => {
            onRemove && c !== undefined && onRemove(c, k);
            onAdd && v._items.hasOwnProperty(k) && onAdd(v._items[k], k);
            onChange && onChange(k, v._items[k], c);
          });
        }
      };
    }
  }
})
  .about('Parent type for all composite types.')
  .ReadOnly(function values(z){
    let a = nice.Arr();
    z.each(v => a.push(v));
    return a;
  })
  .ReadOnly(function jsValue(z){
    const o = Array.isArray(z._items) ? [] : {};
    _each(z._items, (v, k) => o[k] = (v && v._isAnything) ? v.jsValue : v);
    Switch(z._type.name).isString.use(s =>
      ['Arr', 'Obj'].includes(s) || (o[nice.TYPE_KEY] = s));
    return o;
  })
  .addProperty('size', { get () {
    return Object.keys(this._items).reduce(n => n + 1, 0);
  }})
  .Action(function itemsType(z, t){
    z._itemsType = t;
  });
const F = Func.Obj, M = Mapping.Obj, A = Action.Obj, C = Check.Obj;
Func.Nothing('each', () => 0);
C('has', (o, k) => o._items.hasOwnProperty(k));
F(function each(o, f){
  for(let k in o._items)
    if(nice.isStop(f(o._items[k], k)))
      break;
  return o;
});
F('reverseEach', (o, f) => {
  Object.keys(o._items).reverse().forEach(k => f(o._items[k], k));
});
Mapping.Object('get', (o, path) => {
  if(path.pop){
    let k = 0;
    while(k < path.length) {
      o = o[path[k++]];
      if(!o)
        return o;
    }
    return o;
  } else {
    return o[''+path];
  }
});
M('get', (z, i) => {
  if(i._isAnything === true)
    i = i();
  if(z._items.hasOwnProperty(i)){
    return z._items[i];
  }
  const type = z._type.types[i];
  return type
    ? z._items[i] = type()
    : undefined;
});
M('getDefault', (z, i, v) => {
  if(i._isAnything === true)
    i = i();
  return z._items.hasOwnProperty(i) ? z._items[i] : z._items[i] = v;
});
Action.Object('set', (o, i, v) => o[''+i] = v);
A('set', (z, i, v, ...tale) => {
  i = z.checkKey(i);
  z.transactionStart();
  let res;
  if(!is(v, z._items[i])){
    z._oldValue = z._oldValue || {};
    z._oldValue[i] = z._items[i];
  }
  const type = z._itemsType || (z._type.types && z._type.types[i]);
  if(type){
    if(v && v._isAnything){
      if(!v._type.isSubType(type))
        throw `Expected item type is ${type.name} but ${v._type.name} is given.`;
      res = v;
    } else {
      res = type(v, ...tale);
    }
  } else {
    res = v;
  }
  z._items[i] = res;
  z._newValue = z._newValue || {};
  z._newValue[i] = res;
  z.transactionEnd();
  return z;
});
A('assign', (z, o) => _each(o, (v, k) => z.set(k, v)));
A('replaceAll', (z, o) => {
  
  z._oldValue = z._items;
  z._items = o._items;
});
A.test((remove, Obj) => {
  expect( remove(Obj({ q:1, a:2 }), 'q').jsValue )
      .deepEqual({ a:2 });
})
.about('Remove element at `i`.')
('remove', (z, i) => {
  z._oldValue = z._oldValue || {};
  z._oldValue[i] = z._items[i];
  delete z._items[i];
});
A('removeValue', (o, v) => {
  for(let i in o._items)
    is(v, o._items[i]) && o.remove(i);
});
Action.Object('removeValue', (o, v) => {
  for(let i in o)
    if(is(v, o[i]))
      delete o[i];
});
A('removeAll', z => {
  z._oldValue = z._items;
  z._type.onCreate(z);
});
reflect.on('Type', function defineReducer(type) {
  const name = type.name;
  if(!name)
    return;
  nice.collectionReducers[name] = function(f, init){
    return this.collection.reduceTo(nice[name](), f, init);
  };
});
M(function reduce(o, f, res){
  for(let k in o._items)
    res = f(res, o._items[k], k);
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
M(function map(c, f){
  const res = c._type();
  const o = c._items;
  for(let i in o)
    res.set(i, f(o[i], i));
  return res;
});
M('rMap', (c, f) => c._type().apply(res => c.listen({
  onAdd: (v, k) => res.set(k, f(v, k)),
  onRemove: (v, k) => res.remove(k)
})));
M('filter', (c, f) => c.reduceTo(c._type(), (z, v, k) => f(v,k) && z.set(k, v)));
M('rFilter', (c, f) => c._type().apply(z => c.listen({
  onAdd: (v, k) => f(v, k) && z.set(k, v),
  onRemove: (v, k) => z.remove(k)
})));
M('sum', (c, f) => c.reduce((n, v) => n + (f ? f(v) : v), 0));
C.Function(function some(c, f){
  for(let i in c._items)
    if(f(c._items[i], i))
      return true;
  return false;
});
C(function every(c, f){
  for(let i in c._items)
    if(!f(c._items[i], i))
      return false;
  return true;
});
M(function find(c, f){
  for(let i in c._items)
    if(f(c._items[i], i))
      return c._items[i];
});
M(function findKey(c, f){
  nice.isFunction(f) || (f = is(f, nice));
  for(let i in c._items)
    if(f(c._items[i], i))
      return i;
});
M.Function(function count(o, f) {
  let n = 0;
  o.each((v, k) => f(v, k) && n++);
  return nice.Num(n);
});
C('includes', (o, t) => {
  for(let i in o._items)
    if(o._items[i] === t)
      return true;
  return false;
});
M('getProperties',  z => apply([], res => {
  for(let i in z) z[i]._isProperty && res.push(z[i]);
}));
M('reduceTo', (o, res, f) => {
  o.each((v, k) => f(res, v, k));
  return res;
});
reflect.on('Type', type => {
  const smallName = nice._decapitalize(type.name);
  function createProperty(z, name, ...as){
    const targetType = z.target;
    if(name[0] !== name[0].toLowerCase())
      throw "Property name should start with lowercase letter. "
            + `"${nice._decapitalize(name)}" not "${name}"`;
    targetType.types[name] = type;
    as.length && (targetType.defaultArguments[name] = as);
    defGet(targetType.proto, name, function(){
      const res = this.get(name);
      return res;
    });
    reflect.emitAndSave('Property', { type, name, targetType });
  }
  def(nice.Obj.configProto, smallName, function (name, ...as) {
    createProperty(this, name, ...as);
    return this;
  });
});
})();
(function(){"use strict";const PENDING = nice.Pending(), NEED_COMPUTING = nice.NeedComputing();
nice.Type({
  name: 'Box',
  extends: 'Something',
  onCreate: z => {
    z._value = PENDING;
    z._isReactive = false;
  },
  itemArgs1: (z, v) => z._setValue(v),
  initBy: (z, ...a) => a.length && z(...a),
  async (f){
    const b = Box();
    b._asyncBy = f;
    b._value = NEED_COMPUTING;
    return b;
  },
  proto: {
    interval (f, t = 200) {
      setInterval(() => this.setState(f(this._value)), t);
      return this;
    },
    timeout (f, t = 200) {
      setTimeout(() => f(this), t);
      return this;
    },
    setState (v){
      if(v === undefined)
        throw `Can't set result of the box to undefined.`;
      if(v === this)
        throw `Can't set result of the box to box itself.`;
      while(v && v._up_)
        v = v._up_;
      if(this._value !== v) {
        this.transactionStart();
        this.hasOwnProperty('_oldValue') || (this._oldValue = this._value);
        this._value = v;
        this.transactionEnd();
      }
      return this._value;
    },
    _notificationValue () {
      let res = this._value;
      return res && res._notificationValue ? res._notificationValue() : res;
    },
    _isHot (){
      return this._transactionDepth
        || (this._subscribers && this._subscribers.size);
    },
    _isResolved (){
      return !nice.isPending(this._value) && !nice.isNeedComputing(this._value);
    },
    lock (){
      this._locked = true;
      return this;
    },
    unlock (){
      this._locked = false;
      return this;
    },
    error (e) {
      return this.setState(nice.isErr(e) ? e : nice.Err(e));
    },
    getPromise () {
      return new Promise((resolve, reject) => {
        this.listenOnce(v => (nice.isErr(v) ? reject : resolve)(v));
      });
    },
        follow (s){
      if(s.__proto__ === Promise.prototype) {
        this.doCompute = () => {
          this.transactionStart();
          s.then(v => {
            this(v);
            this.transactionEnd();
            delete this.doCompute;
          }, e => this.error(e));
        };
      } else {
        expect(s !== this, `Box can't follow itself`).toBe();
        this._subscriptions = [s];
        this._isReactive = true;
      }
      this._value = NEED_COMPUTING;
      this._isHot() && this.compute();
      return this;
    },
    doCompute (){
      this.transactionStart();
      this.hasOwnProperty('_oldValue') || (this._oldValue = this._value);
      this._value = PENDING;
      let _value;
      const ss = this._subscriptions || [];
      ss.forEach(s => {
        s._subscribers = s._subscribers || new Map();
        if(!s._subscribers.has(this)){
          s._isResolved() || s.compute();
          s._subscribers.set(this, () => this._notifing || this.doCompute());
        }
      });
      const _results = ss.map(s =>
          s._notificationValue ? s._notificationValue() : s);
      if(ss.some(s => !s._isResolved())){
        _value = PENDING;
      } else if(_results.find(nice.isErr)){
        _value = nice.Err(`Dependency error`);
      }
      try {
        if(_value){
          this._simpleSetState(_value);
        } else if(this._by){
          this._simpleSetState(this._by(..._results));
        } else if(this._asyncBy){
          
          this._isReactive = false;
          this._asyncBy(this, ..._results);
          return;
        } else {
          this._simpleSetState(_results[0]);
        }
      } catch (e) {
        console.log('ups', e);
        this.error(e);
        return;
      } finally {
        return this.transactionEnd();
      }
      return this._value;
    },
    compute () {
      return !nice.isNeedComputing(this._value) || this._transactionDepth
        ? this._value : this.doCompute();
    },
    _simpleSetState (v){
      if(v === undefined)
        throw `Can't set result of the box to undefined.`;
      if(v === this)
        throw `Can't set result of the box to box itself.`;
      while(v && v._up_)
        v = v._up_;
      this._value = v;
    }
  }
})
  .ReadOnly('jsValue', ({_value}) => _value._isAnything ? _value.jsValue : _value)
  .about('Observable component.');
Box = nice.Box;
def(nice, 'resolveChildren', (v, f) => {
  if(!v)
    return f(v);
  if(nice.isBox(v))
    return v.listenOnce(_v => nice.resolveChildren(_v, f));
  if(nice.isObj(v)){
    let count = v.size;
    const next = () => {
      count--;
      count === 0 && f(v);
    };
    !count ? f(v) : _each(v._items, (vv, kk) => {
      nice.resolveChildren(vv, _v => {
        next();
      });
    });
  } else {
    f(v);
  }
});
})();
(function(){"use strict";const PENDING = nice.Pending(), NEED_COMPUTING = nice.NeedComputing();
nice.Type({
  name: 'RBox',
  extends: 'Box',
  itemArgs1: () => {
    throw `This box uses subscriptions you can't change it's value.`;
  },
  initBy: (z, ...inputs) => {
    z._by = inputs.pop();
    z._subscriptions = [];
    z._value = NEED_COMPUTING;
    z._isReactive = true;
    inputs.forEach(s => {
      if(s.__proto__ === Promise.prototype)
        s = Box().follow(s);
      expect(s.listen, `Bad source`).toBe();
      z._subscriptions.push(s);
    });
    return z;
  },
  proto: {}
})
  .about('Reactive observable component.');
})();
(function(){"use strict";nice.Type({
  name: 'Err',
  extends: 'Nothing',
  initBy: (z, message) => {
    z.message = message;
    const a = new Error().stack.split('\n');
    a.splice(0, 4);
    z.trace = a.join('\n');
  },
  creator: () => ({}),
  proto: {
    valueOf () { return new Err(this.message); },
    toString () { return `Error: ${this.message}`; }
  }
}).about('Represents error.');
})();
(function(){"use strict";nice.Type({
  name: 'Single',
  extends: nice.Value,
  proto: {}
}).about('Parent type for all single value types.');
reflect.on('Type', type => {
  def(nice.Single.configProto, type.name, () => {
    throw "Can't add properties to SingleValue types";
  });
});
})();
(function(){"use strict";
nice.Obj.extend({
  name: 'Arr',
  onCreate: z => z._items = [],
  itemArgs0: z => z._items,
  itemArgs1: (z, v) => z.set(z._items.length, v),
  itemArgsN: (z, vs) => vs.forEach( v => z.set(z._items.length, v)),
  proto: {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
    pop () {
      const i = this._items.length - 1;
      let e;
      if(i >= 0){
        e = this._items[i];
        this.removeAt(i);
      }
      return e;
    },
    shift () {
      return this._items.shift();
    },
    checkKey (i) {
      if(i._isAnything === true)
        i = i();
      if(typeof i !== 'number')
        throw 'Arr only likes number keys.';
      return i;
    },
    _itemsListener (o) {
      const { onRemove, onAdd, onChange } = o;
      return (v, old) => {
        if(old === undefined){
          onAdd && v.each(onAdd);
          onChange && v.each((_v, k) => onChange(k, _v));
        } else {
          const l = Math.max(...Object.keys(old || {}), ...Object.keys(v._newValue || {}));
          let i = 0;
          
          while(i <= l){
            if (onRemove) {
              old.hasOwnProperty(i) && onRemove(old[i], i);
            }
            if(onAdd) {
              if(v._newValue && v._newValue.hasOwnProperty(i)){
                onAdd(v._newValue[i], i);
              }
            }
            i++;
          }
        }
      };
    }
  }
}).about('Ordered list of elements.')
  .ReadOnly('size', z => {
    return z._items.length;
  })
  .Action(function push(z, ...a) {
    a.forEach(v => z.insertAt(z._items.length, v));
  });
const Arr = nice.Arr;
const F = Func.Arr, M = Mapping.Arr, A = Action.Arr;
M.Function('reduce', (a, f, res) => {
  each(a, (v, k) => res = f(res, v, k));
  return res;
});
M.Function('reduceRight', (a, f, res) => {
  a.eachRight((v, k) => res = f(res, v, k));
  return res;
});
M.Array('concat', (a, ...bs) => a._items.concat(...bs));
M('sum', (a, f) => a.reduce(f ? (sum, n) => sum + f(n) : (sum, n) => sum + n, 0));
A('unshift', (z, ...a) => a.reverse().forEach(v => z.insertAt(0, v)));
A('add', (z, ...a) => {
  a.forEach(v => z.includes(v) || z.push(v));
});
Check.Arr('includes', (a, v) => {
  for(let i of a._items)
    if(is(i, v))
      return true;
  return false;
});
A('pull', (z, item) => {
  const k = is.Value(item)
    ? z.items.indexOf(item)
    : z.findKey(v => item === v());
  (k === -1 || k === undefined) || z.removeAt(k);
});
A.Number('insertAt', (z, i, v) => {
  i = +i;
  const old = z._items;
  z._oldValue = z._oldValue || {};
  z._newValue = z._newValue || {};
  z._newValue[i] = v;
  z._items = [];
  _each(old, (_v, k) => {
    +k === i && z._items.push(v);
    z._items.push(_v);
  });
  if(old.length <= i)
    return z._items[i] = v;
});
A('insertAfter', (z, target, v) => {
  let i;
  for(i in z._items)
    if(is(target, z._items[i]))
      break;
  return z.insertAt(+i+1, v);
});
A('removeAt', (z, i) => {
  i = +i;
  const old = z._items;
  z._oldValue = z._oldValue || {};
  z._oldValue[i] = old[i];
  z._items = [];
  _each(old, (v, k) => +k === i || z._items.push(v));
});
F('callEach', (z, ...a) => {
  z().forEach( f => f.apply(z, ...a) );
  return z;
});
A.test((removeValue, Arr) => {
    expect(removeValue(Arr(1,2,3), 2).jsValue).deepEqual([1,3]);
  })
  .about('Remove all values equal to `v` from `a`.')('removeValue', (a, v) => {
  for(let i in a._items)
    is(v, a._items[i]) && a.removeAt(i);
});
Action.Array
  .test(removeValue => {
    expect(removeValue([1,2,3], 2)).deepEqual([1,3]);
  })
  .about('Remove all values equal to `v` from `a`.')
  ('removeValue', (a, v) => {
    nice.eachRight(a, (_v, k) => is(_v, v) && a.splice(k,1));
  });
'splice'.split(',').forEach(name => {
 A(name, (a, ...bs) => a._items[name](...bs));
});
function each(z, f){
  const a = z._items;
  const l = a.length;
  for (let i = 0; i < l; i++)
    if(nice.isStop(f(z._items[i], i)))
      break;
  return z;
}
F.Function(each);
F.Function('forEach', each);
Func.Array.Function(function eachRight(a, f){
  let i = a.length;
  while (i-- > 0)
    if(nice.isStop(f(a[i], i)))
      break;
  return a;
});
A(function fill(z, v, start = 0, end){
  const l = z._items.length;
  end === undefined && (end = l);
  start < 0 && (start += l);
  end < 0 && (end += l);
  for(let i = start; i < end; i++){
    z.set(i, v);
  }
});
M.Function(function map(a, f){
  return a.reduceTo(Arr(), (z, v, k) => z.push(f(v, k)));
});
Mapping.Array.Function(function map(a, f){
  return a.reduce((z, v, k) => { z.push(f(v, k)); return z; }, []);
});
M(function rMap(a, f){
  const res = a._type();
  a.listen({
    onAdd: (v, k) => res.insertAt(k, f(v, k)),
    onRemove: (v, k) => res.removeAt(k)
  });
  return res;
});
M.Function(function filter(a, f){
  return a.reduceTo(Arr(), (res, v, k) => f(v, k, a) && res.push(v));
});
M(function random(a){
  return a._items[Math.random() * a.size | 0];
});
M(function sortBy(a, f){
  f = nice.mapper(f);
  const res = Arr();
  const source = a._items;
  source
    .map((v, k) => [k, f(v)])
    .sort((a, b) => +(a[1] > b[1]) || +(a[1] === b[1]) - 1)
    .forEach(v => res.push(source[v[0]]));
  return res;
});
M('sortedIndex', (a, v, f = (a, b) => a - b) => {
  let i = a.size;
  a.each((vv, k) => {
    if(f(v, vv) <= 0){
      i = k;
      return nice.Stop();
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
M('rFilter', (a, f) => a._type().apply(res => {
  const mapping = [];
  a.listen({
    onAdd: (v, k) => {
      if(!f(v, k))
        return;
      let pos;
      for(let i = 0; i++; i < mapping.length){
        if(mapping[i] >= i)
          pos = i;
      }
      pos = pos || mapping.length;
      res.insertAt(pos, v);
      mapping[pos] = k;
    },
    onRemove: (v, k) => {
      res.removeAt(k);
      const i = mapping.indexOf(k);
      expect(i !== -1).isTrue();
      mapping.splice(i, 1);
    }
  });
}));
M.about('Creates new array with aboutseparator between elments.')
(function intersperse(a, separator) {
  const res = Arr();
  const last = a.size - 1;
  a.each((v, k) => res.push(v) && (k < last && res.push(separator)));
  return res;
});
M.about('Returns last element of `a`.')
  .test((last, Arr) => {
    expect(Arr(1,2,4).last()).is(4);
  })
(function last(a) {
  return a._items[a._items.length - 1];
});
typeof Symbol === 'function' && F(Symbol.iterator, z => {
  let i = 0;
  const l = z._items.length;
  return { next: () => ({ value: z._items[i], done: ++i > l }) };
});
})();
(function(){"use strict";nice.Single.extend({
  name: 'Num',
  onCreate: z => z._value = 0,
  itemArgs1: (z, n) => {
    const res = +n;
    if(Number.isNaN(res))
      throw `Can't create Num from ${typeof n}`;
    z._setValue(+n);
  },
}).about('Wrapper for JS number.');
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
}, (f, name) => Check.Single.Single(name, f));
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
M.test(clamp => {
  expect(clamp(0, 1, 3)).is(1);
  expect(clamp(2, 1, 3)).is(2);
  expect(clamp(10, 1, 3)).is(3);
})
('clamp', (n, min, max) => {
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
M.test(times => {
  expect(times(2, () => 1)).deepEqual([1,1]);
})
.Function('times', (n, f) => {
  let i = 0;
  const res = [];
  while(i < n) res.push(f(i++));
  return res;
});
const A = Action.Num;
A('inc', (z, n = 1) => z(z() + n));
A('dec', (z, n = 1) => z(z() - n));
A('divide', (z, n) => z(z() / n));
A('multiply', (z, n) => z(z() * n));
A('negate', z => z(-z()));
A('setMax', (z, n) => n > z() && z(n));
A('setMin', (z, n) => n < z() && z(n));
})();
(function(){"use strict";const whiteSpaces = ' \f\n\r\t\v\u00A0\u2028\u2029';
const allowedSources = {boolean: 1, number: 1, string: 1};
nice.Single.extend({
  name: 'Str',
  onCreate: z => z._value = '',
  itemArgs1: (z, s) => {
    if(s && s._isAnything)
       s = s();
    if(!allowedSources[typeof s])
      throw `Can't create Str from ${typeof s}`;
    z._setValue('' + s);
  },
  itemArgsN: (z, a) => z._setValue(nice.format(...a)),
})
  .about('Wrapper for JS string.')
  .ReadOnly('length', z => z._value.length);
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
typeof Symbol === 'function' && Func.String(Symbol.iterator, z => {
  let i = 0;
  const l = z.length;
  return { next: () => ({ value: z[i], done: ++i > l }) };
});
})();
(function(){"use strict";nice.Single.extend({
  name: 'Pointer',
  initBy: (z, o, key) => {
    expect(o).isObj();
    z._object = o;
    z(key === undefined ? null : key);
  },
  itemArgs0: z => {
    return z._value !== null && z._object.has(z._value)
      ? z._object.get(z._value)
      : nice.Null();
  },
  itemArgs1: (z, k) => {
    if(k === null || nice.isNull(k))
      return z._setValue(null);
    if(nice.isStr(k))
      k = k();
    if(z._object.has(k)) {
      return z._setValue(k);
    } else {
      k = nice.findKey(z._object, v => is(k, v));
      if(k)
        return z._setValue(k);
    }
    throw `Key ${k} not found.`;
  },
  proto: {
    _notificationValue(){
      return this();
    },
  }
}).about('Holds key of an object or array.');
})();
(function(){"use strict";nice.Single.extend({
  name: 'Bool',
  onCreate: z => z._value = false,
  itemArgs1: (z, v) => z._setValue(!!v),
}).about('Wrapper for JS boolean.');
const B = nice.Bool, M = Mapping.Bool;
const A = Action.Bool;
A('turnOn', z => z(true));
A('turnOff', z => z(false));
A('toggle', z => z(!z()));
nice.Single.extensible = false;
})();
(function(){"use strict";nice.Type('Range')
  .about('Represent range of numbers.')
  .num('start', 0)
  .num('end', Infinity)
  .by((z, a, b) => b === undefined ? z.end(a) : z.start(a).end(b))
  .Method(function each(z, f){
    let i = z.start();
    let end = z.end();
    let n = 0;
    while(i <= end) f(i++, n++);
  })
  .Mapping(function map(z, f){
    let i = z.start();
    let n = 0;
    const a = nice.Arr();
    while(i <= z.end()) a(f(i++, n++));
    return a;
  })
  .Mapping(function filter(z, f){
    let i = z.start();
    let n = 0;
    const a = nice.Arr();
    while(i <= z.end()) {
      f(i, n) && a(n);
      i++;
      n++;
    }
    return a;
  })
  .Mapping(function toArray(z){
    const a = [];
    const end = z.end();
    let i = z.start();
    while(i <= end) a.push(i++);
    return a;
  })
  .Check(function includes(z, n){
    return n >= z.start && n <= z.end;
  });
Func.Num.Range(function within(v, r){
  return v >= r.start && v <= r.end;
});
})();
(function(){"use strict";
let autoId = 0;
const AUTO_PREFIX = '_nn_'
nice.Type('Html', (z, tag) => tag && z.tag(tag))
  .about('Represents HTML element.')
  .str('tag', 'div')
  .obj('eventHandlers')
  .obj('cssSelectors')
  .Action.about('Adds event handler to an element.')(function on(e, name, f){
    if(name === 'domNode' && nice.isEnvBrowser()){
      if(!e.id())
        throw `Give element an id to use domNode event.`;
      const el = document.getElementById(e.id());
      el && f(el);
    }
    const handlers = e.eventHandlers.get(name);
    handlers ? handlers.push(f) : e.eventHandlers.set(name, [f]);
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
  .Method('_autoId', z => {
    z.id() || z.id(AUTO_PREFIX + autoId++);
    return z.id();
  })
  .Method('_autoClass', z => {
    const s = z.attributes.get('className') || '';
    if(s.indexOf(AUTO_PREFIX) < 0){
      const c = AUTO_PREFIX + autoId++;
      z.attributes.set('className', s + ' ' + c);
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
      if(nice.isArray(c))
        return _each(c, _c => z.add(_c));
      if(nice.isArr(c))
        return c.each(_c => z.add(_c));
      if(c === undefined || c === null)
        return;
      if(typeof c === 'string' || nice.isStr(c))
        return z.children(c);
      if(nice.isNumber(c) || nice.isNum(c))
        return z.children(c);
      if(c === z)
        return z.children(`Errro: Can't add element to itself.`);
      if(!c || !nice.isAnything(c))
        return z.children('Bad child: ' + c);
      c.up = z;
      c._up_ = z;
      z.children.push(c);
    });
  });
const Html = nice.Html;
nice.Type('Style')
  .about('Represents CSS style.');
const Style = nice.Style;
defGet(Html.proto, function hover(){
  const style = Style();
  this._autoClass();
  this.cssSelectors.set(':hover', style);
  return style;
});
def(Html.proto, 'Css', function(s = ''){
  s = s.toLowerCase();
  const existing = this.cssSelectors.get(s);
  if(existing !== undefined)
    return existing;
  this._autoClass();
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
  Html.proto[_t] || def(Html.proto, _t, function (...a){
    return this.add(type(...a));
  });
}
reflect.on('Extension', ({child, parent}) => {
  if(parent === Html || Html.isPrototypeOf(parent)){
    addCreator(child);
  }
});
addCreator(nice.RBox);
Html.proto.Box = function(...a) {
  const res = Box(...a);
  res.up = this;
  this.add(res);
  return res;
};
'clear,alignContent,alignItems,alignSelf,alignmentBaseline,all,animation,animationDelay,animationDirection,animationDuration,animationFillMode,animationIterationCount,animationName,animationPlayState,animationTimingFunction,backfaceVisibility,background,backgroundAttachment,backgroundBlendMode,backgroundClip,backgroundColor,backgroundImage,backgroundOrigin,backgroundPosition,backgroundPositionX,backgroundPositionY,backgroundRepeat,backgroundRepeatX,backgroundRepeatY,backgroundSize,baselineShift,border,borderBottom,borderBottomColor,borderBottomLeftRadius,borderBottomRightRadius,borderBottomStyle,borderBottomWidth,borderCollapse,borderColor,borderImage,borderImageOutset,borderImageRepeat,borderImageSlice,borderImageSource,borderImageWidth,borderLeft,borderLeftColor,borderLeftStyle,borderLeftWidth,borderRadius,borderRight,borderRightColor,borderRightStyle,borderRightWidth,borderSpacing,borderStyle,borderTop,borderTopColor,borderTopLeftRadius,borderTopRightRadius,borderTopStyle,borderTopWidth,borderWidth,bottom,boxShadow,boxSizing,breakAfter,breakBefore,breakInside,bufferedRendering,captionSide,clip,clipPath,clipRule,color,colorInterpolation,colorInterpolationFilters,colorRendering,columnCount,columnFill,columnGap,columnRule,columnRuleColor,columnRuleStyle,columnRuleWidth,columnSpan,columnWidth,columns,content,counterIncrement,counterReset,cursor,cx,cy,direction,display,dominantBaseline,emptyCells,fill,fillOpacity,fillRule,filter,flex,flexBasis,flexDirection,flexFlow,flexGrow,flexShrink,flexWrap,float,floodColor,floodOpacity,font,fontFamily,fontFeatureSettings,fontKerning,fontSize,fontStretch,fontStyle,fontVariant,fontVariantLigatures,fontWeight,height,imageRendering,isolation,justifyContent,left,letterSpacing,lightingColor,lineHeight,listStyle,listStyleImage,listStylePosition,listStyleType,margin,marginBottom,marginLeft,marginRight,marginTop,marker,markerEnd,markerMid,markerStart,mask,maskType,maxHeight,maxWidth,maxZoom,minHeight,minWidth,minZoom,mixBlendMode,motion,motionOffset,motionPath,motionRotation,objectFit,objectPosition,opacity,order,orientation,orphans,outline,outlineColor,outlineOffset,outlineStyle,outlineWidth,overflow,overflowWrap,overflowX,overflowY,padding,paddingBottom,paddingLeft,paddingRight,paddingTop,page,pageBreakAfter,pageBreakBefore,pageBreakInside,paintOrder,perspective,perspectiveOrigin,pointerEvents,position,quotes,r,resize,right,rx,ry,shapeImageThreshold,shapeMargin,shapeOutside,shapeRendering,speak,stopColor,stopOpacity,stroke,strokeDasharray,strokeDashoffset,strokeLinecap,strokeLinejoin,strokeMiterlimit,strokeOpacity,strokeWidth,tabSize,tableLayout,textAlign,textAlignLast,textAnchor,textCombineUpright,textDecoration,textIndent,textOrientation,textOverflow,textRendering,textShadow,textTransform,top,touchAction,transform,transformOrigin,transformStyle,transition,transitionDelay,transitionDuration,transitionProperty,transitionTimingFunction,unicodeBidi,unicodeRange,userZoom,vectorEffect,verticalAlign,visibility,whiteSpace,widows,width,willChange,wordBreak,wordSpacing,wordWrap,writingMode,x,y,zIndex,zoom'
  .split(',').forEach( property => {
    def(Html.proto, property, function(...a) {
      const s = this.style;
      nice.Switch(a[0])
        .isBox.use(b => s.set(property, b))
        .isObject.use(o => _each(o, (v, k) => s.set(property + nice.capitalize(k), v)))
        .default.use((...a) => s.set(property, a.length > 1 ? nice.format(...a) : a[0]))
      return this;
    });
    def(Style.proto, property, function(...a) {
      nice.isObject(a[0])
        ? _each(a[0], (v, k) => this.set(property + nice.capitalize(k), v))
        : this.set(property, a.length > 1 ? nice.format(...a) : a[0]);
      return this;
    });
  });
'checked,accept,accesskey,action,align,alt,async,autocomplete,autofocus,autoplay,autosave,bgcolor,buffered,challenge,charset,cite,code,codebase,cols,colspan,contentEditable,contextmenu,controls,coords,crossorigin,data,datetime,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,for,form,formaction,headers,hidden,high,href,hreflang,icon,id,integrity,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,manifest,max,maxlength,media,method,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,seamless,selected,shape,sizes,slot,spellcheck,src,srcdoc,srclang,srcset,start,step,summary,tabindex,target,title,type,usemap,wrap'
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
function text(z){
  return z.children
      .map(v => v.text
        ? v.text
        : nice.htmlEscape(nice.isFunction(v) ? v() : v))
      .jsValue.join('');
};
function compileStyle (s){
  let a = [];
  for(let k in s._items)
    a.push(k.replace(/([A-Z])/g, "-$1").toLowerCase() + ':' + s._items[k]);
  return a.join(';');
};
function compileSelectors (h){
  const a = [];
  h.cssSelectors.each((v, k) => a.push('.', getAutoClass(h.attributes.get('className')),
    ' ', k, '{', compileStyle(v), '}'));
  return a.length ? '<style>' + a.join('') + '</style>' : '';
};
const _html = v => v._isAnything ? v.html : nice.htmlEscape(v);
nice.ReadOnly.Box('html', ({_value}) => _value && _html(_value));
nice.ReadOnly.Single('html', z => _html(z._value));
nice.ReadOnly.Arr('html', z => z._items.map(_html).join(''));
function html(z){
  const tag = z.tag();
  const selectors = compileSelectors(z) || '';
  let as = '';
  let style = compileStyle(z.style);
  style && (as = ' style="' + style + '"');
  z.attributes.each((v, k) => {
    k === 'className' && (k = 'class', v = v.trim());
    as += ` ${k}="${v}"`;
  });
  let body = '';
  for(let c of z.children._items)
    body += c._isAnything ? c.html : nice.htmlEscape(c);
  return `${selectors}<${tag}${as}>${body}</${tag}>`;
};
defAll(nice, {
  htmlEscape: s => (''+s).replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
});
const getAutoClass = s => s.match(/(_nn_\d+)/)[0];
if(nice.isEnvBrowser()){
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);
  const styleSheet = styleEl.sheet;
  const addRules = (vs, selector, className) => {
    const rule = assertRule(selector, className);
    vs.each((value, prop) => rule.style[prop] = value);
  };
  const findRule = (selector, className) => {
    const s = `.${className} ${selector}`.toLowerCase();
    let rule;
    for (const r of styleSheet.cssRules)
      r.selectorText === s && (rule = r);
    return rule;
  };
  const findRuleindex = (selector, className) => {
    const s = `.${className} ${selector}`.toLowerCase();
    let res;
    for (const i in styleSheet.cssRules)
      styleSheet.cssRules[i].selectorText === s && (res = i);
    return res;
  };
  const assertRule = (selector, className) => {
    return findRule(selector, className) || styleSheet
        .cssRules[styleSheet.insertRule(`.${className} ${selector}` + '{}')];
  };
  function killSelectors(v) {
    const c = getAutoClass(v.attributes.get('className'));
    v.cssSelectors.each((v, k) => killRules(v, k, c));
  };
  const killRules = (vs, selector, id) => {
    const rule = findRule(selector, id);
    rule && vs.each((value, prop) => rule.style[prop] = null);
  };
  const killAllRules = (v) => {
    const c = getAutoClass(v.attributes.get('className'));
    const a = [];
    [...styleSheet.cssRules].forEach((r, i) =>
        r.selectorText.indexOf(c) === 1 && a.unshift(i));
    a.forEach(i => styleSheet.deleteRule(i));
  };
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
  Func.Box('show', (e, parentNode = document.body, position) => {
    let node;
    e._shownNodes = e._shownNodes || new WeakMap();
    const f = (v, oldValue) => {
      const oldNode = node;
      node && (position = Array.prototype.indexOf.call(parentNode.childNodes, node));
      if(v !== null){
        node = nice.show(v, parentNode, position);
        e._shownNodes.set(node, f);
      } else {
        node = undefined;
      }
      if(oldNode){
        oldValue && oldValue.hide ? oldValue.hide(oldNode) : killNode(oldNode);
      }
    };
    e.listen(f);
  });
  Func.Box('hide', (e, node) => {
    e.unsubscribe(e._shownNodes.get(node));
    e._shownNodes.delete(node);
    e._value && e._value.hide && e._value.hide(node);
  });
  Func.Nothing('show', (e, parentNode = document.body, position) => {
    return insertAt(parentNode, document.createTextNode(''), position);
  });
  Func.Bool('show', (e, parentNode = document.body, position) => {
    if(e())
      throw `I don't know how to display "true"`;
    return insertAt(parentNode, document.createTextNode(''), position);
  });
  Func.Html('show', (e, parentNode = document.body, position) => {
    const node = document.createElement(e.tag());
    
    insertAt(parentNode, node, position);
    e.attachNode(node);
    return node;
  });
  Func.Html('attachNode', (e, node) => {
    e._shownNodes = e._shownNodes || new WeakMap();
    const ss = [];
    ss.push(e.children.listen({
        onRemove: (v, k) => removeNode(node.childNodes[k], v),
        onAdd: (v, k) => nice.show(v, node, k)
      }),
      e.style.listen({
        onRemove: (v, k) => delete node.style[k],
        onAdd: (v, k) => nice.isBox(v)
          ? ss.push(v.listen(_v => node.style[k] = _v))
          : node.style[k] = v
      }),
      e.attributes.listen({
        onRemove: (v, k) => delete node[k],
        onAdd: (v, k) => node[k] = v
      }),
      e.cssSelectors.listen({
        onRemove: (v, k) => killRules(v, k, getAutoClass(className)),
        onAdd: (v, k) => addRules(v, k, getAutoClass(node.className))
      }),
      e.eventHandlers.listen({
        onAdd: (hs, k) => {
          hs.forEach(f => {
            if(k === 'domNode')
              return f(node);
            node.addEventListener(k, f, true);
            node.__niceListeners = node.__niceListeners || {};
            node.__niceListeners[k] = node.__niceListeners[k] || [];
            node.__niceListeners[k].push(f);
          });
        },
        onRemove: (hs, k) => {
          console.log('TODO: Remove, ', k);
        }
      })
    );
    e._shownNodes.set(node, ss);
  });
  Func.Html('hide', (e, node) => {
    const subscriptions = e._shownNodes && e._shownNodes.get(node);
    e._shownNodes.delete(node);
    subscriptions && subscriptions.forEach(f => f());
    node && e.children.each((c, k) => nice.hide(c, node.childNodes[0]));
    killNode(node);
  });
  function removeNode(node, v){
    node.parentNode.removeChild(node);
    v && v.cssSelectors && v.cssSelectors.size && killAllRules(v);
  }
  function removeAt(parent, position){
    const c = parent.childNodes[position];
    parent.removeChild(parent.childNodes[position]);
    
  }
  function insertAt(parent, node, position){
    parent.insertBefore(node, parent.childNodes[position]);
    return node;
  }
  
  
  
};
def(nice, 'iterateNodesTree', (f, node = document.body) => {
  f(node);
  if(node.childNodes)
    for (let n of node.childNodes) {
      nice.iterateNodesTree(f, n);
    };
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
    constructors[type]
      ? constructors[type](z, a, as[0] || ((t === 'Li' || t === 'Ol') ? nice.Li(nice.$1) : (v => v)))
      : z.add(a, ...as);
  })
    .about('Represents HTML <%s> element.', l);
});
Html.extend('A').by((z, url, ...children) => {
  z.tag('a').add(...children);
  nice.isFunction(url) && !url._isAnything
    ? z.on('click', e => {url(e); e.preventDefault();}).href('#')
    : z.href(url || '#');
}).about('Represents HTML <a> element.');
Html.extend('Img').by((z, src, x, y) => {
  z.tag('img').src(src);
  x === undefined || z.width(x);
  y === undefined || z.height(y);
})
  .about('Represents HTML <img> element.');
const constructors = {
  Obj: (z, o, f) => {
    const positions = {};
    o.listen({
      onRemove: (v, k) => z.children.removeAt(positions[k]),
      onAdd: (v, k) => {
        const i = Object.keys(o()).indexOf(k);
        positions[k] = i;
        z.children.insertAt(i, f(v, k));
      }
    }, z.children);
  },
  Object: (z, o, f) => _each(o, (v, k) => z.add(f(v, k))),
  Arr: (z, a, f) => a.listen({
    onRemove: (v, k) => z.children.removeAt(k),
    onAdd: (v, k) => z.children.insertAt(k, f(v, k))
  }, z.children),
  Array: (z, a, f) => a.forEach((v, k) => z.add(f(v, k)))
};
})();
(function(){"use strict";const Html = nice.Html;
function defaultSetValue(t, v){
  t.attributes.set('value', v);
};
const changeEvents = ['change', 'keyup', 'paste', 'search', 'input'];
function attachValue(target, setValue = defaultSetValue){
  let node, mute;
  def(target, 'value', Box(""));
  if(nice.isEnvBrowser()){
    changeEvents.forEach(k => target.on(k, e => {
      mute = true;
      target.value((e.target || e.srcElement).value);
      mute = false;
      return true;
    }));
    target._autoId();
    target.on('domNode', n => node = n);
  }
  target.value.listen(v => node ? node.value = v : setValue(target, v));
  return target;
}
Html.extend('Input', (z, type) => {
    z.tag('input').attributes.set('type', type || 'text');
    attachValue(z);
  })
  .about('Represents HTML <input> element.');
const Input = nice.Input;
Input.extend('Button', (z, text, action) => {
    z.super('button').attributes({ value: text }).on('click', action);
  })
  .about('Represents HTML <input type="button"> element.');
Input.extend('Textarea', (z, value) => {
    z.tag('textarea');
    attachValue(z, (t, v) => t.children.removeAll().push(v));
    z.value(value ? '' + value : "");
  })
  .about('Represents HTML <textarea> element.');
Input.extend('Submit', (z, text, action) => {
    z.super('submit').attributes({ value: text });
    action && z.on('click', action);
  })
  .about('Represents HTML <input type="submit"> element.');
Input.extend('Checkbox', (z, status) => {
    let node;
    z.tag('input').attributes.set('type', 'checkbox');
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
      z._autoId();
      z.on('domNode', n => node = n);
    }
    value.listen(v => node ? node.checked = v : z.attributes.set('checked', v));
  })
  .about('Represents HTML <input type="checkbox"> element.');
})();;nice.version = "0.3.3";})();