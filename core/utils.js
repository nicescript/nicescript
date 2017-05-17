var formatRe = /(%([jds%]))/g;
var formatMap = { s: String, d: Number, j: JSON.stringify };

nice.orderedStringify = function (o) {
  return !nice.is.Object(o)
    ? JSON.stringify(o)
    : Array.isArray(o)
      ? '[' + o.map(v => nice.orderedStringify(v)).join(',') + ']'
      : '{' + nice.reduceTo((a, key) => {
          a.push("\"" + key + '\":' + nice.orderedStringify(o[key]));
        }, [], Object.keys(o).sort()).join(',') + '}';
};


nice.objDiggDefault = (o, ...a) => {
  var v = a.pop(),
      i = 0,
      l = a.length;
  for(;i<l;){
    if(!o || typeof(o)!=='object')
        return;
    if(!o[a[i]])
      o[a[i]] = i==l-1 ? v : {};
    o = o[a[i++]];
  };
  return o;
};


nice.objDiggMin = (o, ...args) => {
  var n = args.pop();
  var k = args.pop();
  args.push({});
  var tale = nice.objDiggDefault(o, ...args);
  (!tale[k] || tale[k] > n) && (tale[k] = n);
  return tale[k];
};


nice.objDiggMax = (o, ...args) => {
  var n = args.pop();
  var k = args.pop();
  args.push({});
  var tale = nice.objDiggDefault(o, ...args);
  (!tale[k] || tale[k] < n) && (tale[k] = n);
  return tale[k];
};


nice.objMax = (...oo) => {
  return nice.reduceTo((res, o) => {
    nice.each((v, k) => {
      var old = res[k] || 0;
      old < v && (res[k] = v);
    }, o);
  }, {}, oo);
};


nice.reduce = (f, init, o) => {
  nice.each(((v, k) => init = f(init, v, k, o)), o);
  return init;
};


nice.reduceTo = (f, item, o) => {
  nice.each(((v, k) => f(item, v, k, o)), o);
  return item;
};


nice.objByKeys = (keys, value = 1) => {
  var res = {};
  keys.forEach(k => res[k] = value)
  return res;
};


nice.findKey = nice.curry((f, o) => {
  var res;
  nice.each((v, k) => {
    if(f(v, k)){
      res = k;
      return false;
    }
  }, o);
  return res;
});

function eraseProperty(o, k) {
  Object.defineProperty(o, k, {writable: true}) && delete o[k];
}

nice.stripFunction = f => {
  eraseProperty(f, 'length');
  eraseProperty(f, 'name');
  return f;
};


nice.FunctionsSet = function(o, name, onF){
  Object.defineProperty(o, name, {
    get: function(){
      var res = f => {
        onF && onF(this, f);
        res.items.push(f);
        return this;
      };
      res.items = [];
      res.callEach = (...a) => res.items.forEach(f => f(...a));
      nice.define(this, name, res);
      return res;
    }
  });
};


nice.stringCutBegining = function(c, s){
  return s.indexOf(c) === 0 ? s.substr(c.length) : s;
};


nice.repeat = nice.curry((n, f) => {
  var i = 0;
  while(i < n)  f(i++);
});


nice.seconds = () => Date.now() / 1000 | 0;

nice.minutes = () => Date.now() / 60000 | 0;

nice.new = (proto, o) => Object.setPrototypeOf(o || {}, proto);

nice.each = nice.curry((f, o) => {
  if(!o)
    return;
  if(o.forEach)
    return o.forEach(f);
  for (let i in o)
    if(f(o[i], i, o) === null)
      return;
});

nice.eachEach = nice.curry((f, o) => {
  for (let i in o)
    for (let ii in o[i])
      if(f(o[i][ii], ii, i, o) === null)
        return;
});


var counterValues = {};
nice.define(nice, function counter(name){
  if(!name)
    return counterValues;

  counterValues[name] = counterValues[name] || 0;
  counterValues[name]++;
});

