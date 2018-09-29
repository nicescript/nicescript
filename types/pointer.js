nice.Single.extend({
  name: 'Pointer',

  initBy: (z, o, key) => {
    expect(o).Obj();
    z._object = o;
    z(key === undefined ? null : key);
  },

  itemArgs0: z => {
    return z._value !== null && z._object.is.has(z._value)
      ? z._object.get(z._value)
      : nice.Null();
  },

  itemArgs1: (z, k) => {
    if(k === null || is(k).Null())
      return z._setValue(null);

    if(is.Str(k))
      k = k();

    if(z._object.is.has(k)) {
      return z._setValue(k);
    } else if(k && k._isAnything) {
      if(z._object.is.has(k())) {
        return z._setValue(k());
      } else {
        k = z._object.findKey(v => k.is.equal(v));
        if(!k.is.NotFound())
          return z._setValue(k());
      }
    }
    throw `Key ${k} not found.`;
  },

  proto: {
    _notificationValue(){
      return this();
    },
  }
}).about('Holds key of an object or array.');
