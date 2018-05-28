function extend(a, b){
  create(b, a);
  create(b.proto, a.proto);
  create(b.configProto, a.configProto);
  a.super = b;
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
  }
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

    config.proto = config.proto || {};
    config.configProto = config.configProto || {};

    const type = (...a) => nice.createItem({ type }, ...a);

    config.proto._type = type;
    delete config.by;
    Object.assign(type, config);
    extend(type, config.hasOwnProperty('extends') ? nice.type(config.extends) : nice.Object);

    config.title && nice.registerType(type);

    return create(config.configProto, nice.Configurator(type, ''));
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

