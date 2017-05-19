nice.defineAll(nice, {
  types: {},

  typePrototype: {
    initBy: function(f){
      this.itemProto._constructor = (z, ...a) => {
        nice.ObjectPrototype._constructor(z);
        f(z, ...a);
      };
      return this;
    },

    extends: function(type){
      nice.is.String(type) && (type = nice.class(type));
      nice.new(type, this);
      nice.new(type.itemProto, this.itemProto);
      return this;
    },
  },

  type: t => {
    nice.is.String(t) && (t = nice[t]);
    nice.expect(nice.typePrototype.isPrototypeOf(t)).toBe();
    return t;
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
    f.itemPrototype = proto;
    nice.new(nice.typePrototype, f);

    proto.hasOwnProperty('_typeTitle') && proto._typeTitle
      && nice.registerType(f, proto);

    return f;
  },

  registerType: function(type, proto){
    var title = proto._typeTitle;

    title[0] !== title[0].toUpperCase() &&
      nice.error('Please start type name with a upper case letter');

    type.title = title;
    nice.types[title] = type;
    nice._onType.forEach(f => f(type));

    nice.valueTypes[title] = proto;
    nice.define(nice, title, type);
    return proto;
  },

  _onType: [],

  onType: f => {
    nice.each(f, nice.types);
    nice._onType.push(f);
  }

});
