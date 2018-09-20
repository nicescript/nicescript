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

    if(k && k._isAnything)
      k = z._object.findKey(v => k.is.equal(v))();

    if(!z._object.is.has(k))
      throw `Key ${k} not found.`;

    z._setValue(k);
  },

  proto: {
    _notificationValue(){
      return this();
    },
  }
}).about('Holds key of an object or array.');
