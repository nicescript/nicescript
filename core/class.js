nice.defineAll(nice.classPrototype, {
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
  nice.define(nice.classPrototype, name, function (...a){
    this.itemProto[name](...a);
    return this;
  });
});


nice.Type(nice.new(nice.typePrototype, nice.classPrototype));
