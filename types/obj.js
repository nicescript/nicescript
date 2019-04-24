nice.Type({
  name: 'Obj',
  extends: nice.Value,
  onCreate: z => z._items = {},

  itemArgs0: z => z._items,

  itemArgs1: (z, o) => {
    const t = typeof o;
    if( t !== 'object' )
      throw z._type.name + ` doesn't know what to do with ` + t;
    _each(o, (v, k) => z.set(k, v));
  },

  itemArgsN: (z, os) => _each(os, o => z(o)),

  fromValue (v) {
    const res = this();
    Object.assign(res._items, nice._map(v, nice.fromJson));
    return res;
  },

  deserialize (js) {
    const res = this();
    _each(js, (v, k) => res._items[k] = nice.deserialize(v));
    return res;
  },

  initChildren (item){
    _each(this.defaultArguments, (as, k) => {
      item._items[k] = this.types[k](...as);
    });
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

    setDefault (i, f, ...tale) {
      const z = this;

      if(i._isAnything === true)
        i = i();

      if(!z._items.hasOwnProperty(i))
        z.set(i, f(), ...tale);
      return z;
    },

    _itemsListener (o) {
      const { onRemove, onAdd, onChange } = o;
      return (v, old) => {
        if(old === undefined){
          onAdd && v.each(onAdd);
          onChange && v.each((_v, k) => onChange(k, _v));
        } else {
          _each(old, (c, k) => {
            onRemove && c !== undefined && onRemove(c, k);
            onAdd && v._items.hasOwnProperty(k) && onAdd(v._items[k], k);
            onChange && onChange(k, v._items[k], c);
          });
        }
      };
    }
  }
})
  .about('Parent type for all composite types.')
  .ReadOnly(function values(z){
    let a = nice.Arr();
    z.each(v => a.push(v));
    return a;
  })
  .ReadOnly(function jsValue(z){
    const o = Array.isArray(z._items) ? [] : {};
    _each(z._items, (v, k) => o[k] = (v && v._isAnything) ? v.jsValue : v);
    Switch(z._type.name).isString().use(s =>
      ['Arr', 'Obj'].includes(s) || (o[nice.TYPE_KEY] = s));
    return o;
  })
  .addProperty('size', { get () {
    return Object.keys(this._items).reduce(n => n + 1, 0);
  }})
  .Action(function itemsType(z, t){
    z._itemsType = t;
  });

const F = Func.Obj, M = Mapping.Obj, A = Action.Obj, C = Check.Obj;

Func.Nothing('each', () => 0);

C('has', (o, k) => o._items.hasOwnProperty(k));

F(function each(o, f){
  for(let k in o._items)
    if(nice.isStop(f(o._items[k], k)))
      break;
  return o;
});


F('reverseEach', (o, f) => {
  Object.keys(o._items).reverse().forEach(k => f(o._items[k], k));
});


//Mapping.Object.('get', (o, i) => o[''+i]);
Mapping.Object('get', (o, path) => {
  if(path.pop){
    let k = 0;
    while(k < path.length) {
      o = o[path[k++]];
      if(!o)
        return o;
    }
    return o;
  } else {
    return o[''+path];
  }
});


M('get', (z, i) => {
  if(i._isAnything === true)
    i = i();

  if(z._items.hasOwnProperty(i)){
    return z._items[i];
  }

  const type = z._type.types[i];
  return type
    ? z._items[i] = type()
    : undefined;
});


M('getDefault', (z, i, v) => {
  if(i._isAnything === true)
    i = i();

  return z._items.hasOwnProperty(i) ? z._items[i] : z._items[i] = v;
});


Action.Object('set', (o, i, v) => o[''+i] = v);

A('set', (z, i, v, ...tale) => {
  i = z.checkKey(i);
  z.transactionStart();
  let res;
  if(!is(v, z._items[i])){
    z._oldValue = z._oldValue || {};
    z._oldValue[i] = z._items[i];
  }
  const type = z._itemsType || (z._type.types && z._type.types[i]);
  if(type){
    if(v && v._isAnything){
      if(!v._type.isSubType(type))
        throw `Expected item type is ${type.name} but ${v._type.name} is given.`;
      res = v;
    } else {
      res = type(v, ...tale);
    }
  } else {
    res = v;
  }
  z._items[i] = res;
  z._newValue = z._newValue || {};
  z._newValue[i] = res;
  z.transactionEnd();
  return z;
});


A('assign', (z, o) => _each(o, (v, k) => z.set(k, v)));

A.Obj.test((replaceAll, Obj) => {
  expect( replaceAll(Obj({ q:1, a:2 }), Obj({a:1}))() ).deepEqual({ a:1 });
})('replaceAll', (z, o) => z.replaceAll(o._items));

