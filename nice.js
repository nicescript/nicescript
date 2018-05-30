;let nice;(function(){let create,Div,Func,Switch,expect,is,_each,def,defAll,defGet,Box,Action,Mapping,Check;
(function(){"use strict";nice = (...a) => {
  if(a.length === 0)
    return nice.Object();
  if(a.length > 1)
    return nice.Array(...a);
  if(Array.isArray(a[0]))
    return nice.Array(...a[0]);
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
      return nice.Number;
    if(typeof v === 'function')
      return nice.function;
    if(typeof v === 'string')
      return nice.String;
    if(typeof v === 'boolean')
      return nice.Boolean;
    if(Array.isArray(v))
      return nice.Array;
    if(v._nt_ && v.hasOwnProperty('_nv_'))
      return nice[v._nt_];
    if(typeof v === 'object')
      return nice.Object;
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
  orderedStringify: o => !is.object(o)
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
const counterValues = {};
def(nice, function counter(name){
  if(!name)
    return counterValues;
  counterValues[name] = counterValues[name] || 0;
  counterValues[name]++;
});
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
    } else if(is.object(o)) {
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
      res = o._type();
      res._result = nice.cloneDeep(o.getResult());
      return res;
    } else if(Array.isArray(o)) {
      res = [];
    } else if(is.object(o)) {
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
  _deCapitalize: s => s[0].toLowerCase() + s.substr(1),
  doc: () => {
    const res = { types: {}, functions: [] };
    nice._on('signature', s => {
      const o = {};
      _each(s, (v, k) => nice.Switch(k)
        .equal('action')()
        .equal('source').use(() => o.source = v.toString())
        .equal('signature').use(() => o[k] = v.map(t => t.type.title))
        .default.use(() => o[k] = v));
      res.functions.push(o);
    });
    nice._on('Type', t => {
      const o = { title: t.title, description: t.description };
      t.extends && (o.extends = t.super.title);
      res.types[t.title] = o;
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
  if(!a)
    return b;
  if(Array.isArray(b)){
    return Array.isArray(a) ? compareObjects(a, b) : b;
  } else if(is.object(b)) {
    return is.object(a) ? compareObjects(a, b) : b;
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
    while(k = ks.shift()){
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
    while(o !== undefined && (k = ks.shift())){
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
(function(){"use strict";nice.jsTypes = { js: { title: 'js', proto: {}, jsType: true }};
const jsHierarchy = {
  js: 'primitive,object',
  primitive: 'string,boolean,number,undefined,null,symbol',
  object: 'function,date,regExp,array,error,arrayBuffer,dataView,map,weakMap,set,weakSet,promise',
  error: 'evalError,rangeError,referenceError,syntaxError,typeError,uriError'
};
for(let i in jsHierarchy)
  jsHierarchy[i].split(',').forEach(title => {
    const parent = nice.jsTypes[i];
    const proto = create(parent.proto);
    nice.jsTypes[title] = create(parent,
        { title, proto, jsType: true, jsName: nice._capitalize(title) });
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
  return { type: type.jsType
    ? nice[type.title[0].toUpperCase() + type.title.substr(1)]
    : type };
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
          + `"${nice._deCapitalize(name)}" not "${name}"`;
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
  return `Function ${name} can't handle (${a.map(v => nice.typeOf(v).title).join(',')})`;
}
function handleType(type){
  type.title === 'Something' && create(type.proto, functionProto);
  defGet(functionProto, type.title, function() {
    return configurator({ signature: [{type}], existing: this });
  });
  defGet(configProto, type.title, function() {
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
Func = def(nice, 'Function', configurator());
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
(function(){"use strict";const isProto = def(nice, 'isProto', {}), { Check } = nice;
nice._on('Check', f =>
  isProto[f.name] = function(...a) { return f(this.value, ...a); });
is = def(nice, 'is', value => create(isProto, { value }));
nice._on('Check', f => is[f.name] = f);
Check.about('Checks if two values are equal.')
  ('equal', (a, b) => a === b || (a && a.getResult ? a.getResult() : a) === (b && b.getResult ? b.getResult() : b))
const basicChecks = {
  true: v => v === true,
  false: v => v === false,
  any: (v, ...vs) => vs.includes(v),
  array: a => Array.isArray(a),
  "NaN": n => Number.isNaN(n),
  object: i => i !== null && typeof i === 'object' && !i._isSingleton,
  null: i => i === null,
  undefined: i => i === undefined,
  nice: v => nice.Anything.proto.isPrototypeOf(v),
  primitive: i => {
    const type = typeof i;
    return i === null || (type !== "object" && type !== "function");
  },
  empty: v => {
    if(!v)
      return true;
    if(Array.isArray(v))
      return !v.length;
    if(typeof v === 'object')
      return !Object.keys(v).length;
    return !v;
  },
  subType: (a, b) => {
    is.string(a) && (a = nice.Type(a));
    is.string(b) && (b = nice.Type(b));
    return a === b || b.isPrototypeOf(a);
  },
  browser: () => nice.isEnvBrowser
};
for(let i in basicChecks)
  Check(i, basicChecks[i]);
const basicJS = 'number,function,string,boolean,symbol'.split(',');
for(let i in nice.jsTypes)
  nice.is[i] || Check(i, basicJS.includes(i)
    ? v => typeof v === i
    : v => v && v.constructor && v.constructor.name === nice.jsTypes[i].jsName);
nice._on('Type', function defineReducer(type) {
  type.title && Check(type.title, v =>
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
  res.use = f => z.done ? z.res : f(...z.args);
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
  if(!z.done && z._check(...z.args)){
    z.res = v;
    z.done = true;
  }
  z._check = null;
  return z;
}
function switchUse(f){
  const z = this;
  if(!z.done && z._check(...z.args)){
    z.res = f(...z.args);
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
  f.args = args;
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
  if(diggSignaturesLength(f) > 1){
    def(nice.checkers, f.name, function (...a) {
      return this.addCheck(v => f(v, ...a));
    });
  } else {
    defGet(nice.checkers, f.name, function(){
      return this.addCheck(f);
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
  });
});
def(nice, function expect(value, message){
  return create(nice.expectPrototype, { value, message, item: this});
});
expect = nice.expect;
})();
(function(){"use strict";function extend(child, parent){
  create(parent, child);
  create(parent.proto, child.proto);
  create(parent.configProto, child.configProto);
  create(parent.types, child.types);
  parent.defaultResult && create(parent.defaultResult, child.defaultResult);
  nice.emitAndSave('Extension', { child, parent });
  child.super = parent;
}
nice.registerType({
  title: 'Anything',
  extend: function (...a){
    return nice.Type(...a).extends(this);
  },
  proto: {
    _isAnything: true,
    apply: function(f){
      f(this);
      return this;
    }
  },
  configProto: {
    extends: function(parent){
      const type = this.target;
      is.string(parent) && (parent = nice[parent]);
      expect(parent).Type();
      extend(type, parent);
      return this;
    },
    about: function (...a) {
      this.target.description = nice.format(...a);
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
  saveValue: v => v,
  loadValue: v => v,
  type: t => {
    is.string(t) && (t = nice[t]);
    expect(nice.Anything.isPrototypeOf(t) || nice.Anything === t,
      '' + t + ' is not a type').toBe();
    return t;
  },
  Type: (config = {}) => {
    if(is.string(config)){
      if(nice.types[config])
        throw `Type "${config}" already exists`;
      config = {title: config};
    }
    is.object(config)
      || nice.error("Need object for type's prototype");
    !config.title || is.string(config.title)
      || nice.error("Title must be String");
    config.types = {};
    config.proto = config.proto || {};
    config.configProto = config.configProto || {};
    config.defaultResult = config.defaultResult || {};
    const type = (...a) => nice.createItem({ type }, ...a);
    config.proto._type = type;
    delete config.by;
    Object.assign(type, config);
    extend(type, config.hasOwnProperty('extends') ? nice.type(config.extends) : nice.Object);
    const cfg = create(config.configProto, nice.Configurator(type, ''));
    config.title && nice.registerType(type);
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
    const res = nice[primitive[0].toUpperCase() + primitive.substr(1)];
    if(!res)
      throw `JS type ${primitive} not supported`;
    return res;
  }
  if(Array.isArray(v))
    return nice.Array;
  return nice.Object;
};
})();
(function(){"use strict";function s(title, itemTitle, parent){
  nice.Type({
    title: title,
    extends: parent,
    creator: () => nice[itemTitle],
    proto: {
      _isSingleton: true,
    }
  });
  nice[itemTitle] = Object.seal(create(nice[title].proto, new String(itemTitle)));
}
s('Nothing', 'NOTHING', 'Anything');
s('Undefined', 'UNDEFINED', 'Nothing');
s('Null', 'NULL', 'Nothing');
s('NotFound', 'NOT_FOUND', 'Nothing');
s('Fail', 'FAIL', 'Nothing');
s('NeedComputing', 'NEED_COMPUTING', 'Nothing');
s('Pending', 'PENDING', 'Nothing');
s('Stop', 'STOP', 'Nothing');
s('Something', 'SOMETHING', 'Anything');
s('Ok', 'OK', 'Something');
})();
(function(){"use strict";nice.Type({
  title: 'Value',
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
  saveValue: function (_nv_) {
    const _nt_ = this.title;
    return _nt_ === 'Object' ? _nv_ : { _nt_, _nv_ };
  },
  loadValue: v => v._nv_ || v,
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
});
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
  is.string(t) && (t = nice.Type(t));
  return t === this || t.isPrototypeOf(this);
};
nice.jsTypes.isSubType = isSubType;
})();
(function(){"use strict";
nice.Type({
    title: 'Object',
    extends: nice.Value,
    defaultValue: function() { return nice.create(this.defaultResult); },
    creator: () => {
      const f = (...a) => {
        if(a.length === 0)
          return f.getResult();
        let k = a[0];
        if(a.length === 1 && k === undefined)
          return f._parent || f;
        if(is.String(k))
          k = k();
        if(a.length === 1 && k !== undefined && !is.object(k))
          return f.get(k);
        f.setValue(...a);
        return f._parent || f;
      };
      return f;
    },
  })
  .ReadOnly(function values(){
    let a = nice.Array();
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
Object.assign(nice.Object.proto, {
  setValue: function (...a){
    let vs = a[0];
    if(!is.object(vs)){
      let o = {};
      o[vs] = a[1];
      vs = o;
    }
    _each(vs, (v, k) => this.set(k, v));
  },
  setByType: function (key, type, value){
    this.getResult()[key] = type.saveValue(value
      ? value
      : type.defaultValue());
  }
});
const F = Func.Object, M = Mapping.Object, A = Action.Object, C = Check.Object;
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
  if(is.String(i))
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
          vs[i] = (types && types[i] && types[i].defaultValue()) || {};
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
        if(typeof data[k]._nv_ !== 'object')
          throw `Can't set property ${k} of ${data[k]}`;
        else
          data = data[k]._nv_;
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
    ? nice.fromItem(v._type && v._type === type ? v : type(v))
    : Switch(v)
      .Box.use(v => v)
      .primitive.use(v => v)
      .nice.use(nice.fromItem)
      .object.use(nice.saveValue)
      .function.use(v => v)
      ();
  return z;
});
Func.Nothing.function('each', () => 0);
F(function each(o, f){
  for(let k in o.getResult())
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
  this._parent.getResult()[this._parentKey] = this._type.saveValue(v);
};
function getResult(){
  return this._type.loadValue(this._parent.getResult()[this._parentKey]);
};
nice._on('Type', function defineReducer(type) {
  const title = type.title;
  if(!title)
    return;
  nice.collectionReducers[title] = function(f, init){
    return this.collection.reduceTo(nice[title](), f, init);
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
  return c.reduceTo.Number((sum, v) => sum.inc(f ? f(v) : v));
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
  return nice.NotFound;
});
M(function findKey(c, f){
  const items = c.getResult();
  for(let i in items)
    if(f(items[i], i))
      return i;
  return nice.NotFound;
});
M.function(function count(o, f) {
  let n = 0;
  o.each((v, k) => f(v, k) && n++);
  return nice.Number(n);
});
M(function getProperties(z){
  const res = [];
  for(let i in z) z[i]._isProperty && res.push(z[i]);
  return res;
});
nice._on('Type', type => {
  def(nice.Object.configProto, type.title, function (name, value = type.defaultValue()) {
    const targetType = this.target;
    if(name[0] !== name[0].toLowerCase())
      throw "Property name should start with lowercase letter. "
            + `"${nice._deCapitalize(name)}" not "${name}"`;
    targetType.types[name] = type;
    value && (targetType.defaultResult[name] = value);
    defGet(targetType.proto, name, function(){
      const res = this.get(name);
      if(!is.subType(res._type, type))
        throw `Can't create ${type.title} property. Value is ${res._type.title}`;
      return res;
    });
    return this;
  });
});
})();
(function(){"use strict";nice.Type({
  title: 'Box',
  extends: 'Something',
  creator: () => {
    const f = (...a) => {
      if(a.length === 0){
        f.compute();
        return f.state;
      }
      f._notifing || f.setState(...a);
      return f._parent || f;
    };
    f.state = nice.PENDING;
    f._subscriptions = [];
    f._subscribers = [];
    return f;
  },
  constructor: (z, ...a) => a.length && z(...a),
  proto: {
    by: function (...a){
      this._by = a.pop();
      a.length && this.use(...a);
      this.state = nice.NEED_COMPUTING;
      return this;
    },
    async: function (f){
      this._asyncBy = f;
      this.state = nice.NEED_COMPUTING;
      return this;
    },
    use: function (...ss){
      ss.forEach(s => {
        if(s.__proto__ === Promise.prototype)
          s = Box().follow(s);
        expect(s !== this, `Box can't use itself`).toBe();
        expect(s, `Can use only box or promise.`).Box();
        this._subscriptions.push(s);
        this.state = nice.NEED_COMPUTING;
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
      }
      this.state = nice.NEED_COMPUTING;
      this.isHot() && this.compute();
      return this;
    },
    interval: function (f, t = 200) {
      setInterval(() => f(this), t);
      return this;
    },
    timeout: function (f, t = 200) {
      setTimeout(() => f(this), t);
      return this;
    },
    doCompute: function (){
      this.transactionStart();
      this.state = nice.PENDING;
      let state;
      const ss = this._subscriptions;
      ss.forEach(s => {
        if(!s._subscribers.includes(this)){
          s.isResolved() || s.compute();
          s._subscribers.push(this);
        }
      });
      const states = ss.map(s => s.state);
      if(ss.some(s => !s.isResolved())){
        state = nice.PENDING;
      } else if(states.find(is.Error)){
        state = nice.Error(`Dependency error`);
      }
      try {
        if(state){
          this(state);
        } else if(this._by){
          this(this._by(...states));
        } else if(this._asyncBy){
          this._asyncBy(this, ...states);
        } else {
          this(states[0]);
        }
      } catch (e) {
        console.log('ups', e);
        this.error(e);
        return;
      } finally {
        return this.transactionEnd(true);
      }
      return this.state;
    },
    compute: function() {
      return this.state !== nice.NEED_COMPUTING || this._transactionDepth
        ? this.state : this.doCompute();
    },
    valueOf: function() {
      return this.hasOwnProperty('state') && this.state;
    },
    getDiff: function (){
      if(this._diff || this._diff === false)
        return this._diff;
      return this._diff = nice.diff(
          diffConverter(this.initState),
          diffConverter(this.state)
      );
    },
    change: function (f){
      this.transactionStart();
      let res = f(this.state);
      res === undefined || (this.state = res);
      this.transactionEnd();
      return this;
    },
    setState: function(v){
      if(v === undefined)
        throw `Can't set state of the box to undefined.`;
      if(v === this)
        throw `Can't set state of the box to box itself.`;
      while(v && v._up_)
        v = v._up_;
      if(nice.is.Box(v))
        return this.follow(v)();
      this.transactionStart();
      this.state = v;
      this.transactionEnd();
      return this.state;
    },
    _notify: function (){
      this._notifing = true;
      this._subscribers.forEach(s => {
        if(s.doCompute){
          s._notifing || s.doCompute();
        } else {
          this.isResolved() && s(this.state);
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
      this.isResolved() || this(v);
    },
    error: function(e) {
      return this.setState(is.Error(e) ? e : nice.Error(e));
    },
    transactionStart: function(){
      if(this._locked)
        throw nice.LOCKED_ERROR;
      if(!this._transactionDepth){
        this.initState = this.state;
        this.state = nice.cloneDeep(this.initState);
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
      Object.freeze(this.state);
      delete this._diff;
      return go;
    },
    transactionRollback: function(){
      this._transactionDepth && (this.state = this.initState);
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
    isResolved: function (){
      return this.state !== nice.NEED_COMPUTING && this.state !== nice.PENDING;
    },
    getPromise: function () {
      return new Promise((resolve, reject) => {
        this.listenOnce(v => (is.Error(v) ? reject : resolve)(v));
      });
    }
  }
});
Box = nice.Box;
const F = Func.Box;
['use', 'follow', 'once', 'by', 'async']
    .forEach(k => def(Box, k, (...a) => Box()[k](...a)));
function diffConverter(v){
  return is.Value(v)? nice.fromItem(v) : v;
}
F.function(function listen(source, f) {
  const ss = source._subscribers;
  if(!ss.includes(f)){
    ss.push(f);
    source.isResolved() ? f(source.state) : source.compute();
  }
  return source;
});
F.function(function listenOnce(source, f) {
  source.isResolved() || source.compute();
  if(source.isResolved())
    return f(source.state);
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
  if(!type.title)
    return;
  def(Box.proto, type.title, function (name, value) {
    expect(name).string();
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
    if(is.object(v._result)){
      let count = 0;
      const next = () => {
        count--;
        count === 0 && f(v);
      };
      _each(v._result, () => count++);
      !count ? f(v) : _each(v._result, (vv, kk) => {
        nice.resolveChildren(vv, _v => {
          if(_v && _v._type){
            _v = _v._type.saveValue(_v._result);
          }
          v._result[kk] = _v;
          next();
        });
      });
    } else {
      f(v);
    }
  } else {
    if(is.object(v)){
      let count = 0;
      const next = () => {
        count--;
        count === 0 && f(v);
      };
      _each(v, () => count++);
      !count ? f(v) : _each(v, (vv, kk) => {
        nice.resolveChildren(vv, _v => {
          if(_v && _v._type){
            _v = _v._type.saveValue(_v._result);
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
nice._on('Action', f => {
  const {name} = f;
  Box.proto.hasOwnProperty(name) || def(Box.proto, name,
    function (...a) {
      return this.change(state => f(state, ...a));
    }
  );
});
nice._on('Mapping', ({name}) => {
  Box.proto.hasOwnProperty(name) || def(Box.proto, name,
    function (...a) {
      return Box().use(this).by(z => nice[name](z, ...a));
    }
  );
});
})();
(function(){"use strict";nice.Type({
  title: 'Error',
  
  extends: 'Nothing',
  constructor: (z, message) => {
    z.message = message;
    const a = new Error().stack.split('\n');
    a.splice(0, 4);
    z.trace = a.join('\n');
  },
  creator: () => ({}),
  proto: {
    valueOf: function() { return new Error(this.message); },
    toString: function() { return `Error: ${this.message}`; }
  }
});
})();
(function(){"use strict";nice.Type({
  title: 'Single',
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
});
nice._on('Type', type => {
  def(nice.Single.configProto, type.title, () => {
    throw "Can't add properties to SingleValue types";
  });
});
})();
(function(){"use strict";nice.Object.extend({
  title: 'Array',
  creator: nice.Single.creator,
  defaultValue: () => [],
  constructor: (z, ...a) => z.push(...a),
  saveValue: v => v,
  loadValue: v => v,
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
})
  .ReadOnly(function size() {
    return this.getResult().length;
  })
  .Action(function push(z, ...a) {
    a.forEach(v => z.set(z.getResult().length, v));
  });
const F = Func.Array, M = Mapping.Array, A = Action.Array;
const f = Func.array, m = Mapping.array, a = Action.array;
M.function('reduce', (a, f, res) => {
  each(a, (v, k) => res = f(res, v, k));
  return res;
});
M.function('reduceRight', (a, f, res) => {
  a.eachRight((v, k) => res = f(res, v, k));
  return res;
});
M.array('concat', (a, ...bs) => a._result.concat(...bs));
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
  return a.reduceTo.Array((z, v, k) => z.push(f(v, k)));
});
M.function(function filter(a, f){
  return a.reduceTo(nice.Array(), (res, v, k) => f(v, k, a) && res.push(v));
});
M(function sortBy(a, f){
  f = nice.mapper(f);
  const res = nice.Array();
  const source = a.getResult();
  source
    .map((v, k) => [k, f(v)])
    .sort((a, b) => +(a[1] > b[1]) || +(a[1] === b[1]) - 1)
    .forEach(v => res.push(source[v[0]]));
  return res;
});
M.about('Creates new array with separator between elments.')
(function intersperse(a, separator) {
  const res = nice.Array();
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
  title: 'Number',
  defaultValue: () => 0,
  set: n => +n,
  saveValue: v => v,
  loadValue: v => v
});
_each({
  between: (n, a, b) => n > a && n < b,
  integer: n => Number.isInteger(n),
  saveInteger: n => Number.isSaveInteger(n),
  finite: n => Number.isFinite(n),
  lt: (n, a) => n < a,
  lte: (n, a) => n <= a,
  gt: (n, a) => n > a,
  gte: (n, a) => n >= a,
}, (f, name) => Check.number(name, f));
const M = Mapping.number;
_each({
  sum: (a, b) => a + b,
  difference: (a, b) => a - b,
  product: (a, b) => a * b,
  fraction: (a, b) => a / b,
  reminder: (a, b) => a % b
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
const A = Action.Number;
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
  title: 'String',
  defaultValue: () => '',
  saveValue: v => v,
  loadValue: v => v,
  set: (...a) => a[0] ? nice.format(...a) : ''
})
  .ReadOnly(function length(){
    return this.getResult().length;
  });
_each({
  endsWith: (s, p, l) => s.endsWith(p, l),
  startsWith: (s, p, i) => s.startsWith(p, i),
  includes: (s, p, i) => s.includes(p, i),
  match: (s, r) => r && r.test && r.test(s),
}, (f, name) => Check.string(name, f));
const M = Mapping.string;
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
  deCapitalize: nice._deCapitalize
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
nice.Mapping.number(String.fromCharCode);
nice.Mapping.number(String.fromCodePoint);
typeof Symbol === 'function' && Func.string(Symbol.iterator, z => {
  let i = 0;
  const l = z.length;
  return { next: () => ({ value: z[i], done: ++i > l }) };
});
})();
(function(){"use strict";nice.Single.extend({
  title: 'Boolean',
  set: n => !!n,
  defaultValue: () => false,
  saveValue: v => v,
  loadValue: v => v
});
const B = nice.Boolean, M = Mapping.Boolean;
M('and', (z, v) => B(z() && v));
M('or', (z, v) => B(z() || v));
M('nor', (z, v) => B(!(z() || v)));
M('xor', (z, v) => B(z() ^  !!v));
const A = Action.Boolean;
A('turnOn', z => z(true));
A('turnOff', z => z(false));
})();
(function(){"use strict";const index = {};
nice.Type({
  title: 'Interface',
  constructor: (z, title, ...a) => {
    if(nice[title])
      throw `Can't create interface ${title} name busy.`;
    if(a.length === 0)
      throw `Can't create empty interface.`;
    z.title = title;
    z.methods = a;
    z.matchingTypes = [];
    a.forEach(k => (index[k] = index[k] || []).push(z));
    nice._on('Type', type => match(type, z) && z.matchingTypes.push(type));
    Check(title, type => z.matchingTypes.includes(type._type || type));
    Object.freeze(z);
    def(nice, title, z);
    nice.emitAndSave('interface', z);
  }
});
nice.onNew('signature', s => {
  if(s.type === 'Check')
    return;
  const type = s.signature[0] && s.signature[0].type;
  const intrested = index[s.name];
  type && intrested && intrested.forEach(i => {
    match(type, i) && i.matchingTypes.push(type);
  });
});
function match(type, { methods }){
  let ok = true;
  let l = methods.length;
  while(ok && l--){
    ok &= type.proto.hasOwnProperty(methods[l]);
  }
  return ok;
}
})();
(function(){"use strict";nice.Type('Range')
  .Number('start', 0)
  .Number('end', Infinity)
  .by((z, a, b) => b === undefined ? z.end(a) : z.start(a).end(b))
  .Method(function each(z, f){
    let i = z.start();
    let end = z.end();
    let n = 0;
    while(i <= end) f(i++, n++);
  })
  .Mapping(function map(f){
    let i = this.start();
    let n = 0;
    const a = nice.Array();
    while(i <= this.end()) a(f(i++, n++));
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
Func.Number.Range(function within(v, r){
  return v >= r.start && v <= r.end;
});
})();
(function(){"use strict";nice.Type('Html')
  .by((z, tag) => tag && z.tag(tag))
  .String('tag', 'div')
  .Object('eventHandlers')
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
  .Object('style')
  .Object('attributes')
  .Array('children')
  .Array('class')
  .ReadOnly(text)
  .ReadOnly(html)
  .Method(function scrollTo(z, offset = 10){
    z.on('domNode', node => {
      node && window.scrollTo(node.offsetLeft - offset, node.offsetTop - offset);
    });
    return z;
  })
  .Action('focus', z => z.on('domNode', node => node.focus()))
  .Action(function add(z, ...children) {
    children.forEach(c => {
      if(is.array(c))
        return _each(c, _c => z.add(_c));
      if(is.Array(c))
        return c.each(_c => z.add(_c));
      if(c === undefined || c === null)
        return;
      if(is.string(c))
        return z.children(c);
      if(is.number(c))
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
nice._on('Extension', o => o.parent === nice.Html &&
  def(Html.proto, o.child.title, function (...a){
    const res = nice[o.child.title](...a);
    this.add(res);
    return res;
  })
);
Html.proto.Box = function(...a) {
  const res = Box(...a);
  res.up = this;
  this.add(res);
  return res;
};
'clear,alignContent,alignItems,alignSelf,alignmentBaseline,all,animation,animationDelay,animationDirection,animationDuration,animationFillMode,animationIterationCount,animationName,animationPlayState,animationTimingFunction,backfaceVisibility,background,backgroundAttachment,backgroundBlendMode,backgroundClip,backgroundColor,backgroundImage,backgroundOrigin,backgroundPosition,backgroundPositionX,backgroundPositionY,backgroundRepeat,backgroundRepeatX,backgroundRepeatY,backgroundSize,baselineShift,border,borderBottom,borderBottomColor,borderBottomLeftRadius,borderBottomRightRadius,borderBottomStyle,borderBottomWidth,borderCollapse,borderColor,borderImage,borderImageOutset,borderImageRepeat,borderImageSlice,borderImageSource,borderImageWidth,borderLeft,borderLeftColor,borderLeftStyle,borderLeftWidth,borderRadius,borderRight,borderRightColor,borderRightStyle,borderRightWidth,borderSpacing,borderStyle,borderTop,borderTopColor,borderTopLeftRadius,borderTopRightRadius,borderTopStyle,borderTopWidth,borderWidth,bottom,boxShadow,boxSizing,breakAfter,breakBefore,breakInside,bufferedRendering,captionSide,clip,clipPath,clipRule,color,colorInterpolation,colorInterpolationFilters,colorRendering,columnCount,columnFill,columnGap,columnRule,columnRuleColor,columnRuleStyle,columnRuleWidth,columnSpan,columnWidth,columns,content,counterIncrement,counterReset,cursor,cx,cy,direction,display,dominantBaseline,emptyCells,fill,fillOpacity,fillRule,filter,flex,flexBasis,flexDirection,flexFlow,flexGrow,flexShrink,flexWrap,float,floodColor,floodOpacity,font,fontFamily,fontFeatureSettings,fontKerning,fontSize,fontStretch,fontStyle,fontVariant,fontVariantLigatures,fontWeight,height,imageRendering,isolation,justifyContent,left,letterSpacing,lightingColor,lineHeight,listStyle,listStyleImage,listStylePosition,listStyleType,margin,marginBottom,marginLeft,marginRight,marginTop,marker,markerEnd,markerMid,markerStart,mask,maskType,maxHeight,maxWidth,maxZoom,minHeight,minWidth,minZoom,mixBlendMode,motion,motionOffset,motionPath,motionRotation,objectFit,objectPosition,opacity,order,orientation,orphans,outline,outlineColor,outlineOffset,outlineStyle,outlineWidth,overflow,overflowWrap,overflowX,overflowY,padding,paddingBottom,paddingLeft,paddingRight,paddingTop,page,pageBreakAfter,pageBreakBefore,pageBreakInside,paintOrder,perspective,perspectiveOrigin,pointerEvents,position,quotes,r,resize,right,rx,ry,shapeImageThreshold,shapeMargin,shapeOutside,shapeRendering,speak,stopColor,stopOpacity,stroke,strokeDasharray,strokeDashoffset,strokeLinecap,strokeLinejoin,strokeMiterlimit,strokeOpacity,strokeWidth,tabSize,tableLayout,textAlign,textAlignLast,textAnchor,textCombineUpright,textDecoration,textIndent,textOrientation,textOverflow,textRendering,textShadow,textTransform,top,touchAction,transform,transformOrigin,transformStyle,transition,transitionDelay,transitionDuration,transitionProperty,transitionTimingFunction,unicodeBidi,unicodeRange,userZoom,vectorEffect,verticalAlign,visibility,whiteSpace,widows,width,willChange,wordBreak,wordSpacing,wordWrap,writingMode,x,y,zIndex,zoom'
  .split(',').forEach( property => {
    nice.define(Html.proto, property, function(...a) {
      is.object(a[0])
        ? _each(a[0], (v, k) => this.style(property + nice.capitalize(k), v))
        : this.style(property, is.string(a[0]) ? nice.format(...a) : a[0]);
      return this;
    });
  });
'value,checked,accept,accesskey,action,align,alt,async,autocomplete,autofocus,autoplay,autosave,bgcolor,buffered,challenge,charset,cite,code,codebase,cols,colspan,contenteditable,contextmenu,controls,coords,crossorigin,data,datetime,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,for,form,formaction,headers,hidden,high,href,hreflang,icon,id,integrity,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,manifest,max,maxlength,media,method,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,seamless,selected,shape,sizes,slot,span,spellcheck,src,srcdoc,srclang,srcset,start,step,summary,tabindex,target,title,type,usemap,wrap'
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
const resultToHtml = r => {
  const a = ['<', r.tag];
  const style = compileStyle(r.style);
  style && a.push(" ", 'style="', style, '"');
  r.class && r.class.length && a.push(" ", 'class="', r.class.join(' '), '"');
  _each(r.attributes, (v, k) => a.push(" ", k , '="', v, '"'));
  a.push('>');
  _each(r.children, c => a.push(c && c._nv_ && c._nv_.tag
    ? resultToHtml(c._nv_)
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
if(nice.isEnvBrowser){
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
  function handleNode(add, del, oldNode, parent){
    let node;
    if(del && !is.Nothing(del) && !oldNode)
      throw '!oldNode';
    del && Switch(del)
      .Box.use(b => {
        b.unsubscribe(oldNode.__niceSubscription);
        oldNode.__niceSubscription = null;
      })
      .object.use(o => {
        const v = o._nv_;
        if(v.tag && add === undefined){
          killNode(oldNode);
        } else {
          _each(v.style, (_v, k) => delStyle(_v, k, oldNode));
          _each(v.attributes, (_v, k) => delAttribute(_v, k, oldNode));
          nice._eachEach(v.eventHandlers, (f, _n, k) =>
                oldNode.removeEventListener(k, f, true));
        }
      })
      .default.use(t => add !== undefined || t !== undefined && killNode(oldNode));
    if(is.Box(add)) {
      const f = () => {
        const diff = add.getDiff();
        node = handleNode(diff.add, diff.del, node, parent);
      };
      add.listen(f);
      node = node || oldNode || document.createTextNode(' ');
      node.__niceSubscription = f;
      oldNode || parent.appendChild(node);
    } else if(add !== undefined) {
      if (add && add._nv_) { 
        const v = add._nv_;
        const newHtml = v.tag;
        if(newHtml){
          if(del && !is.string(del) && !is.Nothing(del)){
            node = changeHtml(oldNode, newHtml);
          }
          node = node || document.createElement(newHtml);
          oldNode ? insertBefore(oldNode, node) : parent.appendChild(node);
        } else {
          node = oldNode;
        }
        _each(v.style, (_v, k) => addStyle(_v, k, node));
        _each(v.attributes, (_v, k) => addAttribute(_v, k, node));
        addHandlers(v.eventHandlers, node);
      } else {
        const text = is.Nothing(add) ? '' : '' + add;
        node = document.createTextNode(text);
        oldNode ? insertBefore(oldNode, node) : parent.appendChild(node);
      }
      oldNode && (oldNode !== node) && killNode(oldNode);
    }
    is.Box(add) || (node && node.nodeType === 3)
            || handleChildren(add, del, node || oldNode);
    return node || oldNode;
  }
  function handleChildren(add, del, target){
    const a = add && add._nv_ && add._nv_.children;
    const d = del && del._nv_ && del._nv_.children;
    const f = k => handleNode(a && a[k], d && d[k], target.childNodes[k], target);
    const keys = [];
    _each(a, (v, k) => f( + k));
    _each(d, (v, k) => (a && a[k]) || keys.push( + k));
    keys.sort((a,b) => b - a).forEach(f);
  };
  Func.Box(function show(source, parent = document.body){
    const i = parent.childNodes.length;
    let node = null;
    source.listenDiff(diff => node = handleNode(diff.add, diff.del, node, parent));
    return source;
  });
  function newNode(tag, parent = document.body){
    return parent.appendChild(document.createElement(tag));
  };
  Func.Html(function show(source, parent = document.body){
    handleNode({_nv_: source.getResult()}, undefined, null, parent);
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
'Div,I,B,Span,H1,H2,H3,H4,H5,H6,P,LI,UL,OL'.split(',').forEach(t =>
  Html.extend(t).by((z, ...cs) => z.tag(t.toLowerCase()).add(...cs))
    .about('Represents HTML <%s> element.', t.toLowerCase()));
Html.extend('A').by((z, url, ...children) => {
  z.tag('a');
  z.add(...children);
  is.function(url)
    ? z.on('click', e => {url(e); e.preventDefault();}).href('#')
    : z.href(url || '#');
}).about('Represents HTML <a> element.');
Html.extend('Img').by((z, src) => z.tag('img').src(src))
  .about('Represents HTML <img> element.');
})();
(function(){"use strict";let autoId = 0;
const Html = nice.Html;
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
    target.id() || target.id('_nn_' + autoId++);
    target.on('domNode', n => node = n);
  }
  target.value.listen(v => node ? node.value = v : setValue(target, v));
  return target;
}
Html.extend('Input')
  .by((z, type) => attachValue(z.tag('input').attributes('type', type || 'text')));
Html.extend('Button')
  .by((z, text, action) => {
    z.tag('input').attributes({type: 'button', value: text}).on('click', action);
  });
Html.extend('Textarea')
  .by((z, value) => {
    z.tag('textarea');
    attachValue(z, (t, v) => t.children.removeAll().push(v));
    z.value(value ? '' + value : "");
  });
Html.extend('Submit').by((z, text) =>
    z.tag('input').attributes({type: 'submit', value: text}));
Html.extend('Checkbox')
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
      z.id() || z.id('_nn_' + autoId++);
      z.on('domNode', n => node = n);
    }
    z.checked.listen(v => node ? node.checked = v : z.attributes('checked', v));
  });
})();;})();