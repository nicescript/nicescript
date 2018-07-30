function extend(child, parent){
  if(parent.extensible === false)
    throw `Type ${parent.name} is not extensible.`;
  create(parent, child);
  create(parent.proto, child.proto);
  create(parent.configProto, child.configProto);
  create(parent.types, child.types);
  parent.defaultResult && create(parent.defaultResult, child.defaultResult);
  nice.emitAndSave('Extension', { child, parent });
  child.super = parent;
}


nice.registerType({
  name: 'Anything',

  description: 'Parent type for all types.',

  extend: function (...a){
    return nice.Type(...a).extends(this);
  },

  proto: {
    _isAnything: true,

    apply: function(f){
      f(this);
      return this;
    },

    Switch: function (...vs) {
      const s = Switch(this, ...vs);
      defGet(s, 'up', () => {
        s();
        return this;
      })
      return s;
    },

    SwitchArg: function (...vs) {
      const s = Switch(this, ...vs);
      s.checkArgs = vs;
      defGet(s, 'up', () => {
        s();
        return this;
      })
      return s;
    }
  },

  configProto: {
    extends: function(parent){
      const type = this.target;
      is.String(parent) && (parent = nice[parent]);
      expect(parent).Type();
      extend(type, parent);
      return this;
    },

    about: function (...a) {
      this.target.description = nice.format(...a);
      return this;
    },

    key: function (name, o) {
      if(name[0] !== name[0].toLowerCase())
        throw "Property name should start with lowercase letter. ";
      def(this.target.proto, name, function (...a) {
        const r = this.getResult();
        if(a.length){
          if(is.Object(a[0]))
            throw "Key must be a primitive value.";

          r[name] = a[0];
          return this;
        } else {
          return is.Anything(o) ? o.get(r[name]) : o[r[name]];
        }
      });
      return this;
    }
  },

  types: {}
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
      const item = nice.createItem({ type });
      type.defaultValue && item.setResult(type.defaultValue());
      type.constructor && type.constructor(item, ...a);
      return item;
    };

    config.proto._type = type;
    delete config.by;
    Object.defineProperty(type, 'name', {writable: true});
    Object.assign(type, config);
    extend(type, config.hasOwnProperty('extends') ? nice.type(config.extends) : nice.Obj);

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

