def(nice, function extend(child, parent){
  if(parent.extensible === false)
    throw `Type ${parent.name} is not extensible.`;
  create(parent, child);
  create(parent.proto, child.proto);
  create(parent.configProto, child.configProto);
  create(parent.types, child.types);
  parent.defaultResult && create(parent.defaultResult, child.defaultResult);
  nice.emitAndSave('Extension', { child, parent });
  child.super = parent;
});


defAll(nice, {
  type: t => {
    is.String(t) && (t = nice[t]);
    expect(nice.Anything.isPrototypeOf(t) || nice.Anything === t,
      '' + t + ' is not a type').toBe();
    return t;
  },

  Type: (config = {}) => {
    if(is.String(config)){
      if(nice.types[config])
        throw `Type "${config}" already exists`;
      config = {name: config};
    }

    is.Object(config)
      || nice.error("Need object for type's prototype");

    config.name = config.name || 'Type_' + (nice._counter++);
    config.types = {};
    config.proto = config.proto || {};
    config.configProto = config.configProto || {};
    config.defaultResult = config.defaultResult || {};

    const type = (...a) => {
      const item = nice._newItem(type);
      type.onCreate && type.onCreate(item);
      _each(type.defaultResult, (v, k) => item[k](v));
      type.initBy
        ? type.initBy(item, ...a)
        : (a.length && item(...a));
      return item;
    };

    config.proto._type = type;
    delete config.by;
    Object.defineProperty(type, 'name', {writable: true});
    Object.assign(type, config);
    nice.extend(type, config.hasOwnProperty('extends') ? nice.type(config.extends) : nice.Obj);

    const cfg = create(config.configProto, nice.Configurator(type, ''));
    config.name && nice.registerType(type);
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
    const res = nice[nice.jsBasicTypesMap[primitive]];
    if(!res)
      throw `JS type ${primitive} not supported`;
    return res;
  }

  if(Array.isArray(v))
    return nice.Arr;

  return nice.Obj;
};

