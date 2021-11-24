const Stop = nice.Stop;

nice.Type({
  name: 'Obj',
  extends: nice.Value,
  defaultValueBy: () => ({}),

//   initBy: (z, o) => {
//     if(typeof o === 'object')
//       nice._each(o, (v, k) => z.set(k, v));
//   },

//  itemArgs1: (z, o) => {
//    const t = typeof o;
//    if( t !== 'object' )
//      throw new Error(z._type.name + ` doesn't know what to do with ` + t);
//    _each(o, (v, k) => z.set(k, v));
//  },

//  itemArgsN: (z, os) => _each(os, o => z(o)),

//  fromValue (v) {
//    const res = this();
//    Object.assign(res._items, nice._map(v, nice.fromJson));
//    return res;
//  },

//  deserialize (js) {
//    const res = this();
//    _each(js, (v, k) => res._items[k] = nice.deserialize(v));
//    return res;
//  },

  setValue (z, value) {
    z._value = z._type.defaultValueBy();
    expect(typeof value).is('object');
    _each(value, (v, k) => z.set(k, v));
  },

  proto: {
//      getDeep(path) {
//        let k = 0;
//        let res = this;
//        while(k < path.length) res = res.get(path[k++]);
//        return res;
//      },


//      setDeep(path, v){
//        return this.getDeep(path)(v);
//      },

    checkKey (i) {
      if(i._isAnything === true)
        i = i();

      return i;
    },

    get (key) {
      if(key._isAnything === true)
        key = key();

      if(key in this._value)
        return this._value[key];

      const type = this._type;
      const childType = type && type.types[key]

      if(childType){
        const child = key in type.defaultArguments
         ? nice._createItem(childType, type.defaultArguments[key])
         : nice._createItem(childType);

        this._value[key] = child;
        return child;
      }
      return undefined;
    },

    assert (key) {
      if(key._isAnything === true)
        key = key();

      const type = this._type;
      const childType = (type && type.types[key]) || Anything;

      const child = key in type.defaultArguments
       ? nice._createItem(childType, type.defaultArguments[key])
       : nice._createItem(childType);

      this._value[key] = child;
      return child;
    },

    getDeep (...path) {
      let res = this, i = 0;
      while(i < path.length) res = res.get(path[i++]);
      return res;
    },
  }
})
  .about('Parent type for all composite types.')
  .ReadOnly(function values(z){
    let a = nice.Arr();
    z.each(v => a.push(v));
    return a;
  })
  .ReadOnly(function jsValue(z){
    const o = (Array.isArray(z) || (z && z._isArr)) ? [] : {};
    z.each((v, k) => o[k] = (v && v._isAnything) ? v.jsValue : v);
    Switch(z._type.name).isString().use(s =>
      ['Arr', 'Obj'].includes(s) || (o[nice.TYPE_KEY] = s));
    return o;
  })
  .Mapping('size', z => Object.keys(z._value).length);

Test("Obj constructor", (Obj) => {
  const a = Obj({a: 3});
  expect(a.get('a')).is(3);
//  expect(a.get('q')).isNotFound();
});

Test("Obj deep constructor", Obj => {
  const o = Obj({a: {b: { c:1 }}});
  expect(o.jsValue.a.b.c).is(1);
});


Test("set / get primitive", (Obj) => {
  const a = Obj();
  a.set('a', 1);
  expect(a.get('a')).is(1);
//  expect(a.get('q')).isNotFound();
});

Test("set / get with nice.Str as key", (Obj) => {
  const a = Obj();
  a.set('qwe', 1);
  expect(a.get(nice('qwe'))).is(1);
});

const F = Func.Obj, M = Mapping.Obj, A = Action.Obj, C = Check.Obj;

Func.Nothing('each', () => 0);

C('has', (o, key) => {
  if(key._isAnything === true)
    key = key();
  const children = o._value;
  if(key in children){
    return children[key]._type !== NotFound;
  }
  return false;
});


Test((Obj, has) => {
  const o = Obj({q:1,z:3});
  expect(o.has('a')).is(false);
  expect(o.has('q')).is(true);
});


A.about(`Set value if it's missing.`)
  (function setDefault (z, i, ...as) {
    z.has(i) || z.set(i, ...as);
  });

Test((Obj, setDefault) => {
  const o = Obj({a:1});
  o.setDefault('a', 2);
  expect(o.get('a')).is(1);
  o.setDefault('z', 2);
  expect(o.get('z')).is(2);
});

