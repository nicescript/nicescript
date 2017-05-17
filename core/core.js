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
  ObjectPrototype: {_typeTitle: 'Object'},
  ClassPrototype: {_typeTitle: 'Class'},
  ReducePrototype: {},
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
  },
});


function defineReducer(proto) {
  if(!proto._typeTitle)
    return;
  nice.reduceTo[proto._typeTitle] = nice.curry(function(f, collection){
    return nice.reduceTo(f, nice[proto._typeTitle](), collection);
  });
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