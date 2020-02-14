nice.Single.extend({
  name: 'Pointer',

  initBy: (z, o, key) => {
    //TODO: use key
    expect(o).isObj();
    //TODO: write _object to _db
    z._object = o;
//    z(key === undefined ? null : key);
  },

//  itemArgs0: z => {
//    return z._value !== null && z._object.has(z._value)
//      ? z._object.get(z._value)
//      : nice.Null();
//  },

  itemArgs1: (z, v) => {
    if(typeof v === 'string'){
      v = z._object[v];
    }
    //what if wrong object
    //what if not an object
    return z._type.super.itemArgs1(z, v);
//    z.super.
//    if (v && v._isAnything) {
//      if(z._isRef){
//        const ref = db.getValue(z._id, '_value');
//        ref !== v._id && unfollow(ref, z._id);
//      } else {
//        z._isRef = true;
//      }
//      db.update(z._id, '_value', v._id);
//      Object.setPrototypeOf(z, v._type.proto);
//      v._follow(z._id);
//    } else {
//      if(z._isRef) {
//        unfollow(db.getValue(z._id, '_value'), z._id);
//        (z._isRef = false);
//      }
//      z._cellType.setPrimitive(z, v);
//    }
//    return z;
  },
//  itemArgs1: (z, k) => {
//    if(k === null || nice.isNull(k))
//      return z._setValue(null);
//
//    if(nice.isStr(k))
//      k = k();
//
//    if(z._object.has(k)) {
//      return z._setValue(k);
//    } else {
//      k = nice.findKey(z._object, v => is(k, v));
//      if(k)
//        return z._setValue(k);
//    }
//    throw `Key ${k} not found.`;
//  },

  proto: {
    _notificationValue(){
      return this();
    },
  }
}).about('Holds key of an object or array.');


Test("Create Pointer", function(Pointer, Obj){
  const o = Obj({qwe:1});
  const p = Pointer(o);
  expect(p._type.name).is('Pointer');
//  expect(p.isPointer()).to.equal(true);
//  expect(p().isNull()).to.equal(true);
  expect(p('qwe')).is(p);
  expect(p()).is(1);
});


//TODO: think if comparing by name is a good idea
//Test("Compare by name", function(Pointer, Obj){
//  const o = Obj({qwe:1});
//  const p = Pointer(o);
//  expect(p._type.name).is('Pointer');
////  expect(p.isPointer()).to.equal(true);
////  expect(p().isNull()).to.equal(true);
//  expect(p('qwe')).is(p);
//  expect(p()).is(1);
//});


//Test("set Pointer value", function(Pointer){
//  const o = nice.Obj({qwe:1});
//  const p = nice.Pointer(o);
//  expect(p().isNull()).to.equal(true);
//  expect(p(o.get('qwe'))).to.equal(p);
//  expect(p()).to.equal(1);
//});
//
//
//Test("Pointer property of an object", (Pointer) => {
//  const users = nice({1: {name: 'Qwe'}});
//  const T = nice.Type()
//    .pointer('user', users)
//    ();
//  const t = T();
//
//  expect(t.user(1)).to.equal(t);
//  expect(t.user()['name']).to.equal('Qwe');
//});

