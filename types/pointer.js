nice.Single.extend({
  name: 'Pointer',

  initBy: (z, o, key) => {
    expect(o).isObj();
    z._object = o;
    z(key === undefined ? null : key);
  },

  itemArgs0: z => {
    return z._value !== null && z._object.has(z._value)
      ? z._object.get(z._value)
      : nice.Null();
  },

  itemArgs1: (z, k) => {
    if(k === null || nice.isNull(k))
      return z._setValue(null);

    if(nice.isStr(k))
      k = k();

    if(z._object.has(k)) {
      return z._setValue(k);
    } else {
      k = nice.findKey(z._object, v => equal(k, v));
      if(k)
        return z._setValue(k);
    }
    throw `Key ${k} not found.`;
  },

  proto: {
    _notificationValue(){
      return this();
    },
  }
}).about('Holds key of an object or array.');