nice.defineAll({
  format: (t, ...a) => {
    t = '' + t;
    a.unshift(t.replace(formatRe, (match, ptn, flag) =>
        flag === '%' ? '%' : formatMap[flag](a.shift())));
    return a.join(' ');
  },

  objectComparer: (o1, o2, add, del) => {
    nice.each((v, k) => {
      o1[k] === v || add(v, k);
    }, o2);
    nice.each((v, k) => {
      o2[k] === v || del(v, k);
    }, o1);
  },

  mapper: f => {
    if(typeof f === 'string'){
      var k = f;
      f = v => typeof v[k] === 'function' ? v[k]() : v[k];
    }
    return f;
  },

  map: nice.curry((f, o) =>
    nice[Array.isArray(o) ? 'mapArray' : 'mapObject'](f, o)
  ),

  mapArray: nice.curry((f, o) => {
    f = nice.mapper(f);

    var res = [];
    for (let k in o)
      res.push(f(o[k], k, o));
    return res;
  }),

  mapObject: nice.curry((f, o) => {
    f = nice.mapper(f);

    var res = {};
    for (let k in o)
      res[k] = f(o[k], k, o);
    return res;
  }),

  mapFilter: nice.curry((f, o) =>
    nice[Array.isArray(o) ? 'mapFilterArray' : 'mapFilterObject'](f, o)
  ),

  mapFilterObject: nice.curry((f, o) => {
    var res = {};
    nice.each((v, k, o) => {
      var v2 = f(v, k, o);
      v2 && (res[k] = v2);
    }, o);
    return res;
  }),

  mapFilterArray: nice.curry((f, o) => {
    var res = [];
    nice.each((v, k, o) => {
      var v2 = f(v, k, o);
      v2 && res.push(v2);
    }, o);
    return res;
  }),

  clone: o => {
    var res;
    if(Array.isArray(o))
      res = [];
    else if(nice.is.Object(o))
      res = {}
    else
      return o;
    for(var i in o)
      res[i] = o[i]
    return res;
  },

  memoize: f => {
    var results = {};
    return (k, ...a) => {
      if(results.hasOwnProperty(k))
        return results[k];
      return results[k] = f(k, ...a);
    };
  },

  once: f => {
    var resultCalled = false;
    var result;
    return function() {
      if(resultCalled)
        return result;

      resultCalled = true;
      return result = f.apply(this);
    };
  },

  pull: nice.curry((item, a) => {
    for(var i in a){
      a[i] === item && a.splice(i, 1);
    }
    return a;
  }),

  pullAll: nice.curry((items, a) => {
    nice.each(v => nice.pull(v, a), items);
    return a
  }),

  includes: nice.curry((t, a) => {
    for(var i in a)
      if(a[i] === t)
        return true;
    return false;
  }),

  throttle: (f, interval) => nice.Function(function(z, ...a){
      var now = Date.now();
      if(now < (z.lastCall() + z.interval()) ){
        if(z.callOnEnd()){
          z.lastQuery(a);
          z.timeout() || z.timeout(setTimeout(() => {
            f.apply(this, z.lastQuery())
            z.lastCall(0);
          }, z.interval()));
        }
        return z.lastResult();
      }
      z.lastCall(now);
      z.lastResult(f.apply(this, a));
      return z.lastResult();
    })
    .Item('f')
    .Item('lastQuery')
    .Number('interval', z => z(interval || 200))
    .Number('lastCall')
    .Number('timeout')
    .Boolean('callOnEnd', z => z(true))
    .Item('lastResult'),
});

nice.defineAll(nice, {
  sortBy: nice.curry( (f, a) => {
    f = nice.mapper(f);

    return nice.map((v, k) => [k, f(v)], a)
      .sort((a, b) => +(a[1] > b[1]) || +(a[1] === b[1]) - 1)
      .map(v => a[v[0]]);
  }),
  filter: nice.curry( (f, o) =>
    nice[Array.isArray(o) ? 'filterArray' : 'filterObject'](f, o)
  ),
  filterArray: nice.curry( (f, o) => {
    var res = [];
    for(var i in o)
      f(o[i], i, o) && res.push(o[i]);
    return res;
  }),
  filterObject: nice.curry( (f, o) => {
    var res = {};
    for(var i in o)
      f(o[i], i, o) && (res[i] = (o[i]));
    return res;
  }),
  assign: nice.curry( (source, target) => {
    nice.each((v, k) => target[k] = v, source);
  })
});