F(function each(z, f){
  const index = z._value;
  for(let i in index){
    const item = index[i];
    if(f(item, i) === Stop)
      break;
  }
});

Test("each stop", (each, Obj, Spy) => {
  const spy = Spy(() => Stop);
  Obj({qwe: 1, asd: 2}).each(spy);
  expect(spy).calledOnce();
  expect(spy).calledWith(1);
});

Mapping.Object('get', (o, path) => {
  if(Array.isArray(path)){
    let k = 0;
    while(k < path.length) {
      o = o[path[k++]];
      if(!o)
        return o;
    }
    return o;
  } else {
    typeof path === 'function' && (path = path());
    return o[path];
  }
});


Test((Obj, NotFound) => {
  const o = Obj({q:1});
  expect(o.get('q')).is(1);
//  expect(o.get('z')).isNotFound();
});


Action.Object('set', (o, i, v) => {
  typeof i === 'function' && (i = i());
  o[i] = v;
});


//optimization: get rid of the tale
A('set', (z, key, value, ...tale) => {
  const _name = z.checkKey(key);

  if(value === undefined)
    throw `Can't set ${key} to undefined`;

  if(value === null)
    return z.remove(_name);

  const type = z._type;
  const childType = (type && type.types[key]);

  if(childType) {
    if(!z._value[_name]){
      z._value[_name] = nice._createItem(childType);
    }
    z._value[_name](value, ...tale);
  }
  z._value[_name] = value;
});


A('assign', (z, o) => _each(o, (v, k) => z.set(k, v)));

//A.Obj.test((replaceAll, Obj) => {
//  expect( replaceAll(Obj({ q:1, a:2 }), Obj({a:1}))() ).deepEqual({ a:1 });
//})('replaceAll', (z, o) => z.replaceAll(o._items));
//
//A.Object.test((replaceAll, Obj) => {
//  const o1 = Obj({ q:1, a:2 });
//  const replacement = { z:3 };
//  const o2 = o1.replaceAll(replacement);
//  replacement.a = 1;
//  expect(o2()).deepEqual({ z:3 });
//})('replaceAll', (z, o) => {
//  z._isHot && (z._oldValue = z._items);
//  z._items = nice.reduceTo(o, {}, (res, v, k) => res[k] = v);
//});

A.about('Remove element at `i`.')
('remove', (z, key) => {
  if(key._isAnything === true)
    key = key();

  if(!(key in z._value))
    return;

  delete z._value[key];
});

Test((remove, Obj) => {
  const o = Obj({ q:1, a:2 });
  expect( o.size() ).is(2);
  expect( remove(o, 'q').jsValue ).deepEqual({ a:2 });
  expect( o.size() ).is(1);
});

//Test("Obj remove deep", (Obj) => {
//  const o = Obj({a: {b: { c:1 }}});
//  const id = o.get('a').get('b').get('c')._id;
//  expect(o.get('a').get('b').get('c')).is(1);
//  o.get('a').remove('b');
//  expect(o.get('a').get('b')).isNotFound();
//  expect(o.get('a').get('b').get('c')).isNotFound();
//});

//A('removeValue', (o, v) => {
//  for(let i in o._items)
//    is(v, o._items[i]) && o.remove(i);
//});
//
//Action.Object('removeValue', (o, v) => {
//  for(let i in o)
//    is(v, o[i]) && delete o[i];
//});
//
//A('removeValues', (o, vs) => _each(vs, v => {
//  for(let i in o._items)
//    is(v, o._items[i]) && o.remove(i);
//}));
//
//Action.Object('removeValues', (o, vs) => _each(vs, v => {
//  for(let i in o)
//    is(v, o[i]) && delete o[i];
//}));


A('removeAll', z => {
  _each(z._value, (v, k) => z.get(k).toNotFound());
});


//['max','min','hypot'].forEach(name => {
//  nice.Obj.define(name, function (f) {
//    return nice.Num().by(z =>
//      z(Math[name](...nice.mapArray(f || (v => v()), z.use(this)())))
//    );
//  });
//});


M(function reduce(o, f, res){
  o.each((v,k) => res = f(res, v, k));
  return res;
});


M(function mapToArray(c, f){
  return c.reduceTo([], (a, v, k) => a.push(f(v, k)));
});


Mapping.Nothing('map', () => nice.Nothing);

Mapping.Object('map', (o, f) => nice.apply({}, res => {
  for(let i in o)
    res[i] = f(o[i], i);
}));


M.rObj(function map(r, c, f){
  c.each((v,k) => r.set(k, f(v, k)));
});

