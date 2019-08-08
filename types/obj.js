nice.Type({
  name: 'Obj',
  extends: nice.Value,
  onCreate: z => {
//    z._items = {};
    z._itemsType = null;
  },

//  itemArgs0: z => z._items,

  itemArgs1: (z, o) => {
    const t = typeof o;
    if( t !== 'object' )
      throw z._type.name + ` doesn't know what to do with ` + t;
    _each(o, (v, k) => z.set(k, v));
  },

  itemArgsN: (z, os) => _each(os, o => z(o)),

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

  initChildren (item){
    _each(this.defaultArguments, (as, k) => {
      item.set(k, this.types[k](...as));
//      item._items[k] = this.types[k](...as);
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

    _itemsListener (o) {
      const { onRemove, onAdd, onChange } = o;
      return v => {
        if(v._oldValue === undefined){
          onAdd && v.each(onAdd);
          onChange && v.each((_v, k) => onChange(k, _v));
        } else {
          _each(v._oldValue, (c, k) => {
            onRemove && c !== undefined && onRemove(c, k);
            onAdd && k in v._items && onAdd(v._items[k], k);
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
    const o = z.isArray() || z.isArr() ? [] : {};
    z.each((v, k) => o[k] = (v && v._isAnything) ? v.jsValue : v);
    Switch(z._type.name).isString().use(s =>
      ['Arr', 'Obj'].includes(s) || (o[nice.TYPE_KEY] = s));
    return o;
  })
  .ReadOnly('size', z => z._size)
  .Action(function itemsType(z, t){
    z._itemsType = t;
  });

const F = Func.Obj, M = Mapping.Obj, A = Action.Obj, C = Check.Obj;

Func.Nothing('each', () => 0);

C('has', (o, key) => {
  //k in o._items
  if(key._isAnything === true)
    key = key();
  const id = o._id;
  const parents = nice._db.data._parent;
  const names = nice._db.data._name;
  const types = nice._db.data._type;
  for(let i in parents)
    if(parents[i] === id && names[i] === key && types[i] !== nice.NotFound)
      return true;
  return false;
});

A
  .about(`Set value if it's missing.`)
  .test((Obj) => {
    const o = Obj({a:1});
    o.setDefault('a', 2);
    expect(o.get('a').is(1));
    o.setDefault('z', 2);
    expect(o.get('a').is(2))
  })
  (function setDefault (i, ...as) {
    this.has(i) || this.set(i, ...as);
  });

F(function each(o, f){
  const id = o._id;
  const parents = nice._db.data._parent;
  const names = nice._db.data._name;
  for(let k in parents)
    if(parents[k] === id && nice.isStop(f(nice._getItem(k), names[k])))
      break;
//  for(let k in o._items)
//    if(nice.isStop(f(o._items[k], k)))
//      break;
  return o;
});


Mapping.Object.test(Obj => {
  const o = Obj({qwe:1});
//  expect(o.qwe === o.qwe).is(true);
//  expect(o.asd === o.asd).is(true);

})('get', (o, path) => {
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


M.test((Obj,NotFound) => {
  const o = Obj({q:1});
  expect(o.get('q')()).is(1);
  expect(o.get('z')._type).is(NotFound);
})('get', (z, key) => {
  if(key._isAnything === true)
    key = key();

  const found = nice._db.findKey({_parent: z._id, _name: key});
  if(found !== null)
    return nice._getItem(found);

  const type = z._type.types[key];
  const item = nice._createItem(type || nice.NotFound)
  item._parent = z._id;
  item._name = key;
  return item;
});


//M('getDefault', (z, i, v) => {
//  if(i._isAnything === true)
//    i = i();
//
//  return i in z._items ? z._items[i] : z._items[i] = v;
//});


Action.Object('set', (o, i, v) => {
  typeof i === 'function' && (i = i());
  o[i] = v;
});


A('set', (z, key, value, ...tale) => {
  const _name = z.checkKey(key);

  if(value === undefined)
    throw `Can't set ${key} to undefined`;

  if(value === null)
    return z.remove(_name);

  const db = nice._db;
  const id = db.findKey({_parent: z._id, _name});
  let _type, _value = value;

  if (value._isAnything){
    if(!z._id)
      throw 'err 94834839';
    if(id !== null && z._id !== id)
      throw 'TODO:0 err 948v43';
    if(value._name || value._parent){
      throw 'TODO:0 rveo484';
    } else {
      value._name = _name;
      value._parent = z._id;
    }
  } else {
    _type = nice.valueType(_value);
    if(id === null){
      db.push({ _value, _type, _parent: z._id, _name});
      db.update(z._id, '_size', db.getValue(z._id, '_size') + 1);
    } else {
      db.update(id, { _value, _type });
    }
  }

  return;
  //TODO:0 restore type check
//  z.transactionStart();
//  const type = z._itemsType || (z._type.types && z._type.types[key]);
//  if(type){
//    if(value && value._isAnything){
//      if(!value._type.isSubType(type))
//        throw `Expected item type is ${type.name} but ${value._type.name} is given.`;
//    } else {
//      value = type(value, ...tale);
//    }
//  }
//  if(!is(value, z._items[key])){
//    if(z._isHot){
//      z._oldValue = z._oldValue || {};
//      z._oldValue[key] = z._items[key];
//      z._newValue = z._newValue || {};
//      z._newValue[key] = value;
//    }
//    z._items[key] = value;
//  }
//  z.transactionEnd();
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

A.test((remove, Obj) => {
  const o = Obj({ q:1, a:2 });
  expect( o._size ).is(2);
  expect( remove(o, 'q').jsValue ).deepEqual({ a:2 });
  expect( o._size ).is(1);
})
.about('Remove element at `i`.')
('remove', (z, key) => {
  const db = nice._db;
  const id = db.findKey({_parent: z._id, _name: key});

  if(id === null)
    return;

  if(nice._db.data._isHot[id]){
    db.update(id, '_type', nice.NotFound);
    db.update(id, '_value', null);
  } else {
    db.delete(id);
  }
  db.update(z._id, '_size', db.getValue(z._id, '_size') - 1);
});

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
//
//A('removeAll', z => {
//  z._isHot && (z._oldValue = z._items);
//  z._type.onCreate(z);
//});


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


M(function map(c, f){
  const res = c._type();
  c.each((v,k) => res.set(f(v, k)));
//  const o = c._items;
//  for(let i in o)
//    res.set(i, f(o[i], i));
  return res;
});


//M('rMap', (c, f) => c._type().apply(res => c.listen({
//  onAdd: (v, k) => res.set(k, f(v, k)),
//  onRemove: (v, k) => res.remove(k)
//})));


M('filter', (c, f) => c.reduceTo(c._type(), (z, v, k) => f(v,k) && z.set(k, v)));


//M('rFilter', (c, f) => c._type().apply(z => c.listen({
//  onAdd: (v, k) => f(v, k) && z.set(k, v),
//  onRemove: (v, k) => z.remove(k)
//})));


M('sum', (c, f) => c.reduce((n, v) => n + (f ? f(v) : v), 0));


C.Function(function some(c, f){
  let res = false;
  c.each((v,k) => {
    if(f(res, v, k)){
      res = true;
      return nice.Stop;
    }
  });
  return res;
//  for(let i in c._items)
//    if(f(c._items[i], i))
//      return true;
//  return false;
});



C
  .about(`Check if every element in colection matches given check`)
  .test(Obj => {
    const o = Obj({a:1,b:2});
    expect(o.every(v => v % 2)).is(false);
    expect(o.every(v => v < 3)).is(true);
    expect(o.every(v => v < 0)).is(false);
  })
  (function every(c, f){
  return !!c.reduce((res, v, k) => res && f(v, k), true);
});


M(function find(c, f){
  let res;
  c.each((v, k) => {
    if(f(v, k)){
      res = v;
      return nice.Stop();
    }
  });
  return res === undefined ? nice.NotFound() : res;
//  for(let i in c._items)
//    if(f(c._items[i], i))
//      return c._items[i];
});


M(function findKey(c, f){
  nice.isFunction(f) || (f = is(f, nice));
  let res;
  c.each((v, k) => {
    if(f(v, k)){
      res = k;
      return nice.Stop();
    }
  });
  return res === undefined ? nice.NotFound() : res;
//  for(let i in c._items)
//    if(f(c._items[i], i))
//      return i;
});


M.Function(function count(o, f) {
  let n = 0;
  o.each((v, k) => f(v, k) && n++);
  return nice.Num(n);
});


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


Mapping.Object('reduceTo', (o, res, f) => {
  _each(o, (v, k) => f(res, v, k));
  return res;
});


reflect.on('type', type => {
  const smallName = nice._decapitalize(type.name);

  function createProperty(z, name, ...as){
    const targetType = z.target;

    if(name[0] !== name[0].toLowerCase())
      throw "Property name should start with lowercase letter. "
            + `"${nice._decapitalize(name)}" not "${name}"`;

    targetType.types[name] = type;

    as.length && (targetType.defaultArguments[name] = as);

//    defGet(targetType.proto, name, function(){
//      const res = this.get(name);
//
////  slows everything but only actual when data was set externaly
////  could be enabled with debug option
////      if(!nice.isSubType(res._type, type))
////        throw `Can't create ${type.name} property. Value is ${res._type.name}`;
//
//      return res;
//    });

    reflect.emitAndSave('Property', { type, name, targetType });
  }

  def(nice.Obj.configProto, smallName, function (name, ...as) {
    createProperty(this, name, ...as);
    return this;
  });
});