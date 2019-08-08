def(nice, function extend(child, parent){
  if(parent.extensible === false)
    throw `Type ${parent.name} is not extensible.`;
  create(parent, child);
  create(parent.proto, child.proto);
  create(parent.configProto, child.configProto);
  create(parent.types, child.types);
  parent.defaultArguments && create(parent.defaultArguments, child.defaultArguments);
  //TODO: change to 'extension'
  reflect.emitAndSave('Extension', { child, parent });
  child.super = parent;
});


defAll(nice, {
  type: t => {
    nice.isString(t) && (t = nice[t]);
    expect(nice.Anything.isPrototypeOf(t) || nice.Anything === t,
      '' + t + ' is not a type').toBe();
    return t;
  },

  Type: (config = {}, by) => {
    if(nice.isString(config)){
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

    const {_1,_2,_3,_$} = nice;
    const type = (...a) => {
      for(let v of a){
        if(v === _1 || v === _2 || v === _3 || v === _$)
          return nice.skip(type, a);
      }

      return nice._createItem(type, a);
    };

    config.proto._type = type;
    Object.defineProperty(type, 'name', { writable: true });
    Object.assign(type, config);
    nice.extend(type, 'extends' in config ? nice.type(config.extends) : nice.Obj);

    const cfg = create(config.configProto, nice.Configurator(type, ''));
    config.name && nice.registerType(type);
    return cfg;
  },
});

nice.Check('isType', v => nice.Anything.isPrototypeOf(v));


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


//function newItem (type, as) {
//  if(!type._isNiceType)
//    throw('Bad type');
//
//  const id = nice._db.push({_type: type}).lastId;
//
//  const f = function(...a){
//    if(a.length === 0){
//      return f._type.itemArgs0(f);
//    } else if (a.length === 1){
//      f._type.itemArgs1(f, a[0]);
//    } else {
//      f._type.itemArgsN(f, a);
//    }
//    return this || f;
//  }
//  f._id = id;
//
//  const p = new Proxy(f, {
//    get (target, property, z) {
//      if(property === '_set' || property === '_get' || property === '_has')
//        return target[property];
//
//      if(property === '_value' || property === '_type' || property === '_items')
//        nice.reflect.emit('itemUse', z);
//
//      //TODO: forbid public names with _
//      if(property[0] === '_')
//        return nice._db.getValue(target._id);
//
//      const type = target._get('_type');
//      if(type.types[property])
//        return f.get(property);
//
//      if(type.readOnlys[property])
//        return type.readOnlys[property](f);
//
//      return target[property];
//    },
//    set (target, property, value) {
//      return nice._db.update(target._id, property, value);
//      return true;
//    }
//  });
//
//  f._transactionDepth = 0;
//  f._oldValue = undefined;
//  f._newValue = undefined;
//  f._notifing = false;
//
//  Object.setPrototypeOf(p, type.proto);
//  type.onCreate && type.onCreate(p);
//  type.initChildren(p);
//
////  'name' in type.proto && nice.eraseProperty(target, 'name');
////  nice.eraseProperty(f, 'name');
////  'length' in type.proto && nice.eraseProperty(target, 'length');
////  nice.eraseProperty(f, 'length');
//  type.initBy ? type.initBy(p, ...as) : (as.length && p(...as));
//  return p;
//}

