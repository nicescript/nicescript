nice.Type({
    name: 'Obj',
    extends: nice.Value,
    onCreate: z => z._items = {},

//    defaultValue: function() {
//      return nice.create(this.defaultResult,
//          this === nice.Obj ? {} : { _nt_: this.name });
//    },

    itemArgs0: z => z._items,
    itemArgs1: (z, o) => {
      const t = typeof o;
      if( t !== 'object' )
        throw z._type.name + ` doesn't know what to do with ` + t;
      _each(o, (v, k) => z.set(k, v));
    },
    itemArgsN: (z, os) => _each(os, o => z(o)),

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

        const type = z._type.types[i] || this._itemsType;
        const item = nice._newItem(type, z, i);
//        const thisResult = this._getResult();
//        if(typeof thisResult === 'object' && i in thisResult){
//          const result = thisResult[i];
//          const vType = nice.typeOf(result);
//          if(type && !is.subType(vType, type)) {
//            throw `Can't create ${type.name} from ${vType.name}: ${JSON.stringify(result)}`;
//          } else {
//            nice._assignType(item, vType);
//          }
//        } else {
//  //        if(defaultValue !== undefined){
//  //          type && nice._assignType(item, type || nice.typeOf(defaultValue));
//  //          thisResult[i] = defaultValue;
//  //        } else {
          !type && nice._assignType(item, nice.NotFound);
  //        }
//        }
        return z._items[i] = item;
      },

//      setDeep(path, v){
//        return this.getDeep(path)(v);
//      },

      set: function(i, v) {
        this.get(i)(v);
        return this;
  //      const z = this;
  //      let data = z._getResult();
  //      let k = path;
  //      if(path.pop){
  //        while(path.length > 1){
  //          k = nice.unwrap(path.shift());
  //          if(!data.hasOwnProperty(k)){
  //            data[k] = {};
  //            data = data[k];
  //          } else if(data[k]._nt_){
  //            if(typeof data[k] !== 'object')
  //              throw `Can't set property ${k} of ${data[k]}`;
  //            else
  //              data = data[k];
  //          } else if(typeof data[k] !== 'object') {
  //            throw `Can't set property ${k} of ${data[k]}`;
  //          } else {
  //            data = data[k];
  //          }
  //        }
  //        k = path[0];
  //      }
  //      k = nice.unwrap(k);
  //      const type = z._itemsType;
  //
  //      data[k] = type
  //        ? (v._type && v._type === type ? v : type(v))._getResult()
  //        : Switch(v)//TODO: simlify maybe
  //          .Box.use(v => v)
  //          .primitive.use(v => v)
  //          .nice.use(v => v._getResult())
  //          .Object.use(v => v)
  //          .function.use(v => v)
  //          ();
  //      z._notifyUp();
  //
  //      return z;
      },

    }

//    itemArgs: (z, ...a) => {
//      let k = a[0];
//
//      if(a.length === 1 && k === undefined)
//        throw "Can't use undefined as key.";
//
//      if(is.Str(k))
//        k = k();
//
//      if(a.length === 1 && k !== undefined && !is.Object(k) && !is.Obj(k))
//        return z.get(k);
//
//      z.setValue(...a);
//    },
//    itemNoArgs: z => z._getResult(),
  })
  .about('Parent type for all composite types.')
  .ReadOnly(function values(){
    let a = nice.Arr();
    this.each(v => a.push(v));
    return a;
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
//  setValue: function (...a){
//    let vs = a[0];
//
//    if(!is.Object(vs)){
//      let o = {};
//      o[vs] = a[1];
//      vs = o;
//    }
//    _each(vs, (v, k) => this.set(k, v));
//    return this._parent || this;
//  },
//
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

F(function each(o, f){
  for(let k in o._items)
    if(k !== '_nt_')
      if(is.Stop(f(o._items[k], k)))
        break;
  return o;
});


F('reverseEach', (o, f) => {
  Object.keys(o._items).reverse().forEach(k => f(o._items[k], k));
});


A('assign', (z, o) => _each(o, (v, k) => z.set(k, v)));

//TODO: make transaction save
//A('remove', (z, i) => delete z._getResult()[i]);
//A('removeAll', z => z._transaction(z => z._type.onCreate(z)));


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


M(function filter(c, f){
  return c._type().apply(z => c.each((v, k) => f(v,k) && z.set(k, v)));
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

  function createProperty(z, name, value){
    const targetType = z.target;

    if(name[0] !== name[0].toLowerCase())
      throw "Property name should start with lowercase letter. "
            + `"${nice._decapitalize(name)}" not "${name}"`;

    targetType.types[name] = type;

    value !== undefined && (targetType.defaultResult[name] = value);

    defGet(targetType.proto, name, function(){
      const res = this.get(name);

      if(!is.subType(res._type, type))
        throw `Can't create ${type.name} property. Value is ${res._type.name}`;

      return res;
    });

    nice.emitAndSave('Property', { type, name, targetType });
  }

  def(nice.Obj.configProto, smallName, function (name, value) {
    createProperty(this, name, value);
    return this;
  });
});