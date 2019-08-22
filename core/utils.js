const formatRe = /(%([jds%]))/g;
const formatMap = { s: String, d: Number, j: JSON.stringify };
const ID_SYMBOLS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';//Crockford's base 32

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
//    delete o[k];
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
    const a = s.match(/(\d+):(\d+)/);
    return {line: +a[1], symbol: +a[2]};
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

//  clone: o => {
//    let res;
//    if(is.nice(o)){
//      res = o._type();
//      res._result = nice.clone(o._getResult());
//      return res;
//    } else if(Array.isArray(o)) {
//      res = [];
//    } else if(nice.isObject(o)) {
//      res = {};
//    } else {
//      return o;
//    }
//    for(let i in o)
//      res[i] = o[i];
//    return res;
//  },
//
//  cloneDeep: o => {
//    let res;
//    if(o && o._isSingleton){
//      return o;
//    } else if(is.nice(o)) {
//      res = nice._newItem(o._type);
//      res._result = nice.cloneDeep(o._getResult());
//      return res;
//    } else if(Array.isArray(o)) {
//      res = [];
//    } else if(nice.isObject(o)) {
//      res = {};
//    } else {
//      return o;
//    }
//    for(let i in o)
//      res[i] = nice.cloneDeep(o[i]);
//    return res;
//  },

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
