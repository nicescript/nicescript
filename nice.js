;let nice;(function(){let create,Div,NotFound,Func,Test,Switch,expect,is,_each,def,defAll,defGet,Anything,Box,Action,Mapping,Check,reflect,Err,each,_1,_2,_3;
(function(){"use strict";nice = (...a) => {
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
  _createItem(_cellType, type, ...args){
    if(!type._isNiceType)
      throw new Error('Bad type');
    const id = nice._db.push({_cellType}).lastId;
    const item = nice._db.getValue(id, 'cache');
    nice._setType(item, type);
    nice._initItem(item, type, ...args);
    return item;
  },
  _createChild(parent, key, type) {
    
    const item = nice._createItem(type || Anything, type || NotFound);
    item._parent = parent;
    item._name = key;
    return item;
  },
  _initItem(z, type, ...args) {
    type.initChildren(z);
    args === undefined || args.length === 0
      ? type.initBy && type.initBy(z)
      : type.initBy
        ? type.initBy(z, ...args)
        : (args.length && z(...args));
    return z;
  },
  _setType(item, type) {
    const oldType = item._type, db = this._db;
    oldType && oldType.killValue && oldType.killValue(item);
    db.update(item._id, '_type', type);
    Object.setPrototypeOf(item, type.proto);
    type.defaultValueBy
        && db.update(item._id, '_value', type.defaultValueBy());
    return item;
  },
  _assertItem(_parent, _name) {
    const db = this._db;
    let id = db.findKey({_parent, _name});
    if(id === null){
      db.push({ _parent, _name});
      id = db.lastId;
    }
    return db.getValue(id, 'cache');
  },
  _getItem(id) {
    const f = function(...a){
      if(a.length === 0){
        return f._type.itemArgs0(f);
      } else if (a.length === 1){
        f._cellType.itemArgs1(f, a[0]);
      } else {
        f._type.itemArgsN(f, a);
      }
      return this || f;
    };
    f._id = id;
    nice.eraseProperty(f, 'name');
    nice.eraseProperty(f, 'length');
    f._notifing = false;
    Object.setPrototypeOf(f, (nice._db.data._type[id] || Anything).proto);
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
  },
  parseTraceString (s) {
    const a = s.match(/\/(.*):(\d+):(\d+)/);
    return { location: '/' + a[1], line: +a[2], symbol: +a[3]};
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
      if(k in res._cache)
        return res._cache[k];
      return res._cache[k] = f(k, ...a);
    };
    res._cache = {};
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
def(nice, 'reflect', create(EventEmitter));
reflect = nice.reflect;
})();
(function(){"use strict";class ColumnStorage {
  constructor (...columns) {
    this.data = {};
    this.defaultBy = {};
    this.defaults = {};
    this.size = 0;
    this.lastId = 1;
    columns.forEach(c => this.addColumn(c));
  }
  addColumn (cfg) {
    if(typeof cfg === 'string'){
      cfg = { name: cfg };
    }
    const { name, defaultValue, defaultBy } = cfg;
    if(typeof cfg.name !== 'string')
      throw 'Bad column name: ' + name;
    if(blackList.includes(cfg.name))
      throw 'Forbiden column name: ' + name;
    if(this.data.hasOwnProperty(name))
      throw name + ' busy.';
    if(defaultBy !== undefined && defaultValue !== undefined)
      throw `Can't have defaultBy and defaultValue at the same time.`;
    this.defaultBy[name] = defaultBy;
    this.defaults[name] = defaultValue;
    this.data[name] = {};
    return this;
  }
  iterate (f, q) {
    for(let i = 0; i <= this.lastId; i++){
      if((!q || this.match(i, q)) && f(i) === null)
        return;
    }
    return null;
  }
  match (i, q){
    let res = true;
    const data = this.data;
    nice._each(q, (v, k) => {
      if(typeof v === 'function')
        res &= v(data[k][i]);
      if(Array.isArray(v))
        res &= v.includes(data[k][i]);
      else
        res &= data[k][i] === v;
    });
    return res;
  }
  findKey (q) {
    let res = null;
    this.iterate(i => { res = i; return null; }, q);
    return res;
  }
  findKeys (q) {
    const a = [];
    this.iterate(i => a.push(i), q);
    return a;
  }
  getValue (id, column) {
    let value = this.data[column][id];
    if(value === undefined){
      const by = this.defaultBy[column];
      if(by !== undefined){
        value = by(id);
        this.update(id, column, value);
      } else {
        value = this.defaults[column];
      }
    }
    return value;
  }
  hasValue (id, column) {
    return id in  this.data[column];
  }
  getRow (i) {
    if(i >= this.lastId)
      return null;
    const res = {};
    nice._each(this.data, (v, k) => {
      res[k] = v[i];
    });
    return res;
  }
  findRow (q) {
    throw 'TODO:';
  }
  findRows (q) {
    throw 'TODO:';
  }
  push (row) {
    const id = ++this.lastId;
    this.size++;
    _each(row, (v, k) => {
      this.data[k][id] = v;
      this.emit(k, id, v);
    });
    this.emit('insert', id, row);
    return this;
  }
  update (i, k, v) {
    if(typeof k === 'object'){
      _each((_v, _k) => this.update(_k, _v));
      return this;
    }
    if(i > this.lastId)
      throw 'No such id ', i;
    const old = this.data[k][i];
    if(old !== v){
      if(v === null){
        delete this.data[k][i];
      } else {
        this.data[k][i] = v;
      }
      this.emit(k, i, v, old);
      this.emit('update', i, k, v, old);
    }
    return this;
  }
  increment (i, k, v) {
    expect(v).isNumber();
    const old = this.data[k][i] || 0;
    expect(old).isNumber();
    this.update(i, k, old + v);
  }
  restore (data) {
    this.data = data;
    this.size = data[Object.keys(data)[0]].length;
  }
  delete (id) {
    const row = [];
    _each(this.data, (v, k) => {
      if(id in v){
        row.push(k);
        this.emit(k, id, null, v[id]);
      }
    });
    row.forEach(k => {
      delete this.data[k][id];
    });
    this.size--;
    this.emit('delete', id);
  }
}
nice.create(nice.EventEmitter, ColumnStorage.prototype);
const blackList = ['update', 'push', 'insert', 'ready'];
const db = new ColumnStorage(
  '_type',
  '_cellType',
  '_value',
  '_parent',
  '_name',
  '_isHot',
  '_listeners',
  '_itemsListeners',
  '_deepListeners',
  '_by',
  '_args',
  {name: '_size', defaultValue: 0 },
  {name: '_children', defaultBy: () => ({}) },
  {name: '_order', defaultBy: () => [] },
  {name: '_subscriptions', defaultBy: () => [] },
  {name: '_transaction', defaultBy: () => ({ depth:0 }) },
  {name: 'cache', defaultBy: nice._getItem }
);
def(nice, '_db', db);
db.on('_value', (id, value, oldValue) => {
  if(db.hasValue(id, '_isHot') && !db.hasValue(id, '_transaction'))
    return console.log('NO TRANSACTION!');
  const tr = db.getValue(id, '_transaction');
  '_value' in tr || (tr._value = oldValue);
});
db.on('_type', (id, value, oldValue) => {
  if(db.hasValue(id, '_isHot') && !db.hasValue(id, '_transaction'))
    return console.log('NO TRANSACTION!');
  const tr = db.getValue(id, '_transaction');
  '_type' in tr || (tr._type = oldValue);
  if(!oldValue || oldValue === NotFound){
    const pId = db.getValue(id, '_parent');
    db.update(pId, '_size', db.getValue(pId, '_size') + 1);
  } else if (!value || value === NotFound){
    const pId = db.getValue(id, '_parent');
    db.update(pId, '_size', db.getValue(pId, '_size') - 1);
  }
});
db.on('_name', (id, value, oldValue) => {
  const parent = db.getValue(id, '_parent');
  const index = db.getValue(parent, '_children');
  if(oldValue !== null && oldValue !== undefined)
    delete index[oldValue];
  if(value !== null && value !== undefined)
    index[value] = id;
});
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
    ['existing', 'functionType', 'returnValue', 'description']
      .forEach(k => c[k] = o[k] || this[k]);
    return c;
  },
  about (s) { return this.next({ description: s}); },
};
const functionProto = {
  addSignature (body, signature, name){
    const ss = 'signatures' in this
      ? this.signatures
      : this.signatures = new Map();
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
  }
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
function createFunction({ existing, name, body, signature, type, description }){
  if(name && typeof name === 'string' && name[0] !== name[0].toLowerCase())
    throw new Error("Function name should start with lowercase letter. "
          + `"${nice._decapitalize(name)}" not "${name}"`);
  existing = existing || (name && nice[name]);
  if(existing && existing.functionType !== type)
    throw `function '${name}' can't have types '${existing.functionType}' and '${type}' at the same time`;
  const f = existing || createFunctionBody(type);
  
  const types = signature.map(v => v.type);
  body && f.addSignature(body, types, name);
  createMethodBody(types[0], f);
  if(name){
    if(!existing){
      f.name !== name && nice.rewriteProperty(f, 'name', name);
      def(nice, name, f);
      reflect.emitAndSave('function', f);
      type && reflect.emitAndSave(type, f);
    }
    body && reflect.emitAndSave('signature',
      { name, body, signature, type, description, f });
  }
  return f;
};
nice.reflect.on('function', (f) =>
  Anything && !(f.name in Anything.proto) &&
      def(Anything.proto, f.name, function(...a) { return f(this, ...a); }));
function createMethodBody(type, body) {
  if(!type || !type._isNiceType || (body.name in type.proto))
    return;
  const functionType = body.functionType;
  const fistTarget = body.signatures.get(type);
  const {_1,_2,_3,_$} = nice;
  def(type.proto, body.name, function(...args) {
    const fistArg = this;
    for(let a of args){
      if(a === _1 || a === _2 || a === _3 || a === _$)
        return skip(z, [fistArg].concat(args));
    }
    let target = fistTarget;
    const l = args.length;
    let precision = Infinity;
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
        if(found){
          let _t = found.transformations ? found.transformations.length : 0;
          if(_t <= precision || !target.action){
            precision = _t;
            target = found;
          }
        }
      }
    }
    return useBody(target, body.name, body.functionType, fistArg, ...args);
  });
}
function useBody(target, name, functionType, ...args){
  if(!target || !target.action)
    return signatureError(name, args);
  args.forEach(a => a !== undefined && a._isAnything && a._compute());
  try {
    if(target.transformations)
      for(let i in target.transformations)
        args[i] = target.transformations[i](args[i]);
    if(functionType === 'Action'){
      if('transactionStart' in args[0] && args[0]._isHot){
        args[0].transactionStart();
        target.action(...args);
        args[0].transactionEnd();
        return args[0];
      } else {
        target.action(...args);
        return args[0];
      }
    } else if(functionType === 'Mapping'){
      let result = target.action(...args);
      if(!result._isAnything || result._parent){
        result = nice(result);
      } else {
        ;
      }
      result._args = args;
      result._by = name;
      result._isHot = false;
      return result;
    } else {
      return target.action(...args);
    }
  } catch (e) {
    return Err(e);
  }
  return nice.Undefined();
}
function createFunctionBody(functionType){
  const {_1,_2,_3,_$} = nice;
  const z = create(functionProto, (...args) => {
    for(let a of args){
      if(a === _1 || a === _2 || a === _3 || a === _$)
        return skip(z, args);
    }
    const call = new Set();
    const existing = nice.reflect.currentCall;
    if(existing !== undefined) {
      call.parentCall = existing;
    }
    nice.reflect.currentCall = call;
    let target = z.signatures;
    const l = args.length;
    let precision = Infinity;
    for(let i = 0; i < l; i++) {
      if(target && target.size) {
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
        if(found){
          let _t = found.transformations ? found.transformations.length : 0;
          if(_t <= precision || !target.action){
            precision = _t;
            target = found;
          }
        }
      }
    }
    return useBody(target, z.name, functionType, ...args);
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
function signatureError(name, a){
  return Err(`Function ${name} can't handle (${a.map(v =>
      nice.typeOf(v).name).join(',')})`);
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
[1,2,3].forEach(n => nice['_' + n] = a => a[n - 1]);
_1 = nice._1;
_2 = nice._2;
_3 = nice._3;
nice._$ = a => a;
function _skipArgs(init, called) {
  const {_1,_2,_3,_$} = nice;
  const res = [];
  init.forEach(v => v === _$
    ? res.push(...called)
    : res.push(( v===_1 || v === _2 || v === _3) ? v(called) : v));
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
reflect.on('function', f => f.name && !skipedProto[f.name]
  && def(skipedProto, f.name, function(...args){
      this.queue.push({action: f, args});
      return this;
    })
);
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
    defGet(type.proto, name, function() { return f(this); } );
    return this;
  };
});
nice.reflect.on('itemUse', item => {
  const call = nice.reflect.currentCall;
  call === undefined || call.add(item);
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
        '-'.repeat(symbol - 1) + '^' + '-'.repeat(80 - symbol),
         e.message,
         colors.gray(location + ':' + line),
         '-'.repeat(80));
      console.log(a.join('\n'));
    }
    return false;
  }
}
})();
(function(){"use strict";
const proxy = new Proxy({}, {
  get (o, k, receiver) {
    if(k[0] === '_')
      return undefined;
    if(k === 'isPrototypeOf')
      return Object.prototype.isPrototypeOf;
    return k in receiver ? receiver[k] : receiver.get(k);
  },
});
nice.registerType({
  name: 'Anything',
  description: 'Parent type for all types.',
  extend (name, by){
    return nice.Type(name, by).extends(this);
  },
  itemArgs0: z => {
    z._compute();
    return z._value;
  },
  itemArgs1: (z, v) => {
    if (v && v._isAnything) {
      z.transactionStart();
      nice._setType(z, nice.Reference);
      nice._initItem(z, nice.Reference, v);
      z.transactionEnd();
    } else {
      z._cellType.setPrimitive(z, v);
    }
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
      type = nice.Function;
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
      if(type === z._type && !z._isRef)
        return type.setValue(z, v);
      const cellType = z._cellType;
      if(cellType === type || cellType.isPrototypeOf(type)){
        nice._setType(z, type);
        nice._initItem(z, type, v);
        return z;
      }
      const cast = cellType.castFrom[type.name];
      if(cast !== undefined){
        nice._setType(z, type);
        nice._initItem(z, type, cast(v));
        return z
      };
      nice._setType(z, Err);
      nice._initItem(z, type, type.name, ' to ', cellType.name);
      return ;
    }
    throw 'Unknown type';
  },
  itemArgsN: (z, vs) => {
    throw new Error(`${z._type.name} doesn't know what to do with ${vs.length} arguments.`);
  },
  initChildren: () => 0,
  fromValue (_value){
    return Object.assign(this(), { _value });
  },
  setValue (z, value) {
    if(value === z._value)
      return;
    z.transaction(() => nice._db.update(z._id, '_value', value));
  },
  toString () {
    return this.name;
  },
  _isNiceType: true,
  proto: Object.setPrototypeOf({
    _isAnything: true,
    get (key) {
      if(key._isAnything === true)
        key = key();
      return key in this._children
        ? nice._db.getValue(this._children[key], 'cache')
        : nice._createChild(this._id, key, this._type.types[key]);
    },
    get _value() {
      return nice._db.getValue(this._id, '_value');
    },
    get _type() {
      return nice._db.getValue(this._id, '_type');
    },
    get _cellType() {
      return nice._db.getValue(this._id, '_cellType');
    },
    get _parent() {
      return nice._db.getValue(this._id, '_parent');
    },
    set _parent(v) {
      return nice._db.update(this._id, '_parent', v);
      return true;
    },
    get _children() {
      return nice._db.getValue(this._id, '_children');
    },
    get _order() {
      return nice._db.getValue(this._id, '_order');
    },
    get _name() {
      return nice._db.getValue(this._id, '_name');
    },
    set _name(v) {
      return nice._db.update(this._id, '_name', v);
      return true;
    },
    get _size() {
      
      return nice._db.getValue(this._id, '_size');
    },
    
    valueOf () {
      return '_value' in this ? ('' + this._value) : undefined;
    },
    toString () {
      return this._type.name + '('
        + ('_value' in this ? ('' + this._value) : '')
        + ')#' + this._id;
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
    _compute (follow = false){
      if(!this._by || this._isHot)
        return;
      this._doCompute(follow);
    },
    _doCompute (follow = false) {
      let ready = true;
      this._args.forEach(a => {
        if(a._isAnything){
          a._compute();
          ready &= !a.isPending();
          follow && a.listen(this);
        }
      });
      ready
        ? this(nice[this._by](...this._args))
        : nice._setType(this, nice.Pending);
    },
    listen (f, key) {
      key === undefined && (key = f);
      const z = this, db = nice._db;
      let ls = db.getValue(z._id, '_listeners');
      ls === undefined && db.update(z._id, '_listeners', ls = new Map());
      if(ls.has(key))
        return;
      let isHot = false;
      if(f._isAnything){
        isHot = f._isHot;
      } else {
        typeof f === 'function' || (f = objectListener(f));
        isHot = true;
      }
      ls.set(key, f);
      if(isHot){
        this._compute(true);
        this.isPending() || notifyItem(f, this);
      }
    },
    listenItems (f, key) {
      key === undefined && (key = f);
      const db = nice._db;
      let ls = db.getValue(this._id, '_itemsListeners');
      ls === undefined && db.update(this._id, '_itemsListeners', ls = new Map());
      if(ls.has(key))
        return;
      typeof f === 'function' || (f = objectListener(f));
      ls.set(key, f);
      this._compute();
      this._isHot = true;
      this.isPending() || this.each(f);
    },
    get _deepListeners(){
      return nice._db.getValue(this._id, '_deepListeners');
    },
    set _deepListeners(v){
      nice._db.update(this._id, '_deepListeners', v);
      return true;
    },
    listenDeep (f) {
      typeof f === 'function' || (f = objectListener(f));
    },
    get _transaction () {
      return nice._db.getValue(this._id, '_transaction');
    },
    transactionStart (){
      if('_locked' in this)
        throw nice.LOCKED_ERROR;
      this._transaction.depth++;
      return this;
    },
    transactionEnd (){
      const tr = this._transaction;
      if(--tr.depth > 0)
        return false;
      const db = nice._db, z = this;
      tr.depth = 0;
      if('_value' in tr || '_type' in tr){
        const ls = db.getValue(z._id, '_listeners');
        ls && ls.forEach(f => notifyItem(f, z));
        const parentId = z._parent;
        if(parentId !== undefined){
          const ls = db.getValue(parentId, '_itemsListeners');
          ls && ls.forEach(f => f(z));
        }
        let nextParentId = z._parent;
        let path = [];
        
        while(nextParentId !== undefined){
          const ls = db.getValue(nextParentId, '_deepListeners');
          path.unshift(nextParentId);
          ls && ls.forEach(f => f(z, path));
          nextParentId = db.getValue(nextParentId, '_parent');
        }
      }
      delete this._transaction;
    },
    get _isHot() {
      return nice._db.getValue(this._id, '_isHot');
    },
    set _isHot(v) {
      return nice._db.update(this._id, '_isHot', !!v);
    },
     _isResolved (){
      return !this.isPending() && !this.isNeedComputing();
    },
    transaction (f) {
      this.transactionStart();
      f(this);
      this.transactionEnd();
      return this;
    },
    
    _get (k) {
      if(k in this)
        return this[k];
      return undefined;
    },
    
    _set (k, v) {
      this[k] = v;
      return this;
    },
    _has (k) {
      return k in this;
    },
    [Symbol.toPrimitive]() {
      return this.toString();
    }
  }, proxy),
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
  },
  types: {},
  static (...a) {
    const [name, v] = a.length === 2 ? a : [a[0].name, a[0]];
    def(this, name, v);
    return this;
  }
});
Test(function listen(Num){
  const n = Num();
  let res;
  n.listen(v => res = v());
  expect(res).is(0);
  n(1);
  expect(res).is(1);
});
function notifyItem(f, value){
  f._isAnything ? f._doCompute() : f(value);
}
function objectListener(o){
  return v => {
    for(let i in o){
      if(i !== '*' && v['is' + i]())
        return o[i](v);
    }
    o['*'] && o['*'](v);
  };
}
Anything = nice.Anything;
defGet(Anything.proto, function jsValue() { return this._value; });
defGet(Anything.proto, 'switch', function () { return Switch(this); });
nice.ANYTHING = Object.seal(create(Anything.proto, new String('ANYTHING')));
reflect.on('type', t =>
  t.name && Mapping.Anything('to' + t.name, function (...as) {
    nice._setType(this, t);
    nice._initItem(this, t, ...as);
    return this;
  })
);
})();
(function(){"use strict";const { _1, _2, _3, _$ } = nice;
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
  const low = i.toLowerCase();
  Check.about(`Checks if \`v\` is \`${i}\`.`)
    ('is' + i, basicJS.includes(low)
    ? v => typeof v === low
    : v => v && typeof v === 'object' ? v.constructor.name === i : false);
};
reflect.on('type', function defineReducer(type) {
  type.name && Check
    .about('Checks if `v` has type `' + type.name + '`')
    ('is' + type.name, v => v && v._type ? type.proto.isPrototypeOf(v) : false);
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
const _$proto = create(common, {
  check (f) {
    return this.parent.check((...v) => f(v));
  },
  pushCheck (f) {
    this.parent.pushCheck(f);
    return this;
  }
});
defGet(common, '_$', function () {
  return create(_$proto, {parent: this});
});
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
      return this.use(v => f(v, ...a));
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
  for(let a of args){
    if(a === _1 || a === _2 || a === _3 || a === _$)
      return DelayedSwitch(args);
  }
  const f = () => f.done ? f.res : args[0];
  f.args = args;
  f.done = false;
  return create(switchProto, f);
};
reflect.on('Check', f => f.name && !common[f.name]
  && def(common, f.name, function (...a) {
    return this.check((...v) => {
      try {
        return f(...v, ...a);
      } catch (e) {
        return false;
      }
    });
  })
);
reflect.on('Check', f => f.name && !$proto[f.name]
  && def($proto, f.name, function (...a) {
    return this.parent.check((...v) => {
      try {
        return f(v[this.pos], ...a);
      } catch (e) {
        return false;
      }
    });
  })
);
reflect.on('Check', f => f.name && !_$proto[f.name]
  && def(_$proto, f.name, function (...a) {
    return this.parent.check((...v) => {
      try {
        return f(v, ...a);
      } catch (e) {
        return false;
      }
    });
  })
);
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
  return create(delayedProto, f);
};
})();
(function(){"use strict";def(nice, 'expectPrototype', {});
reflect.on('Check', f => {
  f.name && def(nice.expectPrototype, f.name, function(...a){
    const res = f(this.value, ...a);
    if(!res || (res && res._isAnything && res._type === nice.Err)){
      const e = new Error(this.text || ['Expected', this.value, 'to be', f.name, ...a].join(' '));
      e.shift = 1;
      throw e;
    }
    return true;
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
(function(){"use strict";
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
defAll(nice, {
  type: t => {
    nice.isString(t) && (t = nice[t]);
    expect(Anything.isPrototypeOf(t) || Anything === t,
      '' + t + ' is not a type').is(true);
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
    const {_1,_2,_3,_$} = nice;
    const type = (...a) => {
      for(let v of a){
        if(v === _1 || v === _2 || v === _3 || v === _$)
          return nice.skip(type, a);
      }
      const item = nice._createItem(type, type, ...a);
      item._isHot = true;
      return item;
    };
    Object.defineProperty(type, 'name', { writable: true });
    Object.assign(type, config);
    nice.extend(type, 'extends' in config ? nice.type(config.extends) : nice.Obj);
    const cfg = create(config.configProto, nice.Configurator(type, ''));
    config.name && nice.registerType(type);
    return cfg;
  },
});
nice.Check('isType', v => Anything.isPrototypeOf(v));
Test("named type", (Type) => {
  Type('Cat').str('name');
  const cat = nice.Cat().name('Ball');
  expect(cat._type.name).is('Cat');
  expect(cat.name()).is('Ball');
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
(function(){"use strict";nice.Type({
  name: 'Reference',
  extends: 'Anything',
  itemArgs0: z => z._ref(),
  
  initBy: (z, v) => {
    nice._db.update(z._id, '_value', v);
  },
  proto: new Proxy({}, {
    get (o, k, receiver) {
      if(k === '_cellType' || k === '_isHot')
        return nice._db.getValue(receiver._id, k);
      if(k === '_isRef')
        return true;
      
      if(!('_ref' in receiver))
        def(receiver, '_ref', nice._db.getValue(receiver._id, '_value'));
      return receiver._ref[k];
    }
  })
});
Test((Reference, Single, Num) => {
  const a = Num(5);
  const b = Single(2);
  b(a);
  expect(b()).is(5);
  expect(b._type).is(Num);
  expect(b._cellType).is(Single);
  b(3);
  expect(b()).is(3);
  expect(a()).is(5);
  expect(b).isNum();
});
})();
(function(){"use strict";nice.Type({
  name: 'Spy',
  extends: 'Anything',
  defaultValueBy: () => [],
  itemArgs0: call,
  itemArgs1: call,
  itemArgsN: (z, as) => call(z, ...as),
});
function call(spy, ...a){
  spy._value.push(a);
};
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
(function(){"use strict";function s(name, parent, description, ){
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
s('NeedComputing', 'Nothing', 'State of the Box in case it need some computing.');
s('Pending', 'Nothing', 'State of the Box when it awaits input.');
s('Stop', 'Nothing', 'Value used to stop iterationin .each() and similar functions.');
s('NumberError', 'Nothing', 'Wrapper for JS NaN.');
s('AssignmentError', 'Nothing', `Can't assign`);
s('Something', 'Anything', 'Parent type for all non falsy values.');
s('Ok', 'Something', 'Empty positive signal.');
defGet(nice.Nothing.proto, function jsValue() {
  return {[nice.TYPE_KEY]: this._type.name};
});
nice.Nothing.defaultValueBy = () => null;
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
(function(){"use strict";nice.Type({
  name: 'Obj',
  extends: nice.Value,
  itemArgs1: (z, o) => {
    const t = typeof o;
    if( t !== 'object' )
      throw new Error(z._type.name + ` doesn't know what to do with ` + t);
    _each(o, (v, k) => z.set(k, v));
  },
  itemArgsN: (z, os) => _each(os, o => z(o)),
  initChildren (item){
    _each(this.defaultArguments, (as, k) => item.set(k, ...as));
  },
  setValue (z, value) {
    expect(typeof value).is('object');
    z.transaction(() => _each(value, (v, k) => z.set(k, v)));
  },
  killValue (z) {
    _each(z._children, (v, k) => nice._setType(z.get(k), NotFound));
  },
  proto: {
    checkKey (i) {
      if(i._isAnything === true)
        i = i();
      return i;
    },
    _itemsListener (o) {
      const { onRemove, onAdd, onChange } = o;
      return v => {
        if(v._oldValue === undefined){
          onAdd && v.each(onAdd);
          onChange && v.each((_v, k) => onChange(k, _v));
        } else {
          _each(v._oldValue, (c, k) => {
            onRemove && c !== undefined && onRemove(c, k);
            onAdd && k in v._items && onAdd(v._items[k], k);
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
    const o = z.isArray() || z.isArr() ? [] : {};
    z.each((v, k) => o[k] = (v && v._isAnything) ? v.jsValue : v);
    Switch(z._type.name).isString().use(s =>
      ['Arr', 'Obj'].includes(s) || (o[nice.TYPE_KEY] = s));
    return o;
  })
  .ReadOnly('size', z => z._size);
Test("Obj constructor", (Obj) => {
  const a = Obj({a: 3});
  expect(a.get('a')).is(3);
  expect(a.get('q')).isNotFound();
});
Test("Obj deep constructor", Obj => {
  const o = Obj({a: {b: { c:1 }}});
  expect(o.jsValue.a.b.c).is(1);
});
Test("set / get primitive", (Obj) => {
  const a = Obj();
  a.set('a', 1);
  expect(a.get('a')).is(1);
  expect(a.get('q')).isNotFound();
});
Test("set / get with nice.Str as key", (Obj) => {
  const a = Obj();
  a.set('qwe', 1);
  expect(a.get(nice('qwe'))).is(1);
});
Test("set the same and notify", (Obj, Spy) => {
  const o = Obj({'qwe': 2});
  const spy = Spy();
  o.listenItems(() => spy());
  o.set('qwe', 2);
  expect(spy).calledOnce();
});
Test((Obj) => {
  const o = Obj();
  let res;
  let name;
  o.listenItems(v => {
    res = v();
    name = v._name;
  });
  expect(res).is(undefined);
  expect(name).is(undefined);
  o.set('q', 1);
  expect(res).is(1);
});
const F = Func.Obj, M = Mapping.Obj, A = Action.Obj, C = Check.Obj;
Func.Nothing('each', () => 0);
C('has', (o, key) => {
  if(key._isAnything === true)
    key = key();
  const id = o._id;
  const parents = nice._db.data._parent;
  const db = nice._db;
  const names = db.data._name;
  const types = db.data._type;
  for(let i in parents)
    if(parents[i] === id && names[i] === key && types[i] !== NotFound)
      return true;
  return false;
});
A.about(`Set value if it's missing.`)
  (function setDefault (i, ...as) {
    this.has(i) || this.set(i, ...as);
  });
Test((Obj, setDefault) => {
  const o = Obj({a:1});
  o.setDefault('a', 2);
  expect(o.get('a').is(1));
  o.setDefault('z', 2);
  expect(o.get('a').is(2));
});
F(function each(z, f){
  const index = z._children, db = nice._db;
  for(let i in index){
    const item = db.getValue(index[i], 'cache');
    if(!item.isNotFound())
      if(nice.isStop(f(item, i)))
        break;
  }
});
Test("each stop", (each, Obj, Spy) => {
  const spy = Spy();
  Obj({qwe: 1, asd: 2}).each(n => {
    spy(n);
    return nice.Stop();
  });
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
Test((get, Obj, NotFound) => {
  const a = NotFound();
  expect(a.get('q')._id).is(a.get('q')._id);
  const o = Obj({a:1});
  expect(a.get('a').get('q')._id).is(a.get('a').get('q')._id);
  expect(a.get('b').get('q')._id).is(a.get('b').get('q')._id);
});
Test((Obj, NotFound) => {
  const o = Obj({q:1});
  expect(o.get('q')()).is(1);
  expect(o.get('z')).isNotFound();
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
  z.get(_name)(value, ...tale);
});
Test('Set by link', (Obj) => {
  const cfg = Obj({a:2});
  const user = Obj({});
  user.set('q', cfg.get('a'));
  expect(user.get('q')).is(2);
  cfg.set('a', 3);
  expect(user.get('q')).is(3);
  user.set('q', 4);
  cfg.set('a', 5);
  expect(user.get('q')).is(4);
});
A('assign', (z, o) => _each(o, (v, k) => z.set(k, v)));
A.about('Remove element at `i`.')
('remove', (z, key) => {
  const db = nice._db;
  const id = db.findKey({_parent: z._id, _name: key});
  if(id === null)
    return;
  nice._setType(z.get(key), NotFound);
});
Test((remove, Obj) => {
  const o = Obj({ q:1, a:2 });
  expect( o._size ).is(2);
  expect( remove(o, 'q').jsValue ).deepEqual({ a:2 });
  expect( o._size ).is(1);
});
Test("Obj remove deep", (Obj) => {
  const o = Obj({a: {b: { c:1 }}});
  const id = o.get('a').get('b').get('c')._id;
  expect(o.get('a').get('b').get('c')).is(1);
  o.get('a').remove('b');
  expect(o.get('a').get('b')).isNotFound();
  expect(o.get('a').get('b').get('c')).isNotFound();
  expect(o.get('a').get('b').get('c')._id).is(id);
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
M(function map(c, f){
  const res = c._type();
  c.each((v,k) => res.set(k, f(v, k)));
  return res;
});
Test("map", function(Obj, map) {
  const a = Obj({q: 3, a: 2});
  const b = a.map(x => x * 2);
  expect(b._type).is(Obj);
  expect(b.jsValue).deepEqual({q:6, a:4});
  a.set('z', 1);
  expect(b.jsValue).deepEqual({q:6, a:4, z:2});
});
M('filter', (c, f) => c.reduceTo(c._type(), (z, v, k) => f(v,k) && z.set(k, v)));
M('sum', (c, f) => c.reduce((n, v) => n + (f ? f(v) : v), 0));
C.Function(function some(c, f){
  let res = false;
  c.each((v,k) => {
    if(f(res, v, k)){
      res = true;
      return nice.Stop;
    }
  });
  return res;
});
C.about(`Check if every element in colection matches given check`)
  (function every(c, f){
    return !!c.reduce((res, v, k) => res && f(v, k), true)();
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
      return nice.Stop();
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
      return nice.Stop();
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
    if(v.is(t)){
      res = true;
      return nice.Stop();
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
Mapping.Object('reduceTo', (o, res, f) => {
  _each(o, (v, k) => f(res, v, k));
  return res;
});
Test("reduceTo", function(reduceTo, Num) {
  const c = {qwe: 1, ads: 3};
  const a = nice.Num();
  expect(reduceTo(c, a, (z, v) => z.inc(v))).is(a);
  expect(a()).is(4);
});
M('reduceTo', (o, res, f) => {
  o.each((v, k) => f(res, v, k));
  return res;
});
Test("reduceTo", function(Obj, reduceTo, Num) {
  const c = Obj({qwe: 1, ads: 3});
  const a = nice.Num();
  expect(c.reduceTo(a, (z, v) => z.inc(v))).is(a);
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
})();
(function(){"use strict";const PENDING = nice.Pending(), NEED_COMPUTING = nice.NeedComputing();
nice.Type({
  name: 'Box',
  extends: 'Something',
  onCreate: z => {
    z._value = PENDING;
    z._isReactive = false;
  },
  itemArgs0: z => z.compute(),
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
        '_oldValue' in this || (this._oldValue = this._value);
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
      this._isHot && this.compute();
      return this;
    },
    doCompute (){
      this.transactionStart();
      '_oldValue' in this || (this._oldValue = this._value);
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
        this._simpleSetState(Err('Error while doCompute'));
        return this._value;
      } finally {
        this.transactionEnd();
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
  initBy: (z, ...as) => {
    const message = nice.format(...as);
    if(message && message.message){
      message = message.message;
    }
    const a = new Error().stack.split('\n');
    a.splice(0, 4);
    z._type.setValue(z, { message, trace: a.join('\n') });
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
Test((Single, Num) => {
  const x = Single();
  expect(x).isSingle();
  expect(x._cellType).is(Single);
  x(2);
  expect(x).isNum();
  expect(x._cellType).is(Single);
  x('qwe')
  expect(x).isStr();
  expect(x._cellType).is(Single);
});
})();
(function(){"use strict";
nice.Obj.extend({
  name: 'Arr',
  itemArgs1: (z, v) => z.push(v),
  itemArgsN: (z, vs) => vs.forEach( v => z.push(v)),
  killValue (z) {
    _each(z._order, (v, k) => nice._setType(z.get(k), NotFound));
    nice._db.update (z._id, '_order', null);
    this.super.killValue(z);
  },
  proto: {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
    
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
    _itemsListener (o) {
      const { onRemove, onAdd, onChange } = o;
      return v => {
        const old = v._oldValue;
        if(old === undefined){
          onAdd && v.each(onAdd);
          onChange && v.each((_v, k) => onChange(k, _v));
        } else {
          const l = Math.max(...Object.keys(old || {}), ...Object.keys(v._newValue || {}));
          let i = 0;
          while(i <= l){
            let change = true;
            if (onRemove) {
              i in old && onRemove(old[i], i), change &= true;
            }
            if(onAdd) {
              if(v._newValue && i in v._newValue){
                onAdd(v._newValue[i], i), change &= true;
              }
            }
            if(onChange && change) {
              onChange(v._newValue[i], old[i], i);
            }
            i++;
          }
        }
      };
    }
  }
}).about('Ordered list of elements.')
  .ReadOnly('size', z => z._size)
  .Action(function push(z, ...a) {
    a.forEach(v => z.insertAt(z._size, v));
  });
Test("constructor", function(Arr) {
  let a = Arr(1, 5, 8);
  a(9);
  expect(a.get(1)).is(5);
  expect(a.get(3)).is(9);
  expect(a.get(4).isNotFound()).is(true);
});
Test("setter", function(Arr) {
  const a = Arr();
  a(2)(3, 4)(5);
  expect(a.get(1)).is(3);
  expect(a.get(3)).is(5);
});
Test("push", (Arr, push) => {
  const a = Arr(1, 4);
  a.push(2, 1);
  expect(a.jsValue).deepEqual([1, 4, 2, 1]);
});
Test((Arr) => {
  const a = nice.Something()([1,2]);
  expect(a._type).is(Arr);
  expect(a.jsValue).deepEqual([1, 2]);
});
const Arr = nice.Arr;
const F = Func.Arr, M = Mapping.Arr, A = Action.Arr;
A('set', (a, key, value, ...tale) => {
  const k = a.checkKey(key);
  if(value === undefined)
    throw `Can't set ${key} to undefined`;
  const order = a._order;
  if(k > order.length)
    throw `Can't set ${key} array has only ${order.length} elements`;
  if(value === null)
    return a.remove(k);
  const item = a.get(k);
  item(value, ...tale);
  order[k] = item._id;
});
F('each', (a, f) => {
  const o = a._order, db = nice._db;
  for(let i = 0; i < o.length; i++)
    if(nice.isStop(f(db.getValue(o[i], 'cache'), i)))
      break;
  return a;
});
Test("each", (Arr, Spy) => {
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
M('join', (a, s = '') => a.jsValue.join(s));
Test((Arr, join) => {
  const a = Arr(1,2);
  expect(a.join(' ')).is('1 2');
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
  (k === -1 || k === undefined) || z.removeAt(k);
});
A.Number('insertAt', (z, i, v) => {
  i = +i;
  z.each((c, k) => k > i && (c._name = k + 1));
  const item = z.get(i);
  z._order.splice(i, 0, item._id);
  item(v);
});
A('insertAfter', (z, target, v) => {
  z.each((v, k) => v.is(target) && z.insertAt(+k+1, v) && nice.Stop());
});
A('remove', (z, k) => {
  k = +k;
  const db = nice._db, order = z._order;
  if(k >= order.length)
    return;
  nice._setType(z.get(k), NotFound);
  _each(z._children, (v, _k) => {
    _k > k && db.update(v, '_name', db.getValue(v, '_name') - 1);
  });
  order.splice(k, 1);
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
    z.each((v, k) => v.is(target) && z.remove(k));
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
  const o = a._order, db = nice._db;
  for(let i = o.length - 1; i >= 0; i--)
    if(nice.isStop(f(db.getValue(o[i], 'cache'), i)))
      break;
  return a;
});
Test("eachRight", () => {
  let a = Arr(1, 2);
  let b = [];
  a.eachRight(v => b.push(v()));
  expect(b).deepEqual([2, 1]);
});
A(function fill(z, v, start = 0, end){
  const l = z._size;
  end === undefined && (end = l);
  start < 0 && (start += l);
  end < 0 && (end += l);
  for(let i = start; i < end; i++)
    z.insertAt(i, v);
});
M.Function(function map(a, f){
  return a.reduceTo(Arr(), (z, v, k) => z.push(f(v, k)));
});
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
  return a.get(Math.random() * a._size | 0);
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
M.about('Creates new array with `separator` between elments.')
(function intersperse(a, separator) {
  const res = Arr();
  const last = a.size - 1;
  a.each((v, k) => res.push(v) && (k < last && res.push(separator)));
  return res;
});
M.about('Returns last element of `a`.')
  (function last(a) {
  return a.get(a._size - 1);
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
typeof Symbol === 'function' && F(Symbol.iterator, z => {
  let i = 0;
  const l = z._size;
  return { next: () => ({ value: z.get(i), done: ++i > l }) };
});
})();
(function(){"use strict";nice.Single.extend({
  name: 'Num',
  defaultValueBy: () => 0,
  help: 'Wrapper for JS number.'
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
M.Function('times', (n, f) => {
  let i = 0;
  const res = [];
  while(i < n) res.push(f(i++));
  return res;
});
Test(times => {
  expect(times(2, () => 1).jsValue).deepEqual([1,1]);
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
  defaultValueBy: () => '',
  itemArgs1: (z, s) => {
    if(s && s._isAnything)
       s = s();
    if(!allowedSources[typeof s])
      throw `Can't create Str from ${typeof s}`;
    z._type.setValue(z, '' + s);
  },
  itemArgsN: (z, a) => z._type.setValue(z, nice.format(...a)),
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
(function(){"use strict";
})();
(function(){"use strict";nice.Single.extend({
  name: 'Bool',
  defaultValueBy: () => false,
  itemArgs1: (z, v) => z._type.setValue(z, !!v),
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
    return n >= z.start() && n <= z.end();
  });
Func.Number.Range(function within(v, r){
  return v >= r.start() && v <= r.end();
});
})();
(function(){"use strict";
let autoId = 0;
const AUTO_PREFIX = '_nn_'
nice.Type({
  name: 'Html',
  itemArgs1: (z, ...as) => z.add(...as)
}, (z, tag) => tag && z.tag(tag))
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
    const s = z.attributes.get('className').or('');
    if(s.indexOf(AUTO_PREFIX) < 0){
      const c = AUTO_PREFIX + autoId++;
      z.attributes.set('className', s + ' ' + c);
    }
    return z;
  })
  .Method.about('Adds values to className attribute.')('class', (z, ...vs) => {
    const current = z.attributes.get('className').or('');
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
      if(c.isErr())
        return z.children(c.toString());
      if(!c || !nice.isAnything(c))
        return z.children('Bad child: ' + c);
      c.up = z;
      c._up_ = z;
      z.children.push(c);
    });
  });
const Html = nice.Html;
Test('Simple html element with string child', Html => {
  expect(Html().add('qwe').html).is('<div>qwe</div>');
});
Test("insert Html", (Html) => {
  const div = Html('li');
  const div2 = Html('b');
  div.add(div2);
  
});
Test("Html tag name", (Html) => {
  expect(Html('li').html).is('<li></li>');
});
Test("Html class name", (Html) => {
  expect(Html().class('qwe').html).is('<div class="qwe"></div>');
});
Test("Html children array", (Div) => {
  expect(Div(['qwe', 'asd']).html).is('<div>qweasd</div>');
});
Test("item child", function(Num, Html) {
  const n = Num(5);
  const n2 = Num(7);
  const div = Html().add(n, n2);
  expect(div.html).is('<div>57</div>');
  n2(8);
  
});
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
  if(this.cssSelectors.has(s))
    return this.cssSelectors.get(s);
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
  _t in Html.proto || def(Html.proto, _t, function (...a){
    return this.add(type(...a));
  });
}
reflect.on('extension', ({child, parent}) => {
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
        .isBox().use(b => s.set(property, b))
        .isObject().use(o => _each(o, (v, k) => s.set(property + nice.capitalize(k), v)))
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
nice.ReadOnly.Box('html', ({_value}) => _value && _html(_value));
nice.ReadOnly.Single('html', z => _html(z._value));
nice.ReadOnly.Arr('html', z => z.reduceTo([], (a, v) => a.push(_html(v)))
    .map(_html).join(''));
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
  z.children.each(c => body += c._isAnything ? c.html : nice.htmlEscape(c));
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
  const killAllRules = v => {
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
  Func.Html('attachNode', (e, node) => {
    e._shownNodes = e._shownNodes || new WeakMap();
    const ss = [];
    ss.push(e.children.listenItems(v => v.isNothing()
        ? removeNode(node.childNodes[k], v._name)
        : nice.show(v, node, v._name)
      ),
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
    node && node.parentNode.removeChild(node);
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
      ? constructors[type](z, a, as[0] || ((t === 'Li' || t === 'Ol') ? nice.Li(nice._1) : (v => v)))
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
  Arr: (z, a, f) => a.listenItems({
    NotFound: v => z.children.removeAt(v._name),
    '*': v => z.children.insertAt(v._name, f(v, v._name))
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
  Input.extend('Select', (z, values) => {
    let node;
    z.tag('select');
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
      z._autoId();
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
})();;nice.version = "0.3.3";})();