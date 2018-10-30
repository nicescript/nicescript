const formatRe = /(%([jds%]))/g;
const formatMap = { s: String, d: Number, j: JSON.stringify };

defAll(nice, {
  _map: (o, f) => {
    let res = {};
    for(let i in o)
      res[i] = f(o[i]);
    return res;
  },

  _pick: (o, a) => {
    let res = {};
    for(let i in o)
      a.includes(i) && (res[i] = o[i]);
    return res;
  },

  _size: o => {
    let res = 0;
    for(let i in o)
      res++;
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
    Object.defineProperty(o, k, { writable: true, configurable: true }) && delete o[k];
//    delete o[k];
  },

  stripFunction: f => {
    nice.eraseProperty(f, 'length');
    nice.eraseProperty(f, 'name');
    return f;
  },

  stringCutBegining: (c, s) => s.indexOf(c) === 0 ? s.substr(c.length) : s,

  seconds: () => Date.now() / 1000 | 0,

  minutes: () => Date.now() / 60000 | 0,

  isEqual: (a, b) => {
    if(a === b)
      return true;

    if(a && a._isAnything && '_value' in a)
      a = a._value;

    if(b && b._isAnything  && '_value' in b)
      b = b._value;

    return a === b;
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

//  clone: o => {
//    let res;
//    if(is.nice(o)){
//      res = o._type();
//      res._result = nice.clone(o._getResult());
//      return res;
//    } else if(Array.isArray(o)) {
//      res = [];
//    } else if(is.Object(o)) {
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
//    } else if(is.Object(o)) {
//      res = {};
//    } else {
//      return o;
//    }
//    for(let i in o)
//      res[i] = nice.cloneDeep(o[i]);
//    return res;
//  },

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

    reflect.on('signature', s => {
      if(!s.name || s.name[0] === '_')
        return;

      const o = {};

      _each(s, (v, k) => nice.Switch(k)
        .equal('body')()
        .equal('source').use(() => o.source = v.toString())
        .equal('signature').use(() => o[k] = v.map(t => t.type.name))
        .default.use(() => o[k] = v));
      res.functions.push(o);
    });


    reflect.on('Type', t => {
      if(!t.name || t.name[0] === '_')
        return;
      const o = { name: t.name, properties: [] };
      t.hasOwnProperty('description') && (o.description = t.description);
      t.extends && (o.extends = t.super.name);
      res.types[t.name] = o;
    });

    reflect.on('Property', ({ type, name, targetType }) => {
      res.types[targetType.name].properties.push({ name, type: type.name });
    });

    return res;
  },

  fromJson(v){
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