A.Object.test((replaceAll, Obj) => {
  const o1 = Obj({ q:1, a:2 });
  const replacement = { z:3 };
  const o2 = o1.replaceAll(replacement);
  replacement.a = 1;
  expect(o2()).deepEqual({ z:3 });
})('replaceAll', (z, o) => {
  z._oldValue = z._items;
  z._items = nice.reduceTo(o, {}, (res, v, k) => res[k] = v);
});

A.test((remove, Obj) => {
  expect( remove(Obj({ q:1, a:2 }), 'q').jsValue ).deepEqual({ a:2 });
})
.about('Remove element at `i`.')
('remove', (z, i) => {
  z._oldValue = z._oldValue || {};
  z._oldValue[i] = z._items[i];
  delete z._items[i];
});

A('removeValue', (o, v) => {
  for(let i in o._items)
    is(v, o._items[i]) && o.remove(i);
});

Action.Object('removeValue', (o, v) => {
  for(let i in o)
    if(is(v, o[i]))
      delete o[i];
});

A('removeAll', z => {
  z._oldValue = z._items;
  z._type.onCreate(z);
});


//['max','min','hypot'].forEach(name => {
//  nice.Obj.define(name, function (f) {
//    return nice.Num().by(z =>
//      z(Math[name](...nice.mapArray(f || (v => v()), z.use(this)())))
//    );
//  });
//});


M(function reduce(o, f, res){
  for(let k in o._items)
    res = f(res, o._items[k], k);
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


M(function map(c, f){
  const res = c._type();
  const o = c._items;
  for(let i in o)
    res.set(i, f(o[i], i));
  return res;
});


M('rMap', (c, f) => c._type().apply(res => c.listen({
  onAdd: (v, k) => res.set(k, f(v, k)),
  onRemove: (v, k) => res.remove(k)
})));


M('filter', (c, f) => c.reduceTo(c._type(), (z, v, k) => f(v,k) && z.set(k, v)));


M('rFilter', (c, f) => c._type().apply(z => c.listen({
  onAdd: (v, k) => f(v, k) && z.set(k, v),
  onRemove: (v, k) => z.remove(k)
})));


M('sum', (c, f) => c.reduce((n, v) => n + (f ? f(v) : v), 0));


C.Function(function some(c, f){
  for(let i in c._items)
    if(f(c._items[i], i))
      return true;
  return false;
});



C(function every(c, f){
  for(let i in c._items)
    if(!f(c._items[i], i))
      return false;
  return true;
});


M(function find(c, f){
  for(let i in c._items)
    if(f(c._items[i], i))
      return c._items[i];
});


M(function findKey(c, f){
  nice.isFunction(f) || (f = is(f, nice));
  for(let i in c._items)
    if(f(c._items[i], i))
      return i;
});


M.Function(function count(o, f) {
  let n = 0;
  o.each((v, k) => f(v, k) && n++);
  return nice.Num(n);
});

//A('removeValue', (o, item) => {
//  for(let i in o){
//    if(o[i] === item) delete o[i];
//  }
//  return o;
//});
//
//
//Action.undefined('removeValue', () => undefined);
//Action.undefined('removeValues', () => undefined);
//
//A('removeValues', (o, items) => _each(items, nice.removeValue(o, nice)));


Check.Object
  .test((includes, Obj) => {
    const o = {q:1,z:3};
    expect(Obj(o).includes(2)).is(false);
    expect(Obj(o).includes(3)).is(true);
    expect(includes(o, 2)).is(false);
    expect(includes(o, 3)).is(true);
  })
  ('includes', (o, t) => {
    for(let i in o)
      if(is(o[i], t))
        return true;
    return false;
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


M('reduceTo', (o, res, f) => {
  o.each((v, k) => f(res, v, k));
  return res;
});


reflect.on('Type', type => {
  const smallName = nice._decapitalize(type.name);

  function createProperty(z, name, ...as){
    const targetType = z.target;

    if(name[0] !== name[0].toLowerCase())
      throw "Property name should start with lowercase letter. "
            + `"${nice._decapitalize(name)}" not "${name}"`;

    targetType.types[name] = type;

    as.length && (targetType.defaultArguments[name] = as);

    defGet(targetType.proto, name, function(){
      const res = this.get(name);

//  slows everything but only actual when data was set externaly
//  could be enabled with debug option
//      if(!nice.isSubType(res._type, type))
//        throw `Can't create ${type.name} property. Value is ${res._type.name}`;

      return res;
    });

    reflect.emitAndSave('Property', { type, name, targetType });
  }

  def(nice.Obj.configProto, smallName, function (name, ...as) {
    createProperty(this, name, ...as);
    return this;
  });
});