Test("map", function(Obj, map) {
  const a = Obj({q: 3, a: 2});
  const b = a.map(x => x * 2);
  expect(b.jsValue).deepEqual({q:6, a:4});
});


M.rObj('filter', (r, c, f) => c.each((v, k) => f(v,k) && r.set(k, v)));

Test("filter", function(Obj, filter) {
  const a = Obj({q: 3, a: 2, z:5});
  const b = a.filter(n => n % 2);
  expect(b.jsValue).deepEqual({q:3, z:5});
});


M('sum', (c, f) => c.reduce((n, v) => n + (f ? f(v) : v), 0));


C.Function(function some(c, f){
  let res = false;
  c.each((v,k) => {
    if(f(v, k)){
      res = true;
      return Stop;
    }
  });
  return res;
});


Test((Obj, some) => {
  const o = Obj({a:1,b:2});
  expect(o.some(v => v % 2)).is(true);
  expect(o.some(v => v < 3)).is(true);
  expect(o.some(v => v < 0)).is(false);
});


C.about(`Check if every element in colection matches given check`)
  (function every(c, f){
    return !!c.reduce((res, v, k) => res && f(v, k), true);
  });

Test((Obj, every) => {
  const o = Obj({a:1,b:2});
  expect(o.every(v => v % 2)).is(false);
  expect(o.every(v => v < 3)).is(true);
  expect(o.every(v => v < 0)).is(false);
});


M(function find(c, f){
  let res;
  c.each((v, k) => {
    if(f(v, k)){
      res = v;
      return Stop;
    }
  });
  return res === undefined ? NotFound() : res;
});


M(function findKey(c, f){
  nice.isFunction(f) || (f = is(f, nice));
  let res;
  c.each((v, k) => {
    if(f(v, k)){
      res = k;
      return Stop;
    }
  });
  return res === undefined ? NotFound() : res;
});


M.Function(function count(o, f) {
  let n = 0;
  o.each((v, k) => f(v, k) && n++);
  return nice.Num(n);
});


Check.Object('includes', (o, t) => {
  for(let i in o)
    if(is(o[i], t))
      return true;
  return false;
});

Test((includes) => {
  const o = {q:1,z:3};
  expect(includes(o, 2)).is(false);
  expect(includes(o, 3)).is(true);
});

Check.Obj('includes', (o, t) => {
  let res = false;
  o.each(v => {
    if(nice.is(v, t)){
      res = true;
      return Stop;
    }
  });
  return res;
});

Test((includes, Obj) => {
  const o = Obj({q:1,z:3});
  expect(o.includes(2)).is(false);
  expect(o.includes(3)).is(true);
  expect(includes(o, 2)).is(false);
  expect(includes(o, 3)).is(true);
});

//M.Function('mapAndFilter', (o, f) => nice.with({}, res => {
//  for(let i in o){
//    let v = f(o[i], i);
//    v && (res[i] = v);
//  }
//}));

M('getProperties',  z => apply([], res => {
  for(let i in z) z[i]._isProperty && res.push(z[i]);
}));


Func.Object('reduceTo', (o, res, f) => {
  _each(o, (v, k) => f(res, v, k));
  return res;
});

Test("reduceTo", function(reduceTo, Num) {
  const c = {qwe: 1, ads: 3};
  const a = nice.Num();

  expect(reduceTo(c, a, (z, v) => z.inc(v))).is(a);
  expect(a()).is(4);
});


reflect.on('type', type => {
  const smallName = nice._decapitalize(type.name);

  function createProperty(z, name, ...as){
    const targetType = z.target;

    if(name[0] !== name[0].toLowerCase())
      throw new Error("Property name should start with lowercase letter. "
            + `"${nice._decapitalize(name)}" not "${name}"`);

    targetType.types[name] = type;

    as.length && (targetType.defaultArguments[name] = as);

    defGet(targetType.proto, name, function(){
      return this.get(name);

//  slows everything but only actual when data was set externaly
//  could be enabled with debug option
//      if(!nice.isSubType(res._type, type))
//        throw `Can't create ${type.name} property. Value is ${res._type.name}`;
    });

    reflect.emitAndSave('Property', { type, name, targetType });
  }

  def(nice.Obj.configProto, smallName, function (name, ...as) {
    createProperty(this, name, ...as);
    return this;
  });
});


Test(function getDeep(Obj){
  const o = Obj({q:Obj({a:2})});
  expect(o.getDeep('q', 'a')).is(2);
//  expect(o.getDeep('q', 'z')).isNotFound();
  expect(o.getDeep() === o).isTrue();
});


