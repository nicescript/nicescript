def(nice, 'reflect', {
  functions:{},
  bodies:[],
  list (name) {
    this._events[name].forEach(e => console.log(e));
  },
  
  registerType (type) {
    const name = type.name;

    name[0] !== name[0].toUpperCase() &&
      nice.error('Please start type name with a upper case letter');

    nice.types[name] = type;
    def(nice, name, type);
    def(type.proto, '_is' + name, true);
    reflect.emitAndSave('type', type);
  },

  createItem(type, args){
    if(!type._isNiceType)
      throw new Error('Bad type');
    if(type.hasOwnProperty('abstract'))
      throw new Error(type.name + ' is abstract type.');
    let item;

    if(type.isFunction === true){
      item = reflect.newItem();
      reflect.setType(item, type);
    } else {
      item = Object.create(type.proto);
      item._type = type;
      if("defaultValueBy" in type){
        item._value = type.defaultValueBy();
      };
    }

    reflect.initItem(item, type, args);
    return item;
  },

  initItem(z, type, args) {
    if(args === undefined || args.length === 0){
      type.initBy && type.initBy(z);
    } else if (type.initBy){
      type.initBy(z, ...args);
    } else {
      throw type.name + ' doesn\'t know what to do with arguments';
    }
    return z;
  },

  setType(item, type) {
    const proto = type.proto;
    Object.setPrototypeOf(item, proto);
    item._type = type;

//    type.defaultValueBy && (item._value = type.defaultValueBy());
    if("defaultValueBy" in type){
      item._value = type.defaultValueBy();
    };

    return item;
  },

  newItem() {
    //change: try to cast otherwise change item type //exceptions: functions
    const f = function(...a){
      if('customCall' in f._type)
        return f._type.customCall(f, ...a);

      if(a.length === 0){
        return f._type.itemArgs0(f);
      } else if (a.length === 1){
        f._type.itemArgs1(f, a[0]);
      } else {
        f._type.itemArgsN(f, a);
      }

      return this || f;
    };

    nice.eraseProperty(f, 'name');
    nice.eraseProperty(f, 'length');

    return f;
  },
});