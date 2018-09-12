nice.Single.extend({
  name: 'Pointer',

  initBy: (z, o, key) => {
    expect(o).Obj();
    z._object = o;
    key === undefined || z(key);
  },

  itemArgs0: z => z._object.get(z._value),

  itemArgs1: (z, k) => {
    if(!z._object.is.has(k))
      throw `Key ${k} not found.`;

    z._setValue(k);
  },
}).about('Holds key of an object or array.');
