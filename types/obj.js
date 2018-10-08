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

    fromValue: function(v){
      const res = this();
      Object.assign(res._items, nice._map(v, nice.fromJson));
      return res;
    },

    initChildren(item){
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

      get(i) {
        const z = this;

        if(i._isAnything === true)
          i = i();

        if(z._items.hasOwnProperty(i)){
          return z._items[i];
        }

        const type = z._type.types[i];
        return type
          ? this._items[i] = type()
          : nice.NotFound();
      },

//      setDeep(path, v){
//        return this.getDeep(path)(v);
//      },

      set: function(i, v, ...tale) {
        const z = this;

        if(i._isAnything === true)
          i = i();

        z.transaction(() => {
          let res;
          if(v !== z._items[i]){
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
            res = nice(v);
          }
          z._items[i] = res;
        });
        return z;
      },

      setDefault: function (i, v, ...tale) {
        const z = this;

        if(i._isAnything === true)
          i = i();

        if(!z._items.hasOwnProperty(i))
          z.set(i, v, ...tale);
        return z;
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
    _each(z._items, (v, k) => o[k] = v.jsValue);
    Switch(z._type.name).String.use(s =>
      ['Arr', 'Obj'].includes(s) || (o[nice.TYPE_KEY] = s));
    return o;
  })
  .addProperty('reduceTo', { get: function () {
    const c = this;

    const f = (item, f, init) => {
      init && init(item);
      c.each((v, k) => f(item, c.get(k), k));
      return item;
    };

    f.collection = c;

    return create(nice.collectionReducers, f);
  }})
  .addProperty('size', { get: function () {
    return Object.keys(this._items).reduce(n => n + 1, 0);
  }})
  .Action(function itemsType(z, t){
    z._itemsType = t;
  });


Object.assign(nice.Obj.proto, {
//  setByType: function (key, type, value){
//    this._items[key] = value || type.defaultValue();
//  },

//  boxify: function () {
//    const boxProto = Box.proto;
//    Object.assign(this, {
//      _subscribers: [],
//      getItem: function () {
//
//      },
//      _notify: function (){
//        if(this._subscribers){
//          this._notifing = true;
//          this._subscribers.forEach(s => {
//            if(s.doCompute){
//              s._notifing || s.doCompute();
//            } else {
//              s(this);
//            }
//          });
//          this._notifing = false;
//        }
//        this._paret && this._parent._notify && this._parent._notify();
//      },
//      listen: function listen(f) {
//        const ss = this._subscribers;
//
//        if(!ss.includes(f)){
//          ss.push(f);
//          f(this);
//        }
//
//        return this;
//      },
//      transactionStart: boxProto.transactionStart,
//      transactionEnd: boxProto.transactionEnd,
//      transaction: boxProto.transaction
//    });
//    return this;
//  }
});

const F = Func.Obj, M = Mapping.Obj, A = Action.Obj, C = Check.Obj;

Func.Nothing.function('each', () => 0);

C('has', (o, k) => o._items.hasOwnProperty(k));

F(function each(o, f){
  for(let k in o._items)
    if(is.Stop(f(o._items[k], k)))
      break;
  return o;
});


F('reverseEach', (o, f) => {
  Object.keys(o._items).reverse().forEach(k => f(o._items[k], k));
});


A('assign', (z, o) => _each(o, (v, k) => z.set(k, v)));

A('replaceAll', (z, o) => {
  //TODO: check type
  z._oldValue = z._items;
  z._items = o._items;
});

A('remove', (z, i) => {
  z._oldValue = z._oldValue || {};
  z._oldValue[i] = z._items[i];
  delete z._items[i];
});

A('removeAll', z => {
  z._oldValue = z._items;
  z._type.onCreate(z);
});


nice._on('Type', function defineReducer(type) {
  const name = type.name;
  if(!name)
    return;

  nice.collectionReducers[name] = function(f, init){
    return this.collection.reduceTo(nice[name](), f, init);
  };
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
  return c.reduceTo.Array((a, v, k) => a.push(f(c.get(k), k)));
});


Mapping.Nothing.function('map', () => nice.Nothing);
M(function map(c, f){
  const res = c._type();
  for(let i in c())
    res.set(i, f(c.get(i), i));
  return res;
});


M(function rMap(c, f){
  const res = c._type();
  c.listen({
    onAdd: (v, k) => res.set(k, f(v, k)),
    onRemove: (v, k) => res.remove(k)
  });
  return res;
});


M(function filter(c, f){
  return c._type().apply(z => c.each((v, k) => f(v,k) && z.set(k, v)));
});

M(function rFilter(c, f){
  const res = c._type();
  c.listen({
    onAdd: (v, k) => f(v, k) && res.set(k, v),
    onRemove: (v, k) => res.remove(k)
  });
  return res;
});

M(function sum(c, f){
  return c.reduceTo.Num((sum, v) => sum.inc(f ? f(v) : v()));
});


C(function some(c, f){
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

//Func.Obj(function includes(c, v){
//  if(c._items.includes)
//    return c._items.includes(v);
//
//  for(let i in c._items)
//    if((c._items[i] === v))
//      return true;
//
//  return false;
//});

M(function find(c, f){
  for(let i in c._items)
    if(f(c._items[i], i))
      return c._items[i];
  return nice.NotFound();
});


M(function findKey(c, f){
  for(let i in c._items)
    if(f(c._items[i], i))
      return i;
  return nice.NotFound();
});


M.function(function count(o, f) {
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
//
//
//M.undefined('includes', () => false);
//
//M('includes', (o, t) => {
//  for(let i in o)
//    if(o[i] === t)
//      return true;
//  return false;
//});
//
//
//M.function('mapAndFilter', (o, f) => nice.with({}, res => {
//  for(let i in o){
//    let v = f(o[i], i);
//    v && (res[i] = v);
//  }
//}));

M(function getProperties(z){
  const res = [];
  for(let i in z) z[i]._isProperty && res.push(z[i]);
  return res;
});


nice._on('Type', type => {
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

      if(!is.subType(res._type, type))
        throw `Can't create ${type.name} property. Value is ${res._type.name}`;

      return res;
    });

    nice.emitAndSave('Property', { type, name, targetType });
  }

  def(nice.Obj.configProto, smallName, function (name, ...as) {
    createProperty(this, name, ...as);
    return this;
  });
});