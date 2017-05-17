module.exports = function(){;var nice = {}, Div;
(function(){"use strict";nice = function(v, ...a){
  if(nice.is.Function(v))
    return nice.item().by(v);

  if(arguments.length === 0 || !v)
    return nice.item();

  if(nice.is.String(v))
    return nice[v](...a);
};


Object.defineProperty(nice, 'define', { value: (target, name, value) => {
  if(value === undefined){
    value = name;
    name = name.name;
  }

  value !== undefined
    ? Object.defineProperty(target, name, { value })
    : nice.error('No value');

  return value;
}});


nice.define(nice, 'defineAll', (target, o) => {
  if(o === undefined){
    o = target;
    target = nice;
  }

  for(var i in o)
    nice.define(target, i, o[i]);

  return target;
});


nice.defineAll(nice, {
  RESOLVED: 0,
  NEED_COMPUTING: 1,
  PENDING: 2,
  NOT_RESOLVED: 'NOT_RESOLVED',
  SOURCE_ERROR: 'Source error',
  LOCKED_ERROR: 'Item is closed for modification',
  valueTypes: {},
  curry: (f, arity = f.length) => {
    return (...a) => a.length >= arity
      ? f(...a)
      : nice.curry((...a2) => f(...a, ...a2), arity - a.length);
  },
  ObjectPrototype: {_typeTitle: 'Object'},
  ClassPrototype: {_typeTitle: 'Class'},
  collectionReducers: {},
  itemTitle: i => i._type || i.name || (i.toString && i.toString()) || ('' + i),

  _initItem: function (item, proto){
    Object.setPrototypeOf(item, proto);
    if(proto._children){
      item._children = {};
      for(var i in proto._children){
        item[i]._by && item._childrenBy();
      }
    }
  },

  Type: proto => {
    nice.is.Object.or.Function(proto)
      || nice.error("Need object for type's prototype");

    nice.ItemPrototype.isPrototypeOf(proto)
      || nice.ItemPrototype === proto
      || Object.setPrototypeOf(proto, nice.ItemPrototype);

    var f = (...a) => {
      var res = proto._creator();
      nice._initItem(res, proto);
      res._constructor(res, ...a);
      return res;
    };

    proto.hasOwnProperty('_typeTitle') && proto._typeTitle
      && nice.defineType(f, proto);

    return f;
  },

  _createItem: (proto, container, name) => {
    proto === undefined && (proto = nice.ItemPrototype);
    nice.is.String(proto) && (proto = nice.valueTypes[proto]);


    var res = proto._creator();

    if(container){
      res._containerKey = name;
      res._container = container;
    }

    nice._initItem(res, proto);
    res._constructor(res);
    return res;
  },

  defineType: function(f, proto){
    var name = proto._typeTitle;

    name[0] !== name[0].toUpperCase() &&
      nice.error('Please start type name with a upper case letter');

    nice.valueTypes[name] = proto;
    nice.define(nice, name, f);
    defineObjectsProperty(proto);
    defineReducer(proto);
    return proto;
  },

  kill: item => {
    nice.each(s => s.cancel(), item._subscriptions);
    nice.each(c => nice.kill(c), item._children);
  }
});


function defineReducer({_typeTitle: title}) {
  if(!title)
    return;
  nice.reduceTo[title] = nice.curry(function(f, collection){
    return nice.reduceTo(f, nice[title](), collection);
  });
  nice.collectionReducers[title] = function(f){
    return this.collection.reduceTo(f, nice[title]());
  };
}


function defineObjectsProperty(proto){
  nice.define(nice.ObjectPrototype, proto._typeTitle, function (name, initBy) {
    _prop(this, proto, name, initBy);
    this.resolve();
    return this;
  });
  nice.define(nice.ClassPrototype, proto._typeTitle, function (name, initBy) {
    _prop(this.itemProto, proto, name, initBy);
    return this;
  });
}


function _prop(target, proto, name, byF){
  if(nice.is.Function(name) && name.name){
    byF = name;
    name = byF.name;
  }
  Object.defineProperty(target, name, { get:
    function(){
      this._children = this._children || {};
      var res = this._children[name];
      if(!res){
        var res = nice._createItem(proto, this, name);
        byF && res.by(byF.bind(this));
        this._children[name] = res;
      }
      return res;
    }
  });
  byF && target[name];
}
})();
(function(){"use strict";var proto = {
  reduce: function(f, init){
    return nice.Item().by(z => {
      var val = nice.clone(init);
      var a = z.use(this);
      a.each((v, k) => val = f(val, v, k));
      return z(val);
    });
  }
};


Object.defineProperty(proto, 'reduceTo', { get: function() {
  var f = (f, item) => item.by(z => {
    item.resetValue();
    z.use(this).each((v, k) => f(item, v, k));
  });

  f.collection = this;

  return nice.new(nice.collectionReducers, f);
}});


['max','min','hypot'].forEach(name => {
  nice.define(proto, name, function (f) {
    return nice.Number().by(z =>
      z(Math[name](...nice.mapArray(f || (v => v), z.use(this)())))
    );
  });
});

nice.define(nice, 'CollectionPrototype', proto);
})();
(function(){"use strict";var formatRe = /(%([jds%]))/g;
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
})();
(function(){"use strict";nice.define(nice, 'is', nice.curry((a, b) => a === b));

var isProto = {
  Item: o => nice.ItemPrototype.isPrototypeOf(o),
  Array: a => Array.isArray(a),
  Integer: n => Number.isInteger(n),
  SaveInteger: n => Number.isSaveInteger(n),
  Finite: n => Number.isFinite(n),
  "NaN": n => Number.isNaN(n),
  Number: i => typeof i === 'number',
  Function: i => typeof i === 'function',
  String: i => typeof i === 'string',
  Object: i => i !== null && typeof i === 'object',
  Boolean: i => typeof i === 'boolean',
  Symbol: i => typeof i === 'symbol',
  Null: i => i === null,
  Undefined: i => i === undefined,
  Of: (v, type) => v && (v.constructor === type || v._typeTitle === type),
  Primitive: i => i !== Object(i),
  Empty: item => {
    if(!item)
      return true;

    if(Array.isArray(item))
      return !item.length;

    if(typeof item === 'object')
      return !Object.keys(item).length;

    return !item;
  }
};


Object.setPrototypeOf(nice.is, isProto);


var orPrototype = nice.mapObject(is => {
  return function(v) { return is(v) || this.lastIs(v) };
}, isProto);


nice.each(lastIs => {
  Object.defineProperty(lastIs, 'or', { get: () => {
    return Object.setPrototypeOf({lastIs: lastIs}, orPrototype);
  } } );
}, nice.is);
})();
(function(){"use strict";nice.define(nice, 'item', (initValue, proto) => {
  var f = nice.ItemPrototype._creator();
  nice._initItem(f, proto || nice.ItemPrototype);
  initValue && f(initValue);
  return f;
});


nice.ItemPrototype = {
  _typeTitle: 'Item',
  _creator: () => {
    var f = function (...a){
      if(a.length === 0){
        f._compute();
        return f._getData();
      }
      f.set(...a);
      return f._container || f;
    };
    return f;
  },

  _default: () => undefined,

  resetValue: function (){
    this.set(this._default());
  },

  _constructor: (z, ...v) => z(...v),

  by: function(f) {
    this.expect(f).toBeFunction();
    this._status = nice.NEED_COMPUTING;
    this._selfStatus = nice.NEED_COMPUTING;
    this._container && this._container._childrenBy();
    this._by = f;
    this._isHot() && this._computeSelf();
    return this;
  },

  _childrenBy: function (){
    this._status = nice.NEED_COMPUTING;
    this._container && this._container._childrenBy();
  },

  _getData: function() {
    if(this.hasOwnProperty('_container')){
      var res = this._container._getData()[this._containerKey];
      return res === undefined ? this._default() : res;
    } else {
      return this.hasOwnProperty('_result') ? this._result : this._default();
    }
  },

  _assertData: function(){
    if(this.hasOwnProperty('_container')){
      var o = this._container._assertData();
      return o[this._containerKey] === undefined
        ? o[this._containerKey] = this._default()
        : o[this._containerKey];
    } else {
      return !this.hasOwnProperty('_result')
        ? this._result = this._default()
        : this._result;
    }
  },

  _setData: function(data){
    this.hasOwnProperty('_container')
      ? this._container._assertData()[this._containerKey] = data
      : this._result = data;
  },

  setBy: function(f){
    this._by = function(){
      this.replace(f(this));
    };
    return this;
  },

  use: function (source) {
    var subscription = nice.subscription(source, this).skip(1);
    var ready = subscription.resolve();
    subscription.skip(0);

    if(source._error){
      this.transactionRollback();
      this._sourceError(source._error);
      throw nice.NOT_RESOLVED;
    }

    if(ready)
      return source;
    else
      throw nice.NOT_RESOLVED;
  },

  useOnce: function(source){
    if(source._error){
      this.transactionRollback();
      this._sourceError(source._error);
    }

    if(source._compute())
      return source;

    var subscription = nice.subscription(source, this).skip(1).onlyOnce();
    subscription.resolve()
    subscription.skip(0);
    throw nice.NOT_RESOLVED;
  },

  try: function (source) {
    var subscription = nice.subscription(source, this).skip(1)
        .onError(() => this._computeSelf());
    var ready = subscription.resolve();
    subscription.skip(0);

    if(ready)
      return source;
    else
      throw nice.NOT_RESOLVED;
  },

  tryOnce: function (source) {
    if(source._compute())
      return source;

    var subscription = nice.subscription(source, this).onlyOnce()
        .onError(() => this._computeSelf());
    setTimeout(() => {
      subscription.resolve();
    }, 0);
    throw nice.NOT_RESOLVED;
  },

  _computeSelf: function (){
    if(!this._by)
      return true;

    this._selfStatus = nice.PENDING;
    this.transactionStart();
    this._oldSubscriptions = this._subscriptions;
    this._subscriptions = [];
    try {
      this._by(this);
    } catch (e) {
      if(e === nice.NOT_RESOLVED)
        return;
      console.log('ups', e);
      this.error(e);
      return;
    } finally {
      nice.each(
        s => nice.includes(s, this._subscriptions) || nice.unsubscribe(s, this),
        this._oldSubscriptions
      );
      this._oldSubscriptions = undefined;

      if(this._error)
        return true;

      return this.transactionEnd();
    }
  },

  _compute: function(){
    if(this._status !== nice.NEED_COMPUTING)
      return !this._status;

    var res = 0;
    if(this._selfStatus === nice.NEED_COMPUTING){
      this._computeSelf() || res++;
    }
    if(this._children)
      for(let i in this._children)
        this._children[i]._compute() || res++;
    return !res;
  },

  extends: function(type){
    nice.is.String(type) && (type = nice.valueTypes[type]);

    if(!nice.ItemPrototype.isPrototypeOf(type))
      return nice.error('Bad prototype to extend');

    Object.setPrototypeOf(this, type);

    return this;
  },

  set: function(...a){
    if(this._locked)
      throw nice.LOCKED_ERROR;

    var value = this._set ? this._set(...a) : a[0];

    if(value === null)
      return this.error('Result is null');

    if(value === this._getData() && !this._selfStatus)
      return value;

    this._setData(value);
    this.resolve();

    return value;
  },

  _isResolved: function (){
    if(this._selfStatus)
      return false;

    var res = 0;
    if(this._children){
      for(let i in this._children)
        this._children[i]._isResolved() || res++;
    }
    res || (this._status = nice.RESOLVED);
    return !res;
  },

  resolve: function(){
    delete this._error;
    this._selfStatus = nice.RESOLVED;
    this._notify();
  },

  _notify: function (source){
    if(source === this)
      return nice.error('Item trying to notify itself.');

    if(source && source.error())
      this._childError(source);

    if(this._transactionStart)
      return this._transactionStart++;

    if(this._isResolved()){
      this._subscribers && this._subscribers.forEach(s => s.notify());
      this._container && this._container._notify(source || this);
    }
  },

  is: function (v) {
    return this() === v;
  },

  ifThen: function(...a){
    return this()
      ? nice.is.Function(a[0]) ? a[0](this) : a[0]
      : nice.is.Function(a[1]) ? a[1](this) : a[1];
  },

  isAnyOf: function (...a) {
    return a.includes(this());
  },

  listenBy: function (target, onError) {
    var subscription = nice.subscription(this, target);
    onError && subscription.onError(onError);
    subscription.resolve();
    return this;
  },

  listenTo: function (source, onError) {
    var subscription = nice.subscription(source, this);
    onError && subscription.onError(onError);
    subscription.resolve();
    return this;
  },

  _isHot: function (){
    return (this._subscribers && this._subscribers.length)
      || (this.hasOwnProperty('onAdd') && this.onAdd.items.length)
      || (this.hasOwnProperty('onRemove') && this.onRemove.items.length)
      || (this._container && this._container._isHot());
  },

  expect: function (value, message){
    return Object.setPrototypeOf(
      {value:value, message: message, item: this},
      nice.expectPrototype
    );
  },

  Constant: function(name, value){
    nice.define(this, name, value);
    return this;
  },

  Method: function(...a){
    var [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
    this.expect(f).toBeFunction();
    Object.defineProperty(this, name, {get: function(){
      return f.bind(this);
    }});
    return this;
  },

  ReadOnly: function(...a){
    var [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
    this.expect(f).toBeFunction();
    Object.defineProperty(this, name, {get: f});
    return this;
  },

  timeout: function(ms, message){
    setTimeout(() => {
      this._isResolved() || this.error('Timeout' || message);
    }, ms);
    return this;
  },

  pending: function(){
    this._status = this._selfStatus = nice.PENDING;
    this._container && this._container._childPending();
    return this;
  },

  _childPending: function(){
    this._status = nice.PENDING;
    this._container && this._container._childPending();
    return this;
  },

  lock: function(){
    this._locked = true;
    return this;
  },

  unlock: function(){
    this._locked = false;
    return this;
  },

  onCancel: function (f) {
    this._onCancel = f;
    return this;
  }
};

nice.FunctionsSet(nice.ItemPrototype, 'onAdd', z => nice.activateItem(z));
nice.FunctionsSet(nice.ItemPrototype, 'onRemove', z => nice.activateItem(z));

nice.define(nice.ItemPrototype, 'onEach', function (f){
  this.each(f);
  this.onAdd(f);
  return this;
});

nice.new(nice.ItemPrototype, nice.CollectionPrototype);
nice.Type(nice.new(Function.prototype, nice.ItemPrototype));
})();
(function(){"use strict";const RESOLVING = 'RESOLVING';
const RESOLVED = 'RESOLVED';
const CANCELED = 'CANCELED';
const OK = 0;

var proto = {
  notify: function(){
    var {target, source} = this;
    if(this._skip-- > 0)
      return;

    if(this.status === CANCELED)
      return;
    this.status = OK;

    let error = source.error();
    if(error){
      if(this._onError)
        return this._onError(error);

      if(target._sourceError) {
        target._sourceError(error);
      } else if(target.length === 2) {
        target(null, error) === false && this.cancel();
      } else {
        target(source) === false && this.cancel();
      }
    } else {
      if(nice.is.Item(target)){
        target._computeSelf();
      } else {
        target(source) === false && this.cancel();
      }
    }
    this._once && this.cancel();
  },

  _skip: 0,

  skip: function(n = 1){
    nice.expect(n).toBeFinite();
    this._skip = n;
    return this;
  },

  onError: function(f){
    this._onError = f;
    return this;
  },

  onlyOnce: function(){
    this._once = true;
    return this;
  },

  resolve: function(){
    var {source} = this;

    if(source._isResolved()){
      this.notify();
      return true;
    }

    if(source._compute){
      return source._compute();
    } else {
      nice.error('Bad source' + source);
    }
  },

  activate: function () {
    var {target, source} = this;
    var subscribers = source._subscribers;

    this.active = true;

    if(subscribers && subscribers.length){
      subscribers.find(i => i.target === target) || subscribers.push(this);
    } else {
      source._subscribers = source._subscribers || [];
      source._subscribers.push(this);
      nice.activateItem(source);
    }
  },

  cancel: function () {
    var {source} = this;
    this.active = false;
    this.status = CANCELED;
    nice.pull(this, source._subscribers);
    nice.haltItem(source);
  }
};


nice.defineAll({
  subscription: (source, target) => {
    var subscription;

    nice.expect(nice.is.Function(source._compute), 'Bad source').toBe();
    nice.expect(nice.is.Item(target) || nice.is.Function(target), 'Bad target').toBe();

    target._subscriptions = target._subscriptions || [];
    subscription = target._subscriptions.find(i => i.source === source);

    if(!subscription){
      subscription = Object.setPrototypeOf({source, target}, proto);
      target._subscriptions.push(subscription);
      (!target._isHot || target._isHot()) && subscription.activate();
    }
    return subscription;
  },

  unsubscribe: (source, target) => {
    var subscription;

    subscription = source._subscribers
        && source._subscribers.find(i => i.target === target);
    subscription && subscription.cancel();
  },

  cancel: target => {
    target._onCancel && target._onCancel(target);
    target && nice.each(s => s.cancel(), target._subscriptions);
  },

  listen: (...a) => nice.subscription(...a).resolve(),

  listenOnce: (...a) => nice.subscription(...a).onlyOnce().resolve(),

  activateItem: item => nice.each(s => s.activate(), item._subscriptions),

  haltItem: item => {
    nice.is.Empty(item._subscribers)
      && nice.each(s => s.cancel(), item._subscriptions);
  }
});
})();
(function(){"use strict";nice.defineAll(nice.ItemPrototype, {
  transactionStart: function(){
    this._transactionDepth = this._transactionDepth || 0;
    this._transactionDepth++;
    this._transactionResult = nice.clone(this._getData());
    this._transactionStart = 1;
    return this;
  },

  transactionEnd: function(){
    if(--this._transactionDepth > 0)
      return;

    this._notifyItems();
    delete this._transactionResult;
    var haveSome = this._transactionStart > 1;
    delete this._transactionStart;
    if(haveSome){
      this.resolve();
      var off = this._subscriptions && this._subscriptions.some(s => !s.active);
      this._status = this._selfStatus = off ? nice.NEED_COMPUTING : nice.RESOLVED;
    } else if(this._selfStatus === nice.PENDING){
      this._selfStatus = nice.NEED_COMPUTING;
    }
    return haveSome;
  },

  _notifyItems: function (){
    if(!this._compareItems)
      return;

    if(!this.hasOwnProperty('onAdd') && !this.hasOwnProperty('onRemove'))
      return;

    var old = this._transactionResult;
    this._compareItems(
      old,
      this._getData(),
      (v, k) => {
        this.hasOwnProperty('onAdd') && this.onAdd.callEach(v, k);
      },
      (v, k) => {
        this.hasOwnProperty('onRemove') && this.onRemove.callEach(v, k);
      });
  },

  transactionRollback: function(){
    this._transactionStart && this._setData(this._transactionResult);
    delete this._transactionResult;
    this._transactionDepth = 0;
    delete this._transactionStart;
  },

  transactionEach: function (item, f){
    if(!f){
      f = item;
      item = undefined;
    };
    this.transactionStart();
    item ? nice.each(f, item) : this.each(f);
    this.transactionEnd();
    return this;
  }
});
})();
(function(){"use strict";nice.defineAll(nice, {
  ErrorPrototype: {
    isError: true,
  },

  createError: (item, ...a) => nice.new(nice.ErrorPrototype, {
    targets: item,
    message: nice.format(...a)
  }),

  error: (...a) => {
    var message = a[0].message || nice.format(...a);
    console.log('Error happened');
    a[0].trace && (message += a[0].trace
        .map(i => 'at ' + nice.itemTitle(i))
        .join('\n'));
    console.log(message);
    console.trace();
    throw new Error(message);
  }
});


nice.defineAll(nice.ItemPrototype, {
  _sourceError: function(error){
    this.error(nice.new(nice.ErrorPrototype, {
      target: error,
      message: error.message
    }));
  },

  _childError: function(source){
    var error = source.error();
    this.error(nice.new(nice.ErrorPrototype, {
      target: error,
      path: source._containerKey,
      message: error.message
    }));
  },

  error: function(...a){
    if(a.length === 0)
      return this._error;

    if(a[0] === null){
      delete this._error;
      return this;
    }

    var e = a[0] || 'Unknown error';

    this._error = e.isError
      ? e
      : nice.createError(this, e);

    this.transactionRollback();
    this._selfStatus = this._status = nice.RESOLVED;
    this._notify();
  }
});

})();
(function(){"use strict";nice.StringPrototype = {
  _typeTitle: 'String',
  _set: (...a) => a[0] ? nice.format(...a) : '',
  _default: () => ''
};

var whiteSpaces = ' \f\n\r\t\v\u00A0\u2028\u2029';
var stringUtils = {
  trimLeft: (s, a = whiteSpaces) => {
    var i = 0;
    while(a.indexOf(s[i]) >= 0) i++;
    return s.substr(i);
  },

  trimRight: (s, a = whiteSpaces) => {
    var i = s.length - 1;
    while(a.indexOf(s[i]) >= 0) i--;
    return s.substr(0, i + 1);
  },

  trim: (s, a) => nice.trimRight(nice.trimLeft(s, a), a),

  truncate: function (s, n, tale) {
    return s.length > n
      ? s.substr(0, n) + (tale || '')
      : s;
  }
};

nice.each((v, k) => {
  nice.StringPrototype[k] = function(...a){
    return nice.String().by(z => z(v(this(), ...a)));
  };
}, stringUtils);

nice.defineAll(nice, stringUtils);


nice.Type(nice.StringPrototype);

})();
(function(){"use strict";nice.define(nice, 'BooleanPrototype', {
  _typeTitle: 'Boolean',
  _set: n => !!n,
  _default: () => false,

  on: function () { return this(true); },
  off: function () { return this(false); },
  switch: function () { return this(!this()); },

  and: function (v) { return nice.Boolean().by(z => z(this() && v)); },
  or: function (v) { return nice.Boolean().by(z => z(this() || v)); },
  xor: function (v) { return nice.Boolean().by(z => z(this() ^ !!v)); }
});

nice.Type(nice.BooleanPrototype);

})();
(function(){"use strict";nice.NumberPrototype = {
  _typeTitle: 'Number',
  _set: n => + n,
  _default: () => 0,

  sum: function (n) { return nice.Number().by(z => z(this() + n)); },
  diff: function (n) { return nice.Number().by(z => z(this() - n)); },
  product: function (n) { return nice.Number().by(z => z(this() * n)); },
  fraction: function (n) { return nice.Number().by(z => z(this() / n)); },
  reminder: function (n) { return nice.Number().by(z => z(this()  % n)); },

  inc: function (n = 1) { this(this() + n); return this.obj; },
  dec: function (n = 1) { this(this() - n); return this.obj; },
  divide: function (n) { this(this() / n); return this.obj; },
  multiply: function (n) { this(this() * n); return this.obj; },
  negate: function () { this(-this()); return this.obj; },
  setMax: function (n) { n > this() && this(n); return this.obj; },
  setMin: function (n) { n < this() && this(n); return this.obj; },

  between: function (a, b) { return this() > a && this() < b; }
};

"acos,asin,atan,ceil,clz32,floor,fround,imul,max,min,round,sqrt,trunc,abs,exp,log,atan2,pow,sign,asinh,acosh,atanh,hypot,cbrt,cos,sin,tan,sinh,cosh,tanh,log10,log2,log1p,expm1"
  .split(',').forEach(k => {
    nice.NumberPrototype[k] = function(...a){
      return nice.Number().by(z => z(Math[k](this(), ...a)));
    };
  });


nice.Type(nice.NumberPrototype);

})();
(function(){"use strict";nice.ArrayPrototype = {
  _typeTitle: 'Array',

  _creator: () => {
    var f = function (...a){
      if(a.length === 0){
        f._compute();
        return f._getData();
      }

      f.set(...a);
      return f._container || f;
    };
    return f;
  },

  _default: () => [],

  push: function(...a){
    this.transactionStart();
    a.forEach(item => this.addAt(item));
    this.transactionEnd();
    return this;
  },

  set: function(...a){
    var toAdd = Array.isArray(a[0]) ? a[0] : a;
    this.transactionStart();
    toAdd.forEach(v => this._getData().includes(v) || this.addAt(v));
    this._selfStatus && this._transactionStart++;
    this.transactionEnd();
    return this;
  },

  pull: function (item) {
    var a = this();
    var initSize = a.length;
    nice.pull(item, a);
    a.length !== initSize && this.resolve();
    return this;
  },

  resetValue: function () {
    if(this._getData().length) {
      this.transactionStart();
      this._setData([]);
      this.resolve();
      this.transactionEnd();
    }
    return this;
  },

  callEach: function () {
    var args = arguments;
    this().forEach(function (f) { f.apply(this, args);});
    return this;
  },

  each: function (f) {
    this().forEach(f);
  },

  map: function (f) { return this().map(f); },

  filter: function (f) {
    return nice.Array().by(z => z(...z.use(this)().filter(f)));
  },

  sortBy: function (f) {
    f = f || (v => v);
    return nice.Array().by(z => z(nice.sortBy(f, z.use(this)())));
  },

  size: function () { return this().length; },

  findKey: function(f){ nice.findKey(f, this()); },

  find: function(f){
    for (let v of this._getData())
      if(f(v)) return v;
  },

  replace: function(a){
    this.expect(a, 'Result is not an array').toBeArray();

    if(a === this._getData())
      return a;

    this.transactionStart();
    this._setData(a);
    this._selfStatus && this._transactionStart++;
    this.resolve();
    this.transactionEnd();
    return this;
  },

  addAt: function(value, index){
    if(this._locked)
      throw nice.LOCKED_ERROR;
    var data = this._assertData();
    index === undefined && (index = data.length);
    data.splice(index, 0, value);
    this._selfStatus && this._transactionStart++;
    this.resolve();
  },

  removeAt: function(index){
    if(this._locked)
      throw nice.LOCKED_ERROR;
    var data = this._getData();
    if(!data.length)
      return;
    this.resolve();
  },

  _compareItems: (a1, a2, add, del) => {
    var i1 = 0, i2 = 0, ii2, n;
    var l1 = a1.length, l2 = a2.length;
    for(;i1 < l1; i1++){
      if(a1[i1] === a2[i2]){
        i2++;
      } else {
        for(n = i2, ii2 = undefined; n < l2; n++){
          if(a2[n] === a1[i1]){
            ii2 = n;
            break;
          }
        }
        if(ii2 === undefined){
          del(a1[i1], i2);
        } else {
          while(i2 < ii2) add(a2[i2], i2++);
          i2++;
        }
      }
    }
    while(i2 < l2) add(a2[i2], i2++);
  },

  of: function(type){
    this._itemType = type;
    return this;
  },

  count: function(f){
    return nice.Number().by(z => {
      var i = 0;
      z.use(this).each((v, k) => f(v, k) && i++);
      z(i);
    });
  },
};

nice.Type(nice.new(nice.CollectionPrototype, nice.ArrayPrototype));

})();
(function(){"use strict";nice.MapPrototype = {
  _typeTitle: 'Map',

  _creator: () => {
    var f = function (...a){
      if(a.length === 0){
        f._compute();
        return f._getData();
      }

      var v = a[0];
      if(arguments.length === 1 && v !== undefined && !nice.is.Object(v))
        return f.get(v);

      if(!nice.is.Object(v)){
        var o = {};
        o[v] = a[1];
        v = o;
      }
      f.assign(v);
      return f._container || f;
    };
    f.size = nice.Number();
    return f;
  },

  _default: () => { return {}; },

  resetValue: function () {
    return this.transactionEach((v, k) => this.delete(k));
  },

  has: function (k) {
    return !!this(k);
  },

  assign: function (o) {
    this.transactionStart();
    nice.each((v, k) => this.set(k, v), o);
    this._selfStatus && this._transactionStart++;
    this.transactionEnd();
  },

  replace: function(o){
    this.expect(o, 'Not an object povided for replace').toBeObject();

    if(o === this._getData())
      return o;

    this.transactionStart();
    this._setData(o);
    this._selfStatus && this._transactionStart++;
    this.resolve();
    this.transactionEnd();
    return this;
  },

  get: function(k){
    if(!this._itemType)
      return this._getData()[k];

    this._children = this._children || {};

    if(this._children.hasOwnProperty(k))
      return this._children[k];

    this.size.inc();
    return this._children[k] = nice._createItem(this._itemType, this, k);
  },

  set: function(k, v){
    if(this._itemType){
      this.get(k)(v);
    } else {
      var old = this._getData()[k];
      if(old === v)
        return;
      old === undefined && this.size.inc();
      this._assertData()[k] = v;
      this.resolve();
    }
  },

  delete: function(k){
    var old = this._getData()[k];
    old !== undefined && this.size.dec();
    delete this._getData()[k];
    this.resolve();
  },

  filter: function (f) {
    return nice.Map().by(z => z.replace(nice.filter(f, z.use(this)())));
  },

  mapFilter: function (f) {
    return nice.Map().by(z => z.replace(nice.mapFilterObject(f, z.use(this)())));
  },

  each: function(f){
    var o = this._getData();
    if(!o) return;
    for (let i in o)
      f(o[i], i, o);
  },

  map: function (f) {
    return nice.Map().by(z => z(nice.map(f, z.use(this)())));
  },


  mapArray: function (f) {
    return nice.Array().by(z => z.replace(nice.mapArray(f, z.use(this)())));
  },


  of: function(type){
    this._itemType = type;
    return this;
  },

  _compareItems: nice.objectComparer
};


Object.defineProperty(nice.MapPrototype, 'values', {get: function(){
  var res = nice.Array();
  this.listenBy(() => {
    res.resetValue();
    this.each(v => res(v));
  });
  return res;
}});


Object.defineProperty(nice.MapPrototype, 'keys', {get: function(){
  var res = nice.Array();
  this.listenBy(() => {
    res.resetValue();
    this.each((v,k) => res(k));
  });
  return res;
}});

nice.MapPrototype.mapObject = nice.MapPrototype.map;

['findKey'].forEach(k => {
  nice.MapPrototype[k] = function(f) { return nice[k](f, this()); }
});

nice.Type(nice.new(nice.CollectionPrototype, nice.MapPrototype));
})();
(function(){"use strict";nice.ObjectPrototype._creator = () => {
  var f = nice.stripFunction(function (...a){
    if(a.length === 0){
      f._compute();
      return f._getData();
    }

    var v = a[0];
    if(a.length === 1 && a[0] === undefined)
      return f._container || f;

    if(a.length === 1 && v && !nice.is.Object(v))
      return f._getData()[v];

    if(!nice.is.Object(v)){
      var o = {};
      o[v] = a[1];
      v = o;
    }
    f._setChildrenValues(v);
    return f._container || f;
  });

  return f;
};


nice.defineAll(nice.ObjectPrototype, {
  _default: () => {return {};},

  _setChildrenValues: function(values){
    this.transactionEach(values, (vv, k) => {
      if(!this[k])
        nice.error('Property', k, 'not found at', this._typeTitle);
      this[k](vv);
    });
  },

  assign: function (o) {
    this.transactionEach(o, (v, k) => this[k](v));
  },

  fillFrom: function(item){
    this.transactionStart();
    var vv = item();
    for(let i in vv)
      this[i] && this[i](vv[i]);
    this.transactionEnd();
    return this;
  },

  resetValue: function (){
    this.transactionStart();
    var data = this._getData();
    for (let i in data)
      this[i].resetValue();
    this.transactionEnd();
  },

  _compareItems: nice.objectComparer
});


nice.Type(nice.ObjectPrototype);
})();
(function(){"use strict";var proto = {
  _typeTitle: 'Function',
  _creator: () => {
    var z = function (...a){
      z.function().call(this, z, ...a);
    };

    return z;
  },
  _constructor: (z, f) => {
    z.Item('function');
    z.function(f);
  },
};


nice.Type(Object.setPrototypeOf(proto, nice.ObjectPrototype));

})();
(function(){"use strict";nice.defineAll(nice.ClassPrototype, {
  _creator: () => {
    var f = nice.stripFunction((...a) => f.instance(...a));
    f.itemProto = nice.Object();
    f.itemProto._typeTitle = '';
    return f;
  },

  _constructor: (z, title) => {
    z.itemProto._typeTitle = title || '';
    z.instance = nice.Type(z.itemProto);
  },

  initBy: function(f){
    this.itemProto._constructor = (z, ...a) => {
      nice.ObjectPrototype._constructor(z);
      f(z, ...a);
    };
    return this;
  },

  itemBy: function(f){
    this.itemProto.by(f);
    return this;
  },

  extends: function(type){
    nice.is.String(type) && (type = nice.class(type));
    Object.setPrototypeOf(this.itemProto, type.itemProto);
    return this;
  }
});


nice.define(nice, 'class', nice.memoize(name => {
  if(!name)
    nice.error('Please provide name for type.');

  return nice.Class(name);
}));


['Method', 'ReadOnly', 'Constant'].forEach(name => {
  nice.define(nice.ClassPrototype, name, function (...a){
    this.itemProto[name](...a);
    return this;
  });
});


nice.Type(nice.ClassPrototype);

})();
(function(){"use strict";nice.define(nice, 'expectPrototype', {
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


nice.each((checker, type) => {
  nice.expectPrototype['toBe' + type] = function(...a){
    if(!checker(this.value, ...a))
      throw this.message || (type + ' expected');
  };
}, nice.is);


nice.define(nice, function expect(value, message){
  return Object.setPrototypeOf(
    {value:value, message: message, item: this},
    nice.expectPrototype
  );
});
})();
(function(){"use strict";nice.block = nice.memoize(function(name, initBy){
  var type = nice.class(name);
  initBy && type.initBy(initBy);
  name === 'Div' || type.extends('Div');
  nice.define(nice.class('Div').itemProto, name, function(...a){
    var res = nice[name](...a);
    this.add(res);
    return res;
  });
  return type;
});


nice.block('Div', (z, tag) => z.tag(tag || 'div'))
  .String('tag')
  .Method(function on(name, f){
    if(name.forEach){
      name.forEach(v => this.on(v, f));
    } else {
      this._on = this._on || {};
      this._on[name] = this._on[name] || [];
      this._on[name].push(f);
      this.pane && this.pane.addEventListener(name, e => f(e, this));
    }
    return this;
  })
  .Map('style')
  .Map('attributes')
  .Array('class')
  .Array('children')
  .ReadOnly(text)
  .ReadOnly(html)
  .Method(dom)
  .Method(function error(error){
    error && this.children.replace([nice.errorPane(error)]);
  })
  .Method(function childrenBy(f){
    this.children.by(z => z.replace(f(z)));
    return this;
  })
  .Method(function show(){
    document.body.appendChild(this.dom());
    return this;
  })
  .Method(function scrollTo(offset = 10){
    var pane = this.pane;
    pane && window.scrollTo(pane.offsetLeft - offset, pane.offsetTop - offset);
    return false;
  })
  .Method(function kill(){
    nice.kill(this);
    this.children.each(nice.kill);
    killNode(this.pane);
  })
  .Method(function add(...children) {
    var z = this;
    children.forEach(c => {
      if(c === undefined)
        return;

      if(nice.is.String(c) || nice.is.Number(c))
        return z.children('' + c);

      if(!c || !nice.is.Item(c) || c === z)
        return z.error('Bad child');

      c.up = z;
      z.children(c);
    });
    return z;
  });


'clear,alignContent,alignItems,alignSelf,alignmentBaseline,all,animation,animationDelay,animationDirection,animationDuration,animationFillMode,animationIterationCount,animationName,animationPlayState,animationTimingFunction,backfaceVisibility,background,backgroundAttachment,backgroundBlendMode,backgroundClip,backgroundColor,backgroundImage,backgroundOrigin,backgroundPosition,backgroundPositionX,backgroundPositionY,backgroundRepeat,backgroundRepeatX,backgroundRepeatY,backgroundSize,baselineShift,border,borderBottom,borderBottomColor,borderBottomLeftRadius,borderBottomRightRadius,borderBottomStyle,borderBottomWidth,borderCollapse,borderColor,borderImage,borderImageOutset,borderImageRepeat,borderImageSlice,borderImageSource,borderImageWidth,borderLeft,borderLeftColor,borderLeftStyle,borderLeftWidth,borderRadius,borderRight,borderRightColor,borderRightStyle,borderRightWidth,borderSpacing,borderStyle,borderTop,borderTopColor,borderTopLeftRadius,borderTopRightRadius,borderTopStyle,borderTopWidth,borderWidth,bottom,boxShadow,boxSizing,breakAfter,breakBefore,breakInside,bufferedRendering,captionSide,clip,clipPath,clipRule,color,colorInterpolation,colorInterpolationFilters,colorRendering,columnCount,columnFill,columnGap,columnRule,columnRuleColor,columnRuleStyle,columnRuleWidth,columnSpan,columnWidth,columns,content,counterIncrement,counterReset,cursor,cx,cy,direction,display,dominantBaseline,emptyCells,fill,fillOpacity,fillRule,filter,flex,flexBasis,flexDirection,flexFlow,flexGrow,flexShrink,flexWrap,float,floodColor,floodOpacity,font,fontFamily,fontFeatureSettings,fontKerning,fontSize,fontStretch,fontStyle,fontVariant,fontVariantLigatures,fontWeight,height,imageRendering,isolation,justifyContent,left,letterSpacing,lightingColor,lineHeight,listStyle,listStyleImage,listStylePosition,listStyleType,margin,marginBottom,marginLeft,marginRight,marginTop,marker,markerEnd,markerMid,markerStart,mask,maskType,maxHeight,maxWidth,maxZoom,minHeight,minWidth,minZoom,mixBlendMode,motion,motionOffset,motionPath,motionRotation,objectFit,objectPosition,opacity,order,orientation,orphans,outline,outlineColor,outlineOffset,outlineStyle,outlineWidth,overflow,overflowWrap,overflowX,overflowY,padding,paddingBottom,paddingLeft,paddingRight,paddingTop,page,pageBreakAfter,pageBreakBefore,pageBreakInside,paintOrder,perspective,perspectiveOrigin,pointerEvents,position,quotes,r,resize,right,rx,ry,shapeImageThreshold,shapeMargin,shapeOutside,shapeRendering,size,speak,stopColor,stopOpacity,stroke,strokeDasharray,strokeDashoffset,strokeLinecap,strokeLinejoin,strokeMiterlimit,strokeOpacity,strokeWidth,tabSize,tableLayout,textAlign,textAlignLast,textAnchor,textCombineUpright,textDecoration,textIndent,textOrientation,textOverflow,textRendering,textShadow,textTransform,top,touchAction,transform,transformOrigin,transformStyle,transition,transitionDelay,transitionDuration,transitionProperty,transitionTimingFunction,unicodeBidi,unicodeRange,userZoom,vectorEffect,verticalAlign,visibility,whiteSpace,widows,width,willChange,wordBreak,wordSpacing,wordWrap,writingMode,x,y,zIndex,zoom'
  .split(',').forEach( property => {
    Object.defineProperty(nice.class('Div').itemProto, property, {
      get: function(){
        return (...a) => {
          nice.is.Object(a[0])
            ? nice.each(
                (v, k) => this.style(property + k[0].toUpperCase() + k.substr(1), v),
                a[0]
              )
            : this.style(property, nice.format(...a));
          return this;
        }
      },
      set: function(){
        this.error('Please use "property(value)" notation to set css value');
      }
    });
    Object.defineProperty(nice.class('Div').itemProto, property + 'By', {
      get: function(){
        return (f) => {
          nice.String().by(f).listenBy(z => this.style(property, z()));
          return this;
        };
      }
    });
  });

'accept,accesskey,action,align,alt,async,autocomplete,autofocus,autoplay,autosave,bgcolor,buffered,challenge,charset,checked,cite,code,codebase,cols,colspan,contenteditable,contextmenu,controls,coords,crossorigin,data,datetime,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,for,form,formaction,headers,hidden,high,href,hreflang,icon,id,integrity,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,manifest,max,maxlength,media,method,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,seamless,selected,shape,sizes,slot,span,spellcheck,src,srcdoc,srclang,srcset,start,step,summary,tabindex,target,title,type,usemap,value,wrap'
  .split(',').forEach( property => {
    nice.class('Div').itemProto[property] ||
      Object.defineProperty(nice.class('Div').itemProto, property, {
        get: function() {
          return (...a) => {
            this.attributes(property, nice.format(...a));
            return this;
          };
        }
      });
  });


function text(){
  var div = this;
  return nice.item().by(z => z((div.actualChildren || div.children)
      .map(v => v.text ? v.text() : nice.htmlEscape(v))
      .join(''))
  );
};


nice.compileStyle = function(div){
  return div.style.map((v, k) => k.replace(/([A-Z])/g, "-$1").toLowerCase() + ':' + v).values().join(';');
};


function html(){
  var div = this;
  return nice.String().by(z => {
    z.tryOnce(div);
    var children = div.actualChildren || div.children;
    var tag = div.tag();
    var a = ['<', tag];

    div.style.size() && div.attributes('style', nice.compileStyle(div));
    div.class.size() && div.attributes('class', div.class().join(' '));

    div.attributes.each((v, k) => a.push(" ", k , '="', v, '"'));

    a.push('>');

    children.each(c => {
      if(nice.is.Item(c)){
        a.push(c.html ? c.html() : c());
      } else {
        a.push(nice.htmlEscape(c));
      }
    });

    a.push('</', tag, '>');
    z(a.join(''));
  });
};


function childToDom(c){
  if(c.nodeType > 0)
    return c;

  if(c.pane)
    return c.pane;

  if(nice.is.String(c) || nice.is.Number(c))
    return document.createTextNode('' + c);

  if(c.dom)
    return c.dom();

  if(nice.is.Item(c)){
    var res = document.createTextNode('');
    c.listenBy(() => res.textContent = '' + c());
    return res;
  }

  nice.error('Bad child', c);
  return document.createTextNode('' + c);
}


nice.block('Div').Method(function bindPane(pane){
  var classes = this.class();
  classes.length && (pane.className = classes.join(' '));
  this.style.onEach((v, k) => pane.style[k] = v);

  nice.eachEach((f, n, type) => {
    pane.addEventListener(type, e => f(e, this));
  }, this._on);

  this.attributes
    .onEach((v, k) => pane[k] = v)
    .onRemove((v, k) => delete pane[k]);

  this.style
    .onEach((v, k) => pane.style[k] = v)
    .onRemove((v, k) => delete pane.style[k]);

  (this.actualChildren || this.children)
    .onEach((c, i) => {
      var child = childToDom(c);
      pane.insertBefore(child, pane.childNodes[i]);
    })
    .onRemove((c, i) => {
      c.kill && c.kill();
      killNode(pane.childNodes[i]);
    });
});


function dom(){
  var z = this;

  if(z.pane)
    return z.pane;

  z.listenBy(() => {});

  var pane = z.pane = document.createElement(z.tag());
  z.bindPane(pane);
  z.isFocused && setTimeout(() => z.pane.focus(), 50);
  return pane;
};

nice.defineAll(nice, {
  htmlEscape: function(s){
    return (''+s).replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  errorPane: e => nice.Div().color('red').add('Error: ' + (e.message || e))
});


var killNode = e => e && e.parentNode && e.parentNode.removeChild(e);


nice.Div.wrapParts = function(text, pattern){
  var reArray = [pattern];
  var re = new RegExp('\\b('+reArray.join('|')+')\\b', 'gi');
  return text.replace(re, '<b>$1</b>');
};
})();
(function(){"use strict";'I,B,Span,H1,H2,H3,H4,H5,H6,P,LI,UL,OL'.split(',').forEach(t => {
  nice.block(t, (z, text) => z.tag(t.toLowerCase()).add(text));
});

nice.block('A', (z, url) => {
  z.tag('a');
  nice.is.Function(url) ? z.on('click', url).href('#') : z.href(url || '#');
});


nice.block('Img', (z, src) => z.tag('img').src(src));
})();
(function(){"use strict";nice.block('PagedList')
  .Number('step', z => z(10))
  .Number('currentPage')
  .Item('pageNumberBy')
  .Item('itemBy')
  .Item('placeholderBy')
  .Method(function pagesList(size){
    var res = nice.Div();
    var width = 5;
    var start = Math.max(0, this.currentPage() - width);
    var end = Math.min(size, this.currentPage() + width + 1);
    start && res.add(this.pageNumber(0));
    start > 1 && res.add('...');
    for(let i = start; i < end; i++)
      res.add(this.pageNumber(i));
    end < size && res.add('...');
    return res;
  })
  .Method(function pageNumber(n){
    var res = n === this.currentPage()
      ? nice.B(n+1)
      : nice.A(e => e.preventDefault(this.currentPage(n))).add(n+1);
    this.pageNumberBy() && this.pageNumberBy()(res);
    return res;
  })
  .Array(function actualChildren(z){
    var children = z.try(this.children);
    var step = z.use(this.step)();
    var current = z.use(this.currentPage)();
    var offset = current * step;
    var res = children().slice(offset, offset + step);

    this.itemBy() && (res = res.map(this.itemBy()));

    if(children.size() > step){
      res.push(this.pagesList(Math.ceil(children.size() / step)));
    }
    z.replace(res.length
        ? res
        : this.placeholderBy() ? this.placeholderBy()() : []);
  });
})();
(function(){"use strict";nice.block('Input')
  .String('type')
  .String('name')
  .Item('value')
  .Method(function listenValueBy(f){
    this.value.listenBy(v => f(v()));
    return this;
  })
  .initBy((z, type) => {
    z.tag('input').attributes('type', type).value("");

    z.on(['change', 'keyup', 'paste', 'search', 'input'], function () {
      z.value(z.pane.value);
      return true;
    });

    z.value.listenBy(v => {
      z.pane && z.pane.value !== v() && (z.pane.value = v());
      return true;
    });

    return z;
  })
  .Method(function focus(){
    this.pane && this.pane.focus();
    this.isFocused = 1;
    return this;
  });


nice.block('Button')
  .initBy((z, text, action) => {
    z.tag('input').attributes({type: 'button', value: text}).on('click', action);
  });


nice.block('Textarea')
  .String('name')
  .String('value')
  .initBy((z, value = '') => {
    z.tag('textarea').value(value);

    z.on(['change', 'keyup', 'paste', 'search', 'input'], function () {
      z.value(z.pane.value);
      return true;
    });

    z.value.listenBy(v => {
      z.pane && (z.pane.value = v());
      z.children.resetValue()(v());
      return true;
    });

    return z;
  })
  .Method(function focus(){
    this.pane && this.pane.focus();
    this.isFocused = 1;
    return this;
  });


nice.block('Submit', (z, text) =>
    z.tag('input').attributes({type: 'submit', value: text}));


nice.block('Checkbox')
  .Boolean('checked')
  .Array('onSwitch')
  .Method(function isChecked(){
    return this.attributes('checked') || false;
  })
  .initBy((z, on) => {
    z.tag('input').attributes({type: 'checkbox', checked: on || false});
    z.on('change', () => {
      z.checked(z.pane.checked);
      z.onSwitch.callEach(z.pane.checked);
      return true;
    });
    z.checked.listenBy(v => {
      z.pane && z.pane.checked !== v() && (z.pane.checked = v());
      return true;
    });
  });
})();; return nice;}