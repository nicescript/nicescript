nice = function(v, ...a){
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
  ObjectPrototype: { _typeTitle: 'Object'},
  classPrototype: { _typeTitle: 'Class'},
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

  kill: item => {
    nice.each(s => s.cancel(), item._subscriptions);
    nice.each(c => nice.kill(c), item._children);
  }
});
