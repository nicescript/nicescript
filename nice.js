;let nice;(function(){let create,Div,Func,Switch,expect,is,_each,def,defAll,defGet,Box,Action,Mapping,Check;
(function(){"use strict";nice = (...a) => {
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
  SOURCE_ERROR: 'Source error',
  LOCKED_ERROR: 'Item is closed for modification',
  curry: (f, arity = f.length) =>(...a) => a.length >= arity
      ? f(...a)
      : nice.curry((...a2) => f(...a, ...a2), arity - a.length),
  checkers: {},
  checkFunctions: {},
  collectionReducers: {},
  createItem: ({ type, assign }) => {
    type = nice.type(type);
    const item = create(type.proto, type.creator());
    'name' in type.proto && nice.eraseProperty(item, 'name');
    'length' in type.proto && nice.eraseProperty(item, 'length');
    assign && Object.assign(item, assign);
    return item;
  },
  toItem: v => {
    if(v === undefined)
      return nice.UNDEFINED;
    if(v === null)
      return nice.NULL;
    const type = nice.valueType(v);
    if(type === nice.Box || type === nice.function)
      return v;
    return nice.createItem({ type }).setResult(v);
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
    if(v._nt_)
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
    const name = type.name;
    name[0] !== name[0].toUpperCase() &&
      nice.error('Please start type name with a upper case letter');
    nice.types[name] = type;
    def(nice, name, type);
    nice.emitAndSave('Type', type);
  },
  _each: (o, f) => {
    if(o)
      for(let i in o)
        if(i !== '_nt_')
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
})();
(function(){"use strict";const formatRe = /(%([jds%]))/g;
const formatMap = { s: String, d: Number, j: JSON.stringify };
defAll(nice, {
  _map: (o, f) => {
    let res = {};
    for(let i in o)
      res[i] = f(o[i]);
    return res;
  },
  orderedStringify: o => !is.Object(o)
    ? JSON.stringify(o)
    : Array.isArray(o)
      ? '[' + o.map(v => nice.orderedStringify(v)).join(',') + ']'
      : '{' + nice.reduceTo((a, key) => {
          a.push("\"" + key + '\":' + nice.orderedStringify(o[key]));
        }, [], Object.keys(o).sort()).join(',') + '}',
  objDiggDefault: (o, ...a) => {
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
  objDiggMin: (o, ...a) => {
    const n = a.pop();
    const k = a.pop();
    a.push({});
    const tale = nice.objDiggDefault(o, ...a);
    (!tale[k] || tale[k] > n) && (tale[k] = n);
    return tale[k];
  },
  objDiggMax: (o, ...a) => {
    const n = a.pop();
    const k = a.pop();
    a.push({});
    const tale = nice.objDiggDefault(o, ...a);
    (!tale[k] || tale[k] < n) && (tale[k] = n);
    return tale[k];
  },
  objMax: (...oo) => {
    return nice.reduceTo((res, o) => {
      _each(o, (v, k) => {
        (res[k] || 0) < v && (res[k] = v);
      });
    }, {}, oo);
  },
  objByKeys: (keys, value = 1) => nice.with({}, o =>
    keys.forEach(k => o[k] = value)),
  eraseProperty: (o, k) => {
    Object.defineProperty(o, k, {writable: true}) && delete o[k];
  },
  stripFunction: f => {
    nice.eraseProperty(f, 'length');
    nice.eraseProperty(f, 'name');
    return f;
  },
  stringCutBegining: (c, s) => s.indexOf(c) === 0 ? s.substr(c.length) : s,
  seconds: () => Date.now() / 1000 | 0,
  minutes: () => Date.now() / 60000 | 0,
});
create = nice.create = (proto, o) => Object.setPrototypeOf(o || {}, proto);
nice._eachEach = (o, f) => {
  for (let i in o)
    for (let ii in o[i])
      if(f(o[i][ii], ii, i, o) === null)
        return;
};
defAll(nice, {
  format: (t, ...a) => {
    t = '' + t;
    a.unshift(t.replace(formatRe, (match, ptn, flag) =>
        flag === '%' ? '%' : formatMap[flag](a.shift())));
    return a.join(' ');
  },
  objectComparer: (o1, o2, add, del) => {
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
    if(is.nice(o)){
      res = o._type();
      res._result = nice.clone(o.getResult());
      return res;
    } else if(Array.isArray(o)) {
      res = [];
    } else if(is.Object(o)) {
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
    } else if(is.nice(o)) {
      res = nice.createItem({ type: o._type });
      res._result = nice.cloneDeep(o.getResult());
      return res;
    } else if(Array.isArray(o)) {
      res = [];
    } else if(is.Object(o)) {
      res = {};
    } else {
      return o;
    }
    for(let i in o)
      res[i] = nice.cloneDeep(o[i]);
    return res;
  },
  diff: (a, b) => {
    if(a === b)
      return false;
    let del, add;
    const ab = calculateChanges(a, b);
    (!is.Nothing(ab) && is.empty(ab)) || (add = ab);
    const ba = calculateChanges(b, a);
    (!is.Nothing(ba) && is.empty(ba)) || (del = ba);
    return (add || del) ? { del, add } : false;
  },
  memoize: f => {
    const results = {};
    return (k, ...a) => {
      if(results.hasOwnProperty(k))
        return results[k];
      return results[k] = f(k, ...a);
    };
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
});
defAll(nice, {
  super: (o, name, v) => {
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
  doc: () => {
    const res = { types: {}, functions: [] };
    nice._on('signature', s => {
      if(!s.name || s.name[0] === '_')
        return;
      const o = {};
      _each(s, (v, k) => nice.Switch(k)
        .equal('action')()
        .equal('source').use(() => o.source = v.toString())
        .equal('signature').use(() => o[k] = v.map(t => t.type.name))
        .default.use(() => o[k] = v));
      res.functions.push(o);
    });
    nice._on('Type', t => {
      if(!t.name || t.name[0] === '_')
        return;
      const o = { name: t.name, properties: [] };
      t.hasOwnProperty('description') && (o.description = t.description);
      t.extends && (o.extends = t.super.name);
      res.types[t.name] = o;
    });
    nice._on('Property', ({ type, name, targetType }) => {
      res.types[targetType.name].properties.push({ name, type: type.name });
    });
    return res;
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
  } else if(is.Object(b)) {
    return is.Object(a) ? compareObjects(a, b) : b;
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
  _on: function (name, f) {
    const a = assertListeners(this, name);
    if(!a.includes(f)){
      this.emit('newListener', name, f);
      a.push(f);
      let es = this._events;
      es && es[name] && es[name].forEach(v => f(...v));
    }
    return this;
  },
  onNew: function (name, f) {
    const a = assertListeners(this, name);
    if(!a.includes(f)){
      this.emit('newListener', name, f);
      a.push(f);
    }
    return this;
  },
  emit: function (name, ...a) {
    this.listeners(name).forEach(f => f.apply(this, a));
    return this;
  },
  emitAndSave: function (name, ...a) {
    assertEvents(this, name).push(a);
    this.listeners(name).forEach(f => f.apply(this, a));
    return this;
  },
  listeners: function (name) {
    const listeners = this._listeners;
    let a = (listeners && listeners[name]) || [];
    a.length && nice.prototypes(this).forEach(({_listeners:ls}) => {
      ls && ls !== this._listeners && ls[name]
          && ls[name].forEach(l => a.includes(l) || (a = a.concat(l)));
    });
    return a;
  },
  listenerCount: function (name){
    return this._listeners
      ? this._listeners[name]
        ? this._listeners[name].length
        : 0
      : 0;
  },
  removeListener: function (name, f) {
    if(this.hasOwnProperty('_listeners') && this._listeners[name]){
      nice._removeArrayValue(this._listeners[name], f);
      this.emit('removeListener', name, f);
    }
    return this;
  },
  removeAllListeners: function (name) {
    if(this.hasOwnProperty('_listeners')){
      const a = this._listeners[name];
      this._listeners[name] = [];
      a.forEach(f => this.emit('removeListener', name, f));
    }
    return this;
  }
};
nice.eventEmitter = o => Object.assign(o, EventEmitter);
create(EventEmitter, nice);
})();
(function(){"use strict";nice.jsTypes = { js: { name: 'js', proto: {}, jsType: true }};
const jsHierarchy = {
  js: 'primitive,Object',
  primitive: 'String,Boolean,Number,undefined,null,Symbol',
  Object: 'function,Date,RegExp,Array,Error,ArrayBuffer,DataView,Map,WeakMap,Set,WeakSet,Promise',
  Error: 'EvalError,RangeError,ReferenceError,SyntaxError,TSypeError,UriError'
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
for(let i in jsHierarchy)
  jsHierarchy[i].split(',').forEach(name => {
    const parent = nice.jsTypes[i];
    const proto = create(parent.proto);
    nice.jsTypes[name] = create(parent,
        { name,
          proto,
          jsType: true,
          niceType: jsTypesMap[name] });
  });
})();
(function(){"use strict";const configProto = {
  next: function (o) {
    let c = Configurator(this.name || o.name);
    c.signature = (this.signature || []).concat(o.signature || []);
    c.existing = o.existing || this.existing;
    c.functionType = o.functionType || this.functionType;
    c.returnValue = o.returnValue || this.returnValue;
    c.description = o.description || this.description;
    return c;
  },
  about: function(s) { return this.next({ description: s}); }
};
const skippedProto = {};
const functionProto = {
  addSignature: function (action, signature){
    if(signature && signature.length){
      const ss = this.signatures = this.signatures || new Map();
      const type = signature[0].type;
      ss.has(type) || ss.set(type, createFunctionBody({name: this.name}));
      ss.get(type).addSignature(action, signature.slice(1));
    } else {
      this.action = action;
    }
    return this;
  },
  ary: function (n){
    return (...a) => this(...a.splice(0, n));
  },
  about: function(s) {
    return configurator({ description: s });
  }
};
const parseParams = (...a) => {
  if(!a[0])
    return {};
  const [name, action] = a.length === 2 ? a : [a[0].name, a[0]];
  return typeof action === 'function' ? { name, action } : a[0];
};
function toItemType({type}){
  return { type: type.jsType ? nice[type.niceType] : type };
}
function transform(s){
  s.source = s.action;
  if(s.signature.length === 0)
    return s;
  const types = s.signature;
  s.signature = types.map(toItemType);
  s.action = (...a) => {
    const l = types.length;
    for(let i = 0; i < l; i++){
      const isNice = a[i] && a[i]._isAnything;
      const needJs = types[i].type.jsType;
      
      if(needJs && isNice){
        a[i] = a[i].getResult();
      } else if(!needJs && !isNice){
        a[i] = nice.toItem(a[i]);
      }
    }
    return s.source(...a);
  };
  def(s.action, 'length', s.source.length);
  return s;
}
function Configurator(name){
  const z = create(configProto, (...a) => {
    const { name, action, signature } = parseParams(...a);
    const res = createFunction(transform({
      description: z.description,
      type: z.functionType,
      existing: z.existing,
      name: z.name || name,
      action: action || z.action,
      signature: (z.signature || []).concat(signature || [])
    }));
    return z.returnValue || res;
  });
  nice.eraseProperty(z, 'name');
  def(z, 'name', name || '');
  return z;
}
function configurator(...a){
  const cfg = parseParams(...a);
  return Configurator(cfg.name).next(cfg);
};
function createFunction({ existing, name, action, source, signature, type, description }){
  const target = type === 'Check' ? nice.checkFunctions : nice;
  if(type !== 'Check' && name && typeof name === 'string'
          && name[0] !== name[0].toLowerCase())
    throw "Function name should start with lowercase letter. "
          + `"${nice._decapitalize(name)}" not "${name}"`;
  existing = existing || (name && target[name]);
  const f = existing || createFunctionBody(type);
  if(existing && existing.functionType !== type)
    throw `function '${name}' can't have types '${existing.functionType}' and '${type}' at the same time`;
  action && f.addSignature(action, signature);
  if(name){
    if(!existing){
      if(f.name !== name){
        nice.eraseProperty(f, 'name');
        def(f, 'name', name);
      }
      existing || def(target, name, f);
    }
    const firstType = signature[0] && signature[0].type;
    firstType && !firstType.proto.hasOwnProperty(name) && type !== 'Check'
        && def(firstType.proto, name, function(...a) { return f(this, ...a); });
    if(!existing){
      nice.emitAndSave('function', f);
      type && nice.emitAndSave(type, f);
    }
    action && nice.emitAndSave('signature',
      {name, action, signature, type, description, source });
  }
  return f;
};
function createFunctionBody(type){
  const z = create(functionProto, (...a) => {
    if(a.includes(nice))
      return skip(a, z);
    const s = findAction(z, a);
    if(!s)
      throw signatureError(z.name, a);
    if(type === 'Action'){
      if(is.primitive(a[0]))
        return s(...a);
      s(...a);
      return a[0];
    }
    if(type === 'Mapping')
      return nice(s(...a));
    return s(...a);
  });
  z.functionType = type;
  return z;
}
function findAction(target, args){
  let res;
  if(!args.length || !target.signatures)
    return target.action;
  for(let i in args) {
    let type = nice.typeOf(args[i++]);
    while(!res && type){
      if(target.signatures.has(type)){
        target = target.signatures.get(type);
        res = target.action;
      } else {
        type = Object.getPrototypeOf(type);
      }
    }
    if(res)
      return res;
  }
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
function skip(a, f){
  return create(skippedProto, (...b) => {
    const c = [];
    let i = 0;
    a.forEach(v => c.push(v === nice ? b[i++] : v));
    return f(...c);
  });
}
for(let i in nice.jsTypes) handleType(nice.jsTypes[i]);
nice._on('Type', handleType);
Func = def(nice, 'Func', configurator());
Action = def(nice, 'Action', configurator({functionType: 'Action'}));
Mapping = def(nice, 'Mapping', configurator({functionType: 'Mapping'}));
Check = def(nice, 'Check', configurator({functionType: 'Check'}));
nice._on('function', ({name}) => {
  name && !skippedProto[name] && def(skippedProto, name, function(...a){
    return create(skippedProto, a.includes(nice)
      ? (...b) => {
          let c = [];
          for (let i = a.length ; i--;){
            c[i] = a[i] === nice ? b.pop() : a[i];
          }
          return this(...b)[name](...c);
        }
      : (...b) => {
            return this(...b)[name](...a);
    });
  });
});
})();
(function(){"use strict";
const isProto = def(nice, 'isProto', {}), { Check } = nice;
nice._on('Check', f =>
  isProto[f.name] = function(...a) {
    try {
      return f(this.value, ...a);
    } catch (e) {
      return false;
    }
  });
is = def(nice, 'is', value => create(isProto, { value }));
nice._on('Check', f => {
  is[f.name] = (...a) => {
    try {
      return f(...a);
    } catch (e) {
      return false;
    }
  };
});
Check.about('Checks if two values are equal.')
  ('equal', (a, b) => a === b || (a && a.getResult ? a.getResult() : a) === (b && b.getResult ? b.getResult() : b))
const basicChecks = {
  true: v => v === true,
  false: v => v === false,
  any: (v, ...vs) => vs.includes(v),
  Array: a => Array.isArray(a),
  "NaN": n => Number.isNaN(n),
  Object: i => i !== null && typeof i === 'object' && !i._isSingleton,
  null: i => i === null,
  undefined: i => i === undefined,
  nice: v => nice.Anything.proto.isPrototypeOf(v),
  primitive: i => {
    const type = typeof i;
    return i === null || (type !== "object" && type !== "function");
  },
  empty: v => {
    if(is.Nothing(v) || v === null)
      return true;
    if(v === 0 || v === '' || v === false)
      return false;
    if(Array.isArray(v))
      return !v.length;
    if(typeof v === 'object')
      return !Object.keys(v).length;
    return !v;
  },
  subType: (a, b) => {
    is.String(a) && (a = nice.Type(a));
    is.String(b) && (b = nice.Type(b));
    return a === b || b.isPrototypeOf(a);
  },
  browser: () => nice.isEnvBrowser
};
for(let i in basicChecks)
  Check(i, basicChecks[i]);
const basicJS = 'number,function,string,boolean,symbol'.split(',');
for(let i in nice.jsTypes){
  const low = i.toLowerCase();
  nice.is[i] || Check(i, basicJS.includes(low)
    ? v => typeof v === low
    : v => v && v.constructor ? v.constructor.name === i : false);
};
nice._on('Type', function defineReducer(type) {
  type.name && Check(type.name, v =>
    v && v._type ? type.proto.isPrototypeOf(v) : false);
});
const switchProto = create(nice.checkers, {
  valueOf: function () { return this.res; },
  check: function (f) {
    this._check = f;
    const res = switchResult.bind(this);
    res.use = switchUse.bind(this);
    return res;
  },
  equal: function (v) {
    this._check = (...a) => v === a[0];
    const res = switchResult.bind(this);
    res.use = switchUse.bind(this);
    return res;
  }
});
defGet(switchProto, 'default', function () {
  const z = this;
  const res = v => z.done ? z.res : v;
  res.use = f => z.done ? z.res : f(...z.actionArgs);
  return res;
});
const actionProto = {};
nice._on('function', f => {
  if(f.functionType !== 'Check'){
    actionProto[f.name] = function(...a){ return this.use(v => f(v, ...a)); };
  }
});
const delayedProto = create(nice.checkers, {
  check: function (f) {
    this._check = f;
    const res = create(actionProto, delayedResult.bind(this));
    res.use = delayedUse.bind(this);
    return res;
  },
  equal: function (f) {
    this._check = (...a) => a[0] === f;
    const res = create(actionProto, delayedResult.bind(this));
    res.use = delayedUse.bind(this);
    return res;
  },
});
defGet(delayedProto, 'default', function () {
  const z = this, res = v => { z._default = () => v; return z; };
  res.use = f => { z._default = f; return z; };
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
  const f = () => f.done ? f.res : args[0];
  f.checkArgs = args;
  f.actionArgs = args;
  f.done = false;
  f.addCheck = check => {
    const preCheck = f._check;
    f._check = preCheck ? (...a) => preCheck(check(...a)) : check;
    const res = create(actionProto, switchResult.bind(f));
    res.use = switchUse.bind(f);
    return res;
  };
  return create(switchProto, f);
};
S.equal = v => DealyedSwitch().equal(v);
S.check = f => DealyedSwitch().check(f);
defGet(S, 'not', () => {
  const res = DealyedSwitch();
  res._check = r => !r;
  return res;
});
defGet(switchProto, 'not', function (){
  this._check = r => !r;
  return this;
});
defGet(delayedProto, 'not', function (){
  this._check = r => !r;
  return this;
});
function diggSignaturesLength(f, n = 0){
  f.action && f.action.length > n && (n = f.action.length);
  f.signatures && f.signatures.forEach(v => n = diggSignaturesLength(v, n));
  return n;
}
nice._on('Check', f => {
  if(!f.name || nice.checkers[f.name])
    return;
  const tryF = (...a) => {
    try {
      return f(...a);
    } catch (e) {
      return false;
    }
  };
  if(diggSignaturesLength(f) > 1){
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
S.addCheck = function (check) {
  const res = DealyedSwitch();
  return res.addCheck(check);
};
function DealyedSwitch(...a) {
  const f = (...a) => {
    const l = f.cases.length;
    let action = f._default;
    for(let i = 0 ;  i < l; i += 2){
      if(f.cases[i](...a)){
        action = f.cases[i + 1];
        break;
      }
    }
    return action ? action(...a) : a[0];
  };
  f.cases = a;
  f.addCheck = check => {
    const preCheck = f._check;
    f._check = preCheck ? (...a) => preCheck(check(...a)) : check;
    const res = create(actionProto, delayedResult.bind(f));
    res.use = delayedUse.bind(f);
    return res;
  };
  return create(delayedProto, f);
};
})();
(function(){"use strict";def(nice, 'expectPrototype', {
  toBe: function(value){
    if(!value) {
      if(!this.value)
        throw this.message || 'Value expected';
    } else {
      if(this.value != value)
        throw this.message || value + ' expected';
    }
  },
  notToBe: function(value){
    if(!value) {
      if(this.value)
        throw this.message || 'No value expected';
    } else {
      if(this.value == value)
        throw this.message || value + ' not expected';
    }
  },
  toMatch: function(f){
    if(!f(this.value))
      throw this.message || ('Value does not match function ' + f);
  }
});
nice._on('Check', f => {
  f.name && def(nice.expectPrototype, f.name, function(...a){
    if(!f(this.value, ...a))
      throw this.message || (f.name + ' expected');
    return nice.OK;
  });
});
def(nice, function expect(value, message){
  return create(nice.expectPrototype, { value, message, item: this});
});
expect = nice.expect;
})();
(function(){"use strict";function extend(child, parent){
  if(parent.extensible === false)
    throw `Type ${parent.name} is not extensible.`;
  create(parent, child);
  create(parent.proto, child.proto);
  create(parent.configProto, child.configProto);
  create(parent.types, child.types);
  parent.defaultResult && create(parent.defaultResult, child.defaultResult);
  nice.emitAndSave('Extension', { child, parent });
  child.super = parent;
}
nice.registerType({
  name: 'Anything',
  description: 'Parent type for all types.',
  extend: function (...a){
    return nice.Type(...a).extends(this);
  },
  proto: {
    _isAnything: true,
    apply: function(f){
      f(this);
      return this;
    },
    Switch: function (...vs) {
      const s = Switch(this, ...vs);
      return defGet(s, 'up', () => {
        s();
        return this;
      });
    },
    SwitchArg: function (...vs) {
      const s = Switch(this, ...vs);
      s.checkArgs = vs;
      return defGet(s, 'up', () => {
        s();
        return this;
      });
    },
    _notifyUp: function () {
      let p = this;
      do {
        p._notify && p._notify();
      } while (p = p._parent);
    }
  },
  configProto: {
    extends: function(parent){
      const type = this.target;
      is.String(parent) && (parent = nice[parent]);
      expect(parent).Type();
      extend(type, parent);
      return this;
    },
    about: function (...a) {
      this.target.description = nice.format(...a);
      return this;
    },
    key: function (name, o) {
      if(name[0] !== name[0].toLowerCase())
        throw "Property name should start with lowercase letter. ";
      def(this.target.proto, name, function (...a) {
        const r = this.getResult();
        if(a.length){
          if(is.Object(a[0]))
            throw "Key must be a primitive value.";
          this.set(name, a[0])
          return this;
        } else {
          return is.Anything(o) ? o.get(r[name]) : o[r[name]];
        }
      });
      return this;
    }
  },
  types: {}
});
Object.defineProperties(nice.Anything.proto, {
  switch: { get: function() { return Switch(this); } },
  is: { get: function() {
    const f = v => is(this).equal(v);
    f.value = this;
    return create(nice.isProto, f);
  } }
});
nice.ANYTHING = Object.seal(create(nice.Anything.proto, new String('ANYTHING')));
nice.Anything.proto._type = nice.Anything;
defAll(nice, {
  type: t => {
    is.String(t) && (t = nice[t]);
    expect(nice.Anything.isPrototypeOf(t) || nice.Anything === t,
      '' + t + ' is not a type').toBe();
    return t;
  },
  Type: (config = {}) => {
    if(is.String(config)){
      if(nice.types[config])
        throw `Type "${config}" already exists`;
      config = {name: config};
    }
    is.Object(config)
      || nice.error("Need object for type's prototype");
    config.name = config.name || 'Type_' + (nice._counter++);
    config.types = {};
    config.proto = config.proto || {};
    config.configProto = config.configProto || {};
    config.defaultResult = config.defaultResult || {};
    const type = (...a) => {
      const item = nice.createItem({ type });
      type.defaultValue && item.setResult(type.defaultValue());
      type.constructor && type.constructor(item, ...a);
      return item;
    };
    config.proto._type = type;
    delete config.by;
    Object.defineProperty(type, 'name', {writable: true});
    Object.assign(type, config);
    extend(type, config.hasOwnProperty('extends') ? nice.type(config.extends) : nice.Obj);
    const cfg = create(config.configProto, nice.Configurator(type, ''));
    config.name && nice.registerType(type);
    return cfg;
  },
});
nice.Check('Type', v => nice.Anything.isPrototypeOf(v));
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
})();
(function(){"use strict";function s(name, itemTitle, parent, description){
  nice.Type({
    name,
    extends: parent,
    creator: () => nice[itemTitle],
    description,
    proto: {
      _isSingleton: true,
    }
  });
  nice[itemTitle] = Object.seal(create(nice[name].proto, new String(itemTitle)));
}
s('Nothing', 'NOTHING', 'Anything', 'Parent type for all falsy values.');
s('Undefined', 'UNDEFINED', 'Nothing', 'Wrapper for JS undefined.');
s('Null', 'NULL', 'Nothing', 'Wrapper for JS null.');
s('NotFound', 'NOT_FOUND', 'Nothing', 'Value returned by lookup functions in case nothing is found.');
s('Fail', 'FAIL', 'Nothing', 'Empty negative signal.');
s('NeedComputing', 'NEED_COMPUTING', 'Nothing', 'State of the Box in case it need some computing.');
s('Pending', 'PENDING', 'Nothing', 'State of the Box when it awaits input.');
s('Stop', 'STOP', 'Nothing', 'Value used to stop iterationin .each() and similar functions.');
s('Something', 'SOMETHING', 'Anything', 'Parent type for all non falsy values.');
s('Ok', 'OK', 'Something', 'Empty positive signal.');
})();
(function(){"use strict";Mapping.Anything('or', (...as) => {
  let v;
  for(let i in as){
    v = nice(as[i]);
    if(is.Something(v) && (!v.getResult || v.getResult() !== false))
      return v;
  }
  return v || nice.NOTHING;
});
Func.Anything('and', (...as) => {
  let v;
  for(let i in as){
    v = nice(as[i]);
    if(!is.Something(v) || (!v.getResult || v.getResult() === false))
      return v;
  }
  return v;
});
Func.Anything('nor', (...as) => {
  let v;
  for(let i in as){
    v = nice(as[i]);
    if(is.Something(v) && (!v.getResult || v.getResult() !== false))
      return nice(false);
  }
  return nice(true);
});
Func.Anything('xor', (...as) => {
  let count = 0;
  for(let i in as){
    const v = nice(as[i]);
    if(is.Something(v) && (!v.getResult || v.getResult() !== false))
      count++;
  }
  return nice(count && count < as.length ? true : false);
});
})();
(function(){"use strict";nice.Type({
  name: 'Value',
  extends: 'Something',
  init: i => i.setResult(i._type.default()),
  default: () => undefined,
  defaultValue: () => ({}),
  isSubType,
  creator: () => { throw 'Use Single or Object.' },
  constructor: (z, ...a) => a.length && z.setValue(...a),
  fromResult: function(result){
    return this().setResult(result);
  },
  proto: create(nice.Anything.proto, {
    _isSingleton: false,
    setResult: function(v) {
      this._result = v;
      return this;
    },
    getResult: function() {
      return this._result;
    },
    valueOf: function (){ return this.getResult(); }
  }),
  configProto: {
    by: function(f){
      this.target.constructor = f;
      return this;
    },
    assign: function (...o) {
      Object.assign(this.target.proto, ...o);
      return this;
    },
    addProperty: function (name, cfg){
      Object.defineProperty(this.target.proto, name, cfg);
      return this;
    },
    Const: function(name, value){
      def(this.target, name, value);
      def(this.target.proto, name, value);
      return this;
    },
    ReadOnly: function(...a){
      const [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
      expect(f).function();
      defGet(this.target.proto, name, f);
      return this;
    }
  },
}).about('Parent type for all values.');
defGet(nice.Value.configProto, 'Method', function () {
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
  is.String(t) && (t = nice.Type(t));
  return t === this || t.isPrototypeOf(this);
};
nice.jsTypes.isSubType = isSubType;
})();
(function(){"use strict";
nice.Type({
    name: 'Obj',
    extends: nice.Value,
    defaultValue: function() {
      return nice.create(this.defaultResult,
          this === nice.Obj ? {} : { _nt_: this.name });
    },
    creator: () => {
      const f = (...a) => {
        if(a.length === 0)
          return f.getResult();
        let k = a[0];
        if(a.length === 1 && k === undefined)
          return f._parent || f;
        if(is.Str(k))
          k = k();
        if(a.length === 1 && k !== undefined && !is.Object(k))
          return f.get(k);
        f.setValue(...a);
        return f._parent || f;
      };
      return f;
    },
  })
  .about('Parent type for all composite types.')
  .ReadOnly(function values(){
    let a = nice.Arr();
    this.each(v => a.push(v));
    return a;
  })
  .addProperty('reduceTo', { get: function () {
    const c = this;
    const f = (item, f, init) => {
      init && init(item);
      c.each((v, k) => f(item, c.get(k), k));
      return item;
    };
    f.collection = c;
    return create(nice.collectionReducers, f);
  }})
  .addProperty('size', { get: function () {
    return Object.keys(this.getResult()).reduce(n => n + 1, 0);
  }})
  .Action(function itemsType(z, t){
    z._itemsType = t;
  });
Object.assign(nice.Obj.proto, {
  setValue: function (...a){
    let vs = a[0];
    if(!is.Object(vs)){
      let o = {};
      o[vs] = a[1];
      vs = o;
    }
    _each(vs, (v, k) => this.set(k, v));
  },
  setByType: function (key, type, value){
    this.getResult()[key] = value || type.defaultValue();
  },
  boxify: function () {
    const boxProto = Box.proto;
    Object.assign(this, {
      _subscribers: [],
      getItem: function () {
      },
      _notify: function (){
        if(this._subscribers){
          this._notifing = true;
          this._subscribers.forEach(s => {
            if(s.doCompute){
              s._notifing || s.doCompute();
            } else {
              s(this);
            }
          });
          this._notifing = false;
        }
        this._paret && this._parent._notify && this._parent._notify();
      },
      listen: function listen(f) {
        const ss = this._subscribers;
        if(!ss.includes(f)){
          ss.push(f);
          f(this);
        }
        return this;
      },
      transactionStart: boxProto.transactionStart,
      transactionEnd: boxProto.transactionEnd,
      transaction: boxProto.transaction
    });
    return this;
  }
});
const F = Func.Obj, M = Mapping.Obj, A = Action.Obj, C = Check.Obj;
M(function has(z, i) {
  if(i.pop){
    if(i.length === 1){
      i = i[0];
    } else {
      const head = i.shift();
      return z.has(head)() ? z.get(head).has(i) : false;
    }
  }
  return z.getResult().hasOwnProperty(i) ? true : false;
});
M(function get(z, i) {
  if(i.pop){
    if(i.length === 1){
      i = i[0];
    } else {
      return z.get(i.shift()).get(i);
    }
  }
  const vs = z.getResult();
  if(is.Str(i))
    i = i();
  if(!vs.hasOwnProperty(i)){
    const types = z._type.types;
    if(i in vs === false){
      if(types && types[i])
        vs[i] = types[i].defaultValue();
      else
        return nice.NOT_FOUND;
    } else {
      if(typeof vs[i] === 'object')
        vs[i] = create(vs[i], (types && types[i] && types[i].defaultValue()) || {});
    }
  }
  
  const res = nice.toItem(vs[i]);
  res._parent = z;
  res._parentKey = i;
  res.setResult = setResult.bind(res);
  res.getResult = getResult.bind(res);
  return res;
});
A('set', (z, path, v) => {
  let data = z.getResult();
  let k = path;
  if(path.pop){
    while(path.length > 1){
      k = nice.unwrap(path.shift());
      if(!data.hasOwnProperty(k)){
        data[k] = {};
        data = data[k];
      } else if(data[k]._nt_){
        if(typeof data[k] !== 'object')
          throw `Can't set property ${k} of ${data[k]}`;
        else
          data = data[k];
      } else if(typeof data[k] !== 'object') {
        throw `Can't set property ${k} of ${data[k]}`;
      } else {
        data = data[k];
      }
    }
    k = path[0];
  }
  k = nice.unwrap(k);
  const type = z._itemsType;
  data[k] = type
    ? (v._type && v._type === type ? v : type(v)).getResult()
    : Switch(v)
      .Box.use(v => v)
      .primitive.use(v => v)
      .nice.use(v => v.getResult())
      .Object.use(v => v)
      .function.use(v => v)
      ();
  z._notifyUp();
  return z;
});
Func.Nothing.function('each', () => 0);
F(function each(o, f){
  for(let k in o.getResult())
    if(k !== '_nt_')
      if(f(o.get(k), k) === nice.STOP)
        break;
  return o;
});
F('reverseEach', (o, f) => {
  Object.keys(o.getResult()).reverse().forEach(k => f(o.get(k), k));
});
A('assign', (z, o) => _each(o, (v, k) => z.set(k, v)));
A('remove', (z, i) => delete z.getResult()[i]);
A('removeAll', z => z.setResult(z._type.defaultValue()));
function setResult(v){
  this._parent.getResult()[this._parentKey] = v;
  this._notifyUp();
};
function getResult(){
  return this._parent.getResult()[this._parentKey];
};
nice._on('Type', function defineReducer(type) {
  const name = type.name;
  if(!name)
    return;
  nice.collectionReducers[name] = function(f, init){
    return this.collection.reduceTo(nice[name](), f, init);
  };
});
M(function reduce(o, f, res){
  for(let k in o.getResult())
    res = f(res, o.get(k), k);
  return res;
});
M(function mapToArray(c, f){
  return c.reduceTo.Array((a, v, k) => a.push(f(c.get(k), k)));
});
Mapping.Nothing.function('map', () => nice.Nothing);
M(function map(c, f){
  const res = c._type();
  for(let i in c())
    res.set(i, f(c.get(i), i));
  return res;
});
M(function filter(c, f){
  return c._type().apply(z => c.each((v, k) => f(v,k) && z.set(k, v)));
});
M(function sum(c, f){
  return c.reduceTo.Num((sum, v) => sum.inc(f ? f(v) : v));
});
C(function some(c, f){
  const items = c.getResult();
  for(let i in items)
    if(f(items[i], i))
      return true;
  return false;
});
C(function every(c, f){
  const items = c.getResult();
  for(let i in items)
    if(!f(items[i], i))
      return false;
  return true;
});
M(function find(c, f){
  const items = c.getResult();
  for(let i in items)
    if(f(items[i], i))
      return items[i];
  return nice.NOT_FOUND;
});
M(function findKey(c, f){
  const items = c.getResult();
  for(let i in items)
    if(f(items[i], i))
      return i;
  return nice.NOT_FOUND;
});
M.function(function count(o, f) {
  let n = 0;
  o.each((v, k) => f(v, k) && n++);
  return nice.Num(n);
});
M(function getProperties(z){
  const res = [];
  for(let i in z) z[i]._isProperty && res.push(z[i]);
  return res;
});
nice._on('Type', type => {
  const smallName = nice._decapitalize(type.name);
  function createProperty(z, name, value){
    const targetType = z.target;
    if(name[0] !== name[0].toLowerCase())
      throw "Property name should start with lowercase letter. "
            + `"${nice._decapitalize(name)}" not "${name}"`;
    targetType.types[name] = type;
    value !== undefined && (targetType.defaultResult[name] = value);
    defGet(targetType.proto, name, function(){
      const res = this.get(name);
      if(!is.subType(res._type, type))
        throw `Can't create ${type.name} property. Value is ${res._type.name}`;
      return res;
    });
    nice.emitAndSave('Property', { type, name, targetType });
  }
  def(nice.Obj.configProto, smallName, function (name, value = type.defaultValue()) {
    createProperty(this, name, value);
    return this;
  });
});
})();
(function(){"use strict";nice.Type({
  name: 'Box',
  extends: 'Something',
  creator: () => {
    const f = (...a) => {
      if(a.length === 0){
        f.compute();
        return f._result;
      }
      if(f._isReactive)
        throw `This box uses subscriptions you can't change it's value.`;
      f._notifing || f.setState(...a);
      return f._parent || f;
    };
    f._result = nice.PENDING;
    f._subscriptions = [];
    f._subscribers = [];
    f._isReactive = false;
    return f;
  },
  constructor: (z, ...a) => a.length && z(...a),
  proto: {
    by: function (...a){
      this._by = a.pop();
      a.length && this.use(...a);
      this._result = nice.NEED_COMPUTING;
      this._isReactive = true;
      return this;
    },
    async: function (f){
      this._asyncBy = f;
      this._result = nice.NEED_COMPUTING;
      return this;
    },
    use: function (...ss){
      ss.forEach(s => {
        if(s.__proto__ === Promise.prototype)
          s = Box().follow(s);
        expect(s !== this, `Box can't use itself`).toBe();
        
        this._subscriptions.push(s);
        this._isReactive = true;
        this._result = nice.NEED_COMPUTING;
      });
      this.isHot() && this.compute();
      return this;
    },
    follow: function (s){
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
      this._result = nice.NEED_COMPUTING;
      this.isHot() && this.compute();
      return this;
    },
    interval: function (f, t = 200) {
      setInterval(() => this.setState(f(this._result)), t);
      return this;
    },
    timeout: function (f, t = 200) {
      setTimeout(() => f(this), t);
      return this;
    },
    doCompute: function (){
      this.transactionStart();
      this._result = nice.PENDING;
      let _result;
      const ss = this._subscriptions;
      ss.forEach(s => {
        if(!s._subscribers.includes(this)){
          isResolved(s) || s.compute();
          s._subscribers.push(this);
        }
      });
      const unwrap = s => is.Box(s) ? unwrap(s._result) : s;
      const _results = ss.map(unwrap);
      if(ss.some(s => !isResolved(s))){
        _result = nice.PENDING;
      } else if(_results.find(is.Err)){
        _result = nice.Err(`Dependency error`);
      }
      try {
        if(_result){
          this._simpleSetState(_result);
        } else if(this._by){
          this._simpleSetState(this._by(..._results));
        } else if(this._asyncBy){
          
          this._isReactive = false;
          this._asyncBy(this, ..._results);
        } else {
          this._simpleSetState(_results[0]);
        }
      } catch (e) {
        console.log('ups', e);
        this.error(e);
        return;
      } finally {
        return this.transactionEnd(true);
      }
      return this._result;
    },
    compute: function() {
      return this._result !== nice.NEED_COMPUTING || this._transactionDepth
        ? this._result : this.doCompute();
    },
    valueOf: function() {
      return this.hasOwnProperty('_result') && this._result;
    },
    getDiff: function (){
      if(this._diff || this._diff === false)
        return this._diff;
      return this._diff = nice.diff(
          diffConverter(this.initState),
          diffConverter(this._result)
      );
    },
    getDiffTo: function (oldValue = this.initState){
      return this._diff = nice.diff(
          diffConverter(oldValue),
          diffConverter(this._result)
      );
    },
    change: function (f){
      this.transactionStart();
      let res = f(this._result);
      res === undefined || (this._result = res);
      this.transactionEnd();
      return this;
    },
    _simpleSetState: function(v){
      if(v === undefined)
        throw `Can't set _result of the box to undefined.`;
      if(v === this)
        throw `Can't set _result of the box to box itself.`;
      while(v && v._up_)
        v = v._up_;
      this._result = v;
    },
    setState: function(v){
      if(v === undefined)
        throw `Can't set _result of the box to undefined.`;
      if(v === this)
        throw `Can't set _result of the box to box itself.`;
      while(v && v._up_)
        v = v._up_;
      if(this._result !== v) {
        this.transactionStart();
        this._result = v;
        this.transactionEnd();
      }
      return this._result;
    },
    _notify: function (){
      this._notifing = true;
      this._subscribers.forEach(s => {
        if(s.doCompute){
          s._notifing || s.doCompute();
        } else {
          isResolved(this) && s(this._result);
        }
      });
      this._notifing = false;
    },
    isHot: function (){
      return this._transactionDepth
        || (this._subscribers && this._subscribers.length);
    },
    lock: function(){
      this._locked = true;
      return this;
    },
    unlock: function(){
      this._locked = false;
      return this;
    },
    'default': function (v) {
      isResolved(this) || this(v);
    },
    error: function(e) {
      return this.setState(is.Err(e) ? e : nice.Err(e));
    },
    transactionStart: function(){
      if(this._locked)
        throw nice.LOCKED_ERROR;
      if(!this._transactionDepth){
        this.initState = this._result;
        this._result = nice.cloneDeep(this.initState);
        this._diff = null;
        this._transactionDepth = 0;
      }
      this._transactionDepth++;
      return this;
    },
    transactionEnd: function(onlyIfDiff = false){
      if(--this._transactionDepth > 0)
        return false;
      this._transactionDepth = 0;
      const go = this.getDiff();
      go && this._notify();
      this.initState = null;
      (this._result && this._result._notify) || Object.freeze(this._result);
      delete this._diff;
      return go;
    },
    transactionRollback: function(){
      this._transactionDepth && (this._result = this.initState);
      this._transactionDepth = 0;
      this.initState = null;
      delete this._diff;
      return this;
    },
    transaction: function (f, p) {
      this.transactionStart();
      f();
      this.transactionEnd(p);
      return this;
    },
    getPromise: function () {
      return new Promise((resolve, reject) => {
        this.listenOnce(v => (is.Err(v) ? reject : resolve)(v));
      });
    }
  }
}).about('Observable component for declarative style programming.');
Box = nice.Box;
const F = Func.Box;
['use', 'follow', 'once', 'by', 'async']
    .forEach(k => def(Box, k, (...a) => Box()[k](...a)));
function diffConverter(v){
  return is.Value(v) ? v.getResult() : v;
}
F.function(function listen(source, f) {
  const ss = source._subscribers;
  if(!ss.includes(f)){
    ss.push(f);
    isResolved(source) ? f(source._result) : source.compute();
  }
  return source;
});
F.function(function listenOnce(source, f) {
  isResolved(source) || source.compute();
  if(isResolved(source))
    return f(source._result);
  const _f = v => {
    f(v);
    source.unsubscribe(_f);
  };
  source._subscribers.push(_f);
  return source;
});
F('listenDiff', (b, f) => b.listen(() => f(b.getDiff())));
F(function unsubscribe(s, target){
  nice._removeArrayValue(s._subscribers, target);
  s._subscribers.length || s._subscriptions.forEach(_s => _s.unsubscribe(s));
});
F.Box(function bind(y, x) {
  y(x());
  x.listen(y);
  y.listen(x);
  return y;
});
F.Box(function unbind(y, x) {
  nice.unsubscribe(y, x);
  nice.unsubscribe(x, y);
  return y;
});
nice._on('Type', type => {
  if(!type.name)
    return;
  def(Box.proto, nice._decapitalize(type.name), function (name, value) {
    expect(name).String();
    const input = Box();
    value !== undefined && input(value);
    input._parent = this;
    def(this, name, input);
    return this.use(input);
  });
});
def(nice, 'resolveChildren', (v, f) => {
  if(!v)
    return f(v);
  if(is.Box(v))
    return v.listenOnce(_v => nice.resolveChildren(_v, f));
  if(v._result){
    if(is.Object(v._result)){
      let count = 0;
      const next = () => {
        count--;
        count === 0 && f(v);
      };
      _each(v._result, () => count++);
      !count ? f(v) : _each(v._result, (vv, kk) => {
        nice.resolveChildren(vv, _v => {
          if(_v && _v._type){
            _v = _v._result;
          }
          v._result[kk] = _v;
          next();
        });
      });
    } else {
      f(v);
    }
  } else {
    if(is.Object(v)){
      let count = 0;
      const next = () => {
        count--;
        count === 0 && f(v);
      };
      _each(v, () => count++);
      !count ? f(v) : _each(v, (vv, kk) => {
        nice.resolveChildren(vv, _v => {
          if(_v && _v._type){
            _v = _v._result;
          }
          v[kk] = _v;
          next();
        });
      });
    } else {
      f(v);
    }
  }
});
function isResolved (s){
  return s._result !== nice.NEED_COMPUTING && s._result !== nice.PENDING;
};
})();
(function(){"use strict";nice.Type({
  name: 'Err',
  extends: 'Nothing',
  constructor: (z, message) => {
    z.message = message;
    const a = new Err().stack.split('\n');
    a.splice(0, 4);
    z.trace = a.join('\n');
  },
  creator: () => ({}),
  proto: {
    valueOf: function() { return new Err(this.message); },
    toString: function() { return `Error: ${this.message}`; }
  }
}).about('Represents error.');
})();
(function(){"use strict";nice.Type({
  name: 'Single',
  defaultValue: () => undefined,
  creator: () => {
    const f = (...a) => {
      if(a.length === 0)
        return f.getResult();
      f.setValue(...a);
      return f._parent || f;
    };
    return f;
  },
  extends: nice.Value,
  proto: {
    setValue: function(...a) {
      const { set } = this._type;
      this.setResult(set ? set(...a) : a[0]);
    },
    set: null,
    get: null,
    setByType: null,
    remove: null,
    removeAll: null,
  }
}).about('Parent type for all non composite types.');
nice._on('Type', type => {
  def(nice.Single.configProto, type.name, () => {
    throw "Can't add properties to SingleValue types";
  });
});
})();
(function(){"use strict";nice.Obj.extend({
  name: 'Arr',
  creator: nice.Single.creator,
  defaultValue: () => [],
  constructor: (z, ...a) => z.push(...a),
  proto: {
    setValue: function (...a){
      return this.push(...a);
    },
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
    pop: function () {
      return nice.toItem(this.getResult().pop());
    },
    shift: function () {
      return nice.toItem(this.getResult().shift());
    },
  }
}).about('Ordered list of elements.')
  .ReadOnly(function size() {
    return this.getResult().length;
  })
  .Action(function push(z, ...a) {
    a.forEach(v => z.set(z.getResult().length, v));
  });
const Arr = nice.Arr;
const F = Func.Arr, M = Mapping.Arr, A = Action.Arr;
const f = Func.Array, m = Mapping.Array, a = Action.Array;
M.function('reduce', (a, f, res) => {
  each(a, (v, k) => res = f(res, v, k));
  return res;
});
M.function('reduceRight', (a, f, res) => {
  a.eachRight((v, k) => res = f(res, v, k));
  return res;
});
M.Array('concat', (a, ...bs) => a._result.concat(...bs));
M('sum', (a, f) => a.reduce(f ? (sum, n) => sum + f(n) : (sum, n) => sum + n, 0));
A('unshift', (z, ...a) => a.reverse().forEach(v => z.insertAt(0, v)));
A('add', (z, ...a) => {
  const toAdd = Array.isArray(a[0]) ? a[0] : a;
  const data = z.getResult();
  toAdd.forEach(v => data.includes(v) || z.push(v));
});
A('pull', (z, item) => {
  const k = is.Value(item)
    ? z.getResult().indexOf(item)
    : z.findKey(v => item === v());
  (k === -1 || k === undefined) || z.removeAt(k);
});
A('insertAt', (z, i, v) => {
  z.getResult().splice(i, 0, null);
  z.set(i, v);
});
A('removeAt', (z, i) => z.getResult().splice(i, 1));
F('callEach', (z, ...a) => {
  z().forEach( f => f.apply(z, ...a) );
  return z;
});
'splice'.split(',').forEach(name => {
 A(name, (a, ...bs) => a.getResult()[name](...bs));
});
function each(z, f){
  const a = z.getResult();
  const l = a.length;
  for (let i = 0; i < l; i++)
    if(f(z.get(i), i) === nice.STOP)
      break;
  return z;
}
F.function(each);
F.function('forEach', each);
F.function(function eachRight(z, f){
  const a = z.getResult();
  let i = a.length;
  while (i-- > 0)
    if(f(z.get(i), i) === nice.STOP)
      break;
  return z;
});
A(function fill(z, v, start = 0, end){
  const l = z.getResult().length;
  end === undefined && (end = l);
  start < 0 && (start += l);
  end < 0 && (end += l);
  for(let i = start; i < end; i++){
    z.set(i, v);
  }
});
M.function(function map(a, f){
  return a.reduceTo.Arr((z, v, k) => z.push(f(v, k)));
});
M.function(function filter(a, f){
  return a.reduceTo(Arr(), (res, v, k) => f(v, k, a) && res.push(v));
});
M(function random(a){
  return a.get(Math.random() * a.size | 0);
});
M(function sortBy(a, f){
  f = nice.mapper(f);
  const res = Arr();
  const source = a.getResult();
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
      return nice.STOP;
    }
  });
  return i;
});
M.about('Creates new array with separator between elments.')
(function intersperse(a, separator) {
  const res = Arr();
  const last = a.size - 1;
  a.each((v, k) => res.push(v) && (k < last && res.push(separator)));
  return res;
});
typeof Symbol === 'function' && F(Symbol.iterator, z => {
  let i = 0;
  const l = z.getResult().length;
  return { next: () => ({ value: z.get(i), done: ++i > l }) };
});
})();
(function(){"use strict";nice.Single.extend({
  name: 'Num',
  defaultValue: () => 0,
  set: n => +n,
}).about('Wrapper for JS number.');
_each({
  between: (n, a, b) => n > a && n < b,
  integer: n => Number.isInteger(n),
  saveInteger: n => Number.isSaveInteger(n),
  finite: n => Number.isFinite(n),
  lt: (n, a) => n < a,
  lte: (n, a) => n <= a,
  gt: (n, a) => n > a,
  gte: (n, a) => n >= a,
}, (f, name) => Check.Number(name, f));
const M = Mapping.Number;
_each({
  sum: (a, b) => a + b,
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
  M.about('Delegates to Math.' + k)(k, (n, ...a) => Math[k](n, ...a)));
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
M.function('times', (n, f) => {
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
A('setMax', (z, n) => { n > z() && z(n); return z._parent || z; });
A('setMin', (z, n) => { n < z() && z(n); return z._parent || z; });
})();
(function(){"use strict";const whiteSpaces = ' \f\n\r\t\v\u00A0\u2028\u2029';
nice.Single.extend({
  name: 'Str',
  defaultValue: () => '',
  set: (...a) => a[0] ? nice.format(...a) : ''
})
  .about('Wrapper for JS string.')
  .ReadOnly(function length(){
    return this.getResult().length;
  });
_each({
  endsWith: (s, p, l) => s.endsWith(p, l),
  startsWith: (s, p, i) => s.startsWith(p, i),
  includes: (s, p, i) => s.includes(p, i),
  match: (s, r) => r && r.test && r.test(s),
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
match
search
replace
localeCompare`.split('\n').forEach(k => M(k, (s, ...a) => s[k](...a)));
nice.Mapping.Number(String.fromCharCode);
nice.Mapping.Number(String.fromCodePoint);
typeof Symbol === 'function' && Func.String(Symbol.iterator, z => {
  let i = 0;
  const l = z.length;
  return { next: () => ({ value: z[i], done: ++i > l }) };
});
})();
(function(){"use strict";nice.Single.extend({
  name: 'Bool',
  set: n => !!n,
  defaultValue: () => false,
}).about('Wrapper for JS boolean.');
const B = nice.Bool, M = Mapping.Bool;
const A = Action.Bool;
A('turnOn', z => z(true));
A('turnOff', z => z(false));
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
nice.Type('Html')
  .about('Represents HTML element.')
  .by((z, tag) => tag && z.tag(tag))
  .str('tag', 'div')
  .obj('eventHandlers')
  .obj('cssSelectors')
  .Action.about('Adds event handler to an element.')(function on(z, name, f){
    if(name === 'domNode' && nice.isEnvBrowser){
      if(!z.id())
        throw `Give element an id to use domNode event.`;
      const el = document.getElementById(z.id());
      el && f(el);
    }
    nice.Switch(z.eventHandlers(name))
      .Nothing.use(() => z.eventHandlers(name, [f]))
      .default.use(a => a.push(f));
  })
  .obj('style')
  .obj('attributes')
  .arr('children')
  .Method('_autoId', z => {
    z.id() || z.id(AUTO_PREFIX + autoId++);
    return z.id();
  })
  .Method('_autoClass', z => {
    const s = z.attributes('className').or('')();
    if(s.indexOf(AUTO_PREFIX) < 0){
      const c = AUTO_PREFIX + autoId++;
      z.attributes('className', s + ' ' + c);
    }
    return z;
  })
  .Method.about('Adds values to className attribute.')('class', (z, ...vs) => {
    const current = z.attributes('className').or('')();
    if(!vs.length)
      return current;
    const a = current ? current.split(' ') : [];
    vs.forEach(v => !v || a.includes(v) || a.push(v));
    z.attributes('className', a.join(' '));
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
  .Action
    .about('Map provided collection with provided function and add result as children.')
      ('mapAndAdd', (z, c, f) => nice.each(c, (v, k) => z.add(f(v, k))))
  .Action.about('Focuses DOM element.')('focus', (z, preventScroll) =>
      z.on('domNode', node => node.focus(preventScroll)))
  .Action.about('Adds children to an element.')(function add(z, ...children) {
    children.forEach(c => {
      if(is.Array(c))
        return _each(c, _c => z.add(_c));
      if(is.Arr(c))
        return c.each(_c => z.add(_c));
      if(c === undefined || c === null)
        return;
      if(is.String(c))
        return z.children(c);
      if(is.Number(c))
        return z.children('' + c);
      if(c === z)
        return z.children(`Errro: Can't add element to itself.`);
      if(!c || !is.Anything(c))
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
defGet(Html.proto, 'hover', function(){
  const style = Style();
  this._autoClass();
  this.cssSelectors(':hover', style);
  return style;
});
def(Html.proto, 'Css', function(s = ''){
  s = s.toLowerCase();
  if(this.cssSelectors.has(s)())
    return this.cssSelectors.get(s);
  this._autoClass();
  const style = Style();
  style.up = this;
  this.cssSelectors(s, style);
  return style;
});
nice._on('Extension', ({child, parent}) => {
  if(parent === Html || Html.isPrototypeOf(parent)){
    def(Html.proto, child.name, function (...a){
      const res = child(...a);
      this.add(res);
      return res;
    });
    const _t = nice._decapitalize(child.name);
    Html.proto[_t] || def(Html.proto, _t, function (...a){
      return this.add(child(...a));
    });
  }
});
Html.proto.Box = function(...a) {
  const res = Box(...a);
  res.up = this;
  this.add(res);
  return res;
};
'clear,alignContent,alignItems,alignSelf,alignmentBaseline,all,animation,animationDelay,animationDirection,animationDuration,animationFillMode,animationIterationCount,animationName,animationPlayState,animationTimingFunction,backfaceVisibility,background,backgroundAttachment,backgroundBlendMode,backgroundClip,backgroundColor,backgroundImage,backgroundOrigin,backgroundPosition,backgroundPositionX,backgroundPositionY,backgroundRepeat,backgroundRepeatX,backgroundRepeatY,backgroundSize,baselineShift,border,borderBottom,borderBottomColor,borderBottomLeftRadius,borderBottomRightRadius,borderBottomStyle,borderBottomWidth,borderCollapse,borderColor,borderImage,borderImageOutset,borderImageRepeat,borderImageSlice,borderImageSource,borderImageWidth,borderLeft,borderLeftColor,borderLeftStyle,borderLeftWidth,borderRadius,borderRight,borderRightColor,borderRightStyle,borderRightWidth,borderSpacing,borderStyle,borderTop,borderTopColor,borderTopLeftRadius,borderTopRightRadius,borderTopStyle,borderTopWidth,borderWidth,bottom,boxShadow,boxSizing,breakAfter,breakBefore,breakInside,bufferedRendering,captionSide,clip,clipPath,clipRule,color,colorInterpolation,colorInterpolationFilters,colorRendering,columnCount,columnFill,columnGap,columnRule,columnRuleColor,columnRuleStyle,columnRuleWidth,columnSpan,columnWidth,columns,content,counterIncrement,counterReset,cursor,cx,cy,direction,display,dominantBaseline,emptyCells,fill,fillOpacity,fillRule,filter,flex,flexBasis,flexDirection,flexFlow,flexGrow,flexShrink,flexWrap,float,floodColor,floodOpacity,font,fontFamily,fontFeatureSettings,fontKerning,fontSize,fontStretch,fontStyle,fontVariant,fontVariantLigatures,fontWeight,height,imageRendering,isolation,justifyContent,left,letterSpacing,lightingColor,lineHeight,listStyle,listStyleImage,listStylePosition,listStyleType,margin,marginBottom,marginLeft,marginRight,marginTop,marker,markerEnd,markerMid,markerStart,mask,maskType,maxHeight,maxWidth,maxZoom,minHeight,minWidth,minZoom,mixBlendMode,motion,motionOffset,motionPath,motionRotation,objectFit,objectPosition,opacity,order,orientation,orphans,outline,outlineColor,outlineOffset,outlineStyle,outlineWidth,overflow,overflowWrap,overflowX,overflowY,padding,paddingBottom,paddingLeft,paddingRight,paddingTop,page,pageBreakAfter,pageBreakBefore,pageBreakInside,paintOrder,perspective,perspectiveOrigin,pointerEvents,position,quotes,r,resize,right,rx,ry,shapeImageThreshold,shapeMargin,shapeOutside,shapeRendering,speak,stopColor,stopOpacity,stroke,strokeDasharray,strokeDashoffset,strokeLinecap,strokeLinejoin,strokeMiterlimit,strokeOpacity,strokeWidth,tabSize,tableLayout,textAlign,textAlignLast,textAnchor,textCombineUpright,textDecoration,textIndent,textOrientation,textOverflow,textRendering,textShadow,textTransform,top,touchAction,transform,transformOrigin,transformStyle,transition,transitionDelay,transitionDuration,transitionProperty,transitionTimingFunction,unicodeBidi,unicodeRange,userZoom,vectorEffect,verticalAlign,visibility,whiteSpace,widows,width,willChange,wordBreak,wordSpacing,wordWrap,writingMode,x,y,zIndex,zoom'
  .split(',').forEach( property => {
    def(Html.proto, property, function(...a) {
      is.Object(a[0])
        ? _each(a[0], (v, k) => this.style(property + nice.capitalize(k), v))
        : this.style(property, is.String(a[0]) ? nice.format(...a) : a[0]);
      return this;
    });
    def(Style.proto, property, function(...a) {
      is.Object(a[0])
        ? _each(a[0], (v, k) => this(property + nice.capitalize(k), v))
        : this(property, is.String(a[0]) ? nice.format(...a) : a[0]);
      return this;
    });
  });
'value,checked,accept,accesskey,action,align,alt,async,autocomplete,autofocus,autoplay,autosave,bgcolor,buffered,challenge,charset,cite,code,codebase,cols,colspan,contenteditable,contextmenu,controls,coords,crossorigin,data,datetime,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,for,form,formaction,headers,hidden,high,href,hreflang,icon,id,integrity,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,manifest,max,maxlength,media,method,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,seamless,selected,shape,sizes,slot,spellcheck,src,srcdoc,srclang,srcset,start,step,summary,tabindex,target,title,type,usemap,wrap'
  .split(',').forEach( property => {
    Html.proto[property] = function(...a){
      return a.length
        ? this.attributes(property, ...a)
        : nice.Switch(this.attributes(property)).Value.use(v => v()).default('');
    };
  });
function text(){
  return this.children
      .map(v => v.text
        ? v.text
        : nice.htmlEscape(is.function(v) ? v(): v))
      .getResult().join('');
};
function compileStyle (s){
  const a = [];
  _each(s, (v, k) => a.push(k.replace(/([A-Z])/g, "-$1").toLowerCase() + ':' + v));
  return a.join(';');
};
function compileSelectors (r){
  const a = [];
  _each(r.cssSelectors, (v, k) => a.push('.', getAutoClass(r.attributes.className),
    ' ', k, '{', compileStyle (v), '}'));
  return a.length ? '<style>' + a.join('') + '</style>' : '';
};
const resultToHtml = r => {
  const a = [compileSelectors(r), '<', r.tag ];
  const style = compileStyle(r.style);
  style && a.push(" ", 'style="', style, '"');
  _each(r.attributes, (v, k) => {
    k === 'className' && (k = 'class', v = v.trim());
    a.push(" ", k , '="', v, '"');
  });
  a.push('>');
  _each(r.children, c => a.push(c && c.tag
    ? resultToHtml(c)
    : nice.htmlEscape(c)));
  a.push('</', r.tag, '>');
  return a.join('');
};
function html(){
  return resultToHtml(this._result);
};
defAll(nice, {
  htmlEscape: s => (''+s).replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
});
const getAutoClass = s => s.match(/(_nn_\d+)/)[0];
if(nice.isEnvBrowser){
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);
  const styleSheet = styleEl.sheet;
  const addStyle = Switch
    .Box.use((s, k, node) => {
      const f = v => addStyle(v, k, node);
      s.listen(f);
      nice._set(node, ['styleSubscriptions', k], () => s.unsubscribe(f));
    })
    .default.use((v, k, node) => node.style[k] = v);
  const delStyle = Switch
    .Box.use((s, k, node) => {
      node.styleSubscriptions[k]();
      delete node.styleSubscriptions[k];
      node.style[k] = '';
    })
    .default.use((v, k, node) => node.style && (node.style[k] = ''));
  const addAttribute = Switch
    .Box.use((s, k, node) => {
      const f = v => addAttribute(v, k, node);
      s.listen(f);
      nice._set(node, ['attrSubscriptions', k], () => s.unsubscribe(f));
    })
    .default.use((v, k, node) => node[k] = v);
  const delAttribute = Switch
    .Box.use((s, k, node) => {
      node.attrSubscriptions[k]();
      delete node.attrSubscriptions[k];
      node[k] = '';
    })
    .default.use((v, k, node) => node[k] = '');
  const addSelectors = (selectors, node) => {
    _each(selectors, (_v, k) => addRules(_v, k, getAutoClass(node.className)));
  };
  const addRules = (vs, selector, className) => {
    const rule = assertRule(selector, className);
    _each(vs, (value, prop) => rule.style[prop] = value);
  };
  const findRule = (selector, className) => {
    const s = `.${className} ${selector}`.toLowerCase();
    let rule;
    for (const r of styleSheet.cssRules)
      r.selectorText === s && (rule = r);
    return rule;
  };
  const assertRule = (selector, className) => {
    return findRule(selector, className) || styleSheet
        .cssRules[styleSheet.insertRule(`.${className} ${selector}` + '{}')];
  };
  const killSelectors = (css, className) => {
    _each(css, (_v, k) => killRules(_v, k, getAutoClass(className)));
  };
  const killRules = (vs, selector, id) => {
    const rule = findRule(selector, id);
    rule && _each(vs, (value, prop) => rule.style[prop] = null);
  };
  function killNode(n){
    n && n.parentNode && n.parentNode.removeChild(n);
  }
  function insertBefore(node, newNode){
    node.parentNode.insertBefore(newNode, node);
    return newNode;
  }
  function insertAfter(node, newNode){
    node.parentNode.insertBefore(newNode, node.nextSibling);
    return newNode;
  }
  function preserveAutoClass(add, del, node){
    const a = nice._get(add, ['attributes', 'className']) || '';
    const d = node && node.className || '';
    const ai = a.indexOf(AUTO_PREFIX);
    const di = d.indexOf(AUTO_PREFIX);
    if(ai >= 0 && di >= 0){
      const old = d.match(/(_nn_\d+)/)[0];
      delete del.attributes.className;
      add.attributes.className = a.replace(/_nn_(\d+)/, old);
    }
  }
  function fillNode(o, node){
    _each(o.style, (_v, k) => addStyle(_v, k, node));
    _each(o.attributes, (_v, k) => addAttribute(_v, k, node));
    addSelectors(o.cssSelectors, node);
    addHandlers(o.eventHandlers, node);
  }
  function cleanNode(o, node) {
    _each(o.style, (_v, k) => delStyle(_v, k, node));
    _each(o.attributes, (_v, k) => delAttribute(_v, k, node));
    killSelectors(o.cssSelectors,
        node.className || (o.attributes && o.attributes.className));
    nice._eachEach(o.eventHandlers, (f, _n, k) =>
          node.removeEventListener(k, f, true));
  }
  function createTextNode(t, parent, oldNode) {
    const node = document.createTextNode(is.Nothing(t) ? '' : '' + t);
    oldNode ? insertBefore(oldNode, node) : parent.appendChild(node);
    return node;
  }
  function handleNode(add, del, oldNode, parent){
    let node;
    if(del && !is.Nothing(del) && !oldNode)
      throw '!oldNode';
    if(add === undefined){
      if(del === undefined){
        throw 'Why are we here?'
      } else if (is.Box(del)) {
        throw 'todo:';
      } else if (is.Object(del)) {
        if(del.tag){
          killNode(oldNode);
        } else {
          cleanNode(del, node = oldNode);
          handleChildren(add, del, node);
        }
        
      } else {
        killNode(oldNode);
      }
    } else if (is.Box(add)) {
      let _del = del;
      node = oldNode;
      if(del === undefined){
        node = document.createTextNode(' ');
        parent.appendChild(node);
      } else if (is.Box(del)) {
        throw 'todo:';
      } else if (is.Object(del)) {
        ;
      } else {
        ;
      }
      const f = () => {
        const diff = add.getDiffTo(_del);
        _del = undefined;
        node = handleNode(diff.add, diff.del, node, parent);
        
      };
      add.listen(f);
      node.__niceSubscription = f;
    } else if (is.Object(add)) {
      const tag = add.tag;
      preserveAutoClass(add, del, oldNode);
      if(tag){
        let victim;
        if(del === undefined){
          node = document.createElement(tag);
        } else if (is.Box(del)) {
          throw 'todo';
        } else if (is.Object(del)) {
          node = changeHtml(oldNode, tag);
          cleanNode(del, node);
          victim = oldNode;
        } else {
          node = document.createElement(tag);
          victim = oldNode;
        }
        oldNode ? insertBefore(oldNode, node) : parent.appendChild(node);
        victim && killNode(victim);
      } else {
        node = oldNode;
        if(is.Object(del)){
          cleanNode(del, node);
        }
      }
      
      handleChildren(add, del, node);
      fillNode(add, node);
    } else {
      if(del === undefined){
        node = createTextNode(add, parent, oldNode);
      } else if (is.Box(del)) {
        throw 'todo';
      } else if (is.Object(del)) {
        node = createTextNode(add, parent, oldNode);
        killNode(oldNode);
      } else {
        oldNode.nodeValue = is.Nothing(add) ? '' : '' + add;
        node = oldNode;
      }
    }
    
    if(add !== undefined && !node)
      throw '!node';
    return node;
  }
  function handleChildren(add, del, target){
    const a = add && add.children;
    const d = del && del.children;
    const f = k => handleNode(a && a[k], d && d[k], target.childNodes[k], target);
    const keys = [];
    _each(a, (v, k) => f( + k));
    _each(d, (v, k) => (a && a[k]) || keys.push( + k));
    keys.sort((a,b) => b - a).forEach(f);
  };
  Func.Box(function show(source, parent = document.body){
    const i = parent.childNodes.length;
    let node = null;
    source.listenDiff(diff => {
      let before = node;
      node = handleNode(diff.add, diff.del, node, parent);
      if(!node)
        throw '!!!'
    });
    return source;
  });
  function newNode(tag, parent = document.body){
    return parent.appendChild(document.createElement(tag));
  };
  Func.Html(function show(source, parent = document.body){
    handleNode(source.getResult(), undefined, null, parent);
    return source;
  });
  function changeHtml(old, tag){
    const node = document.createElement(tag);
    while (old.firstChild) node.appendChild(old.firstChild);
    for (let i = old.attributes.length - 1; i >= 0; --i) {
      node.attributes.setNamedItem(old.attributes[i].cloneNode());
    }
    addHandlers(old.__niceListeners, node);
    delete(old.__niceListeners);
    return node;
  }
  function addHandlers(eventHandlers, node){
    nice._eachEach(eventHandlers, (f, _n, k) => {
      if(k === 'domNode')
        return f(node);
      node.addEventListener(k, f, true);
      node.__niceListeners = node.__niceListeners || {};
      node.__niceListeners[k] = node.__niceListeners[k] || [];
      node.__niceListeners[k].push(f);
    });
  }
};
})();
(function(){"use strict";const Html = nice.Html;
'Div,I,B,Span,H1,H2,H3,H4,H5,H6,P,Li,Ul,Ol,Pre'.split(',').forEach(t =>
  Html.extend(t).by((z, ...cs) => z.tag(t.toLowerCase()).add(...cs))
    .about('Represents HTML <%s> element.', t.toLowerCase()));
Html.extend('A').by((z, url, ...children) => {
  z.tag('a');
  z.add(...children);
  is.function(url)
    ? z.on('click', e => {url(e); e.preventDefault();}).href('#')
    : z.href(url || '#');
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
function attachValue(target, setValue = defaultSetValue){
  let node, mute;
  target.value = Box("");
  target.value._parent = target;
  if(nice.isEnvBrowser){
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
Html.extend('Input')
  .about('Represents HTML <input> element.')
  .by((z, type) => attachValue(z.tag('input').attributes('type', type || 'text')));
Html.extend('Button')
  .about('Represents HTML <input type="button"> element.')
  .by((z, text, action) => {
    z.tag('input').attributes({type: 'button', value: text}).on('click', action);
  });
Html.extend('Textarea')
  .about('Represents HTML <textarea> element.')
  .by((z, value) => {
    z.tag('textarea');
    attachValue(z, (t, v) => t.children.removeAll().push(v));
    z.value(value ? '' + value : "");
  });
Html.extend('Submit')
  .about('Represents HTML <input type="submit"> element.')
  .by((z, text) => z.tag('input').attributes({type: 'submit', value: text}));
Html.extend('Checkbox')
  .about('Represents HTML <input type="checkbox"> element.')
  .by((z, status) => {
    let node;
    z.tag('input').attributes({type: 'checkbox'});
    z.checked = Box(status || false);
    z.checked._parent = z;
    let mute;
    z.on('change', e => {
      mute = true;
      z.checked((e.target || e.srcElement).checked);
      mute = false;
      return true;
    });
    if(nice.isEnvBrowser){
      z._autoId();
      z.on('domNode', n => node = n);
    }
    z.checked.listen(v => node ? node.checked = v : z.attributes('checked', v));
  });
})();;})();