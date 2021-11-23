//TODO: make type name creation independent

def(nice, function extend(child, parent){
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
    typeof t === 'string' && (t = nice[t]);
    expect(Anything.isPrototypeOf(t) || Anything === t,
      '' + t + ' is not a type').is(true);
    return t;
  },

  Type: (config = {}, by) => {
    if(typeof config === 'string'){
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

    if(config.customCall !== undefined || config.itemArgs0 !== undefined
        || config.itemArgs1 !== undefined || config.itemArgsN !== undefined){
      config.isFunction = true;
    }

    const type = (...a) => nice._createItem(type, a);

    Object.defineProperty(type, 'name', { writable: true });
    Object.assign(type, config);
    nice.extend(type, 'extends' in config ? nice.type(config.extends) : nice.Obj);

    const cfg = create(config.configProto, nice.Configurator(type, ''));
    config.name && nice.registerType(type);
    return cfg;
  },
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
    //ugly for performance
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