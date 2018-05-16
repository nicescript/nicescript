
nice.Type({
    title: 'Object',
    extends: nice.Value,
    creator: () => {
      const f = (...a) => {
        if(a.length === 0)
          return f.getResult();

        if(a.length === 1 && a[0] === undefined)
          return f._parent || f;

        if(a.length === 1 && a[0] !== undefined && !is.object(a[0]))
          return f.get(a[0]);

        f.setValue(...a);
        return f._parent || f;
      };
      return f;
    },
  })
  .ReadOnly(function values(){
    let a = nice.Array();
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
    return Object.keys(this.getResult()).reduce(n => n + 1, 0);
  }})
  .Action(function itemsType(z, t){
    z._itemsType = t;
  });


Object.assign(nice.Object.proto, {
  setValue: function (...a){
    let vs = a[0];

    if(!is.object(vs)){
      let o = {};
      o[vs] = a[1];
      vs = o;
    }
    _each(vs, (v, k) => this.set(k, v));
  },

  setByType: function (key, type, value){
    this.getResult()[key] = type.saveValue(value
      ? value
      : type.defaultValue());
  }
});

const F = Func.Object, M = Mapping.Object, A = Action.Object, C = Check.Object;

M(function has(z, i) {
  if(i.pop){
    if(i.length === 1){
      i = i[0];
    } else {
      const head = i.shift();
      return z.has(head)() ? z.get(head).has(i) : false;
    }
  }

  return z.getResult().hasOwnProperty(i) ? true : false;
});


M(function get(z, i) {
  if(i.pop){
    if(i.length === 1){
      i = i[0];
    } else {
      return z.get(i.shift()).get(i);
    }
  }
  const vs = z.getResult();

  if(!vs.hasOwnProperty(i))
    return nice.NOT_FOUND;

  const res = nice.toItem(vs[i]);
  res._parent = z;
  res._parentKey = i;
  res.setResult = setResult.bind(res);
  res.getResult = getResult.bind(res);
  return res;
});


A('set', (z, path, v) => {
  let data = z.getResult();
  let k = path;
  if(path.pop){
    while(path.length > 1){
      k = path.shift();
      if(!data.hasOwnProperty(k)){
        data[k] = {};
        data = data[k];
      } else if(data[k]._nt_){
        if(typeof data[k]._nv_ !== 'object')
          throw `Can't set property ${k} of ${data[k]}`;
        else
          data = data[k]._nv_;
      } else if(typeof data[k] !== 'object') {
        throw `Can't set property ${k} of ${data[k]}`;
      } else {
        data = data[k];
      }
    }
    k = path[0];
  }
  const type = z._itemsType;

  data[k] = type
    ? nice.fromItem(v._type && v._type === type ? v : type(v))
    : Switch(v)
      .Box.use(v => v)
      .primitive.use(v => v)
      .nice.use(nice.fromItem)
      .object.use(nice.saveValue)
      .function.use(v => v)
      ();

  return z;
});


Func.Nothing.function('each', () => 0);

F(function each(o, f){
  for(let k in o.getResult())
    if(f(o.get(k), k) === nice.STOP)
      break;
  return o;
});


F('reverseEach', (o, f) => {
  Object.keys(o.getResult()).reverse().forEach(k => f(o.get(k), k));
});


A('assign', (z, o) => _each(o, (v, k) => z.set(k, v)));

A('remove', (z, i) => delete z.getResult()[i]);
A('removeAll', z => z.setResult(z._type.defaultValue()));


function setResult(v){
  this._parent.getResult()[this._parentKey] = this._type.saveValue(v);
};


function getResult(){
  return this._type.loadValue(this._parent.getResult()[this._parentKey]);
};


nice._on('Type', function defineReducer(type) {
  const title = type.title;
  if(!title)
    return;

  nice.collectionReducers[title] = function(f, init){
    return this.collection.reduceTo(nice[title](), f, init);
  };
});



//['max','min','hypot'].forEach(name => {
//  nice.Object.define(name, function (f) {
//    return nice.Number().by(z =>
//      z(Math[name](...nice.mapArray(f || (v => v()), z.use(this)())))
//    );
//  });
//});


M(function reduce(o, f, res){
  for(let k in o.getResult())
    res = f(res, o.get(k), k);
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
  return c.reduceTo.Number((sum, v) => sum.inc(f ? f(v) : v));
});


C(function some(c, f){
  const items = c.getResult();
  for(let i in items)
    if(f(items[i], i))
      return true;
  return false;
});


C(function every(c, f){
  const items = c.getResult();
  for(let i in items)
    if(!f(items[i], i))
      return false;
  return true;
});

//Func.Object(function includes(c, v){
//  const items = c.getResult();
//
//  if(items.includes)
//    return items.includes(v);
//
//  for(let i in items)
//    if((items[i] === v))
//      return true;
//
//  return false;
//});

M(function find(c, f){
  const items = c.getResult();
  for(let i in items)
    if(f(items[i], i))
      return items[i];
  return nice.NotFound;
});


M(function findKey(c, f){
  const items = c.getResult();
  for(let i in items)
    if(f(items[i], i))
      return i;
  return nice.NotFound;
});


M.function(function count(o, f) {
  let n = 0;
  o.each((v, k) => f(v, k) && n++);
  return nice.Number(n);
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


nice._on('Type', type => {
  def(nice.Object.configProto, type.title, function (name, by) {
    const cfg = { type }, targetType = this.target;

    if(is.function(name) && name.name){
      cfg.by = name;
      cfg.key = name.name;
    } else {
      cfg.key = name;
      if(by && (is.Anything(by) || !is.function(by))){
        cfg.value = by;
      } else {
        cfg.by = by;
      }
    }

    if(cfg.key[0] !== cfg.key[0].toLowerCase())
      throw "Property name should start with lowercase letter. "
            + `"${nice._deCapitalize(cfg.key)}" not "${cfg.key}"`;

    targetType.types = this.types || {};
    targetType.types[cfg.key] = type;

    defGet(targetType.proto, cfg.key, function(){
      if(this.getResult()[cfg.key] === undefined){
        this.setByType(cfg.key, type, cfg.value);
      }
      const res = this.get(cfg.key);

      if(!is.subType(res._type, type))
        throw `Can't create ${type.title} property. Value is ${res._type.title}`;

      return res;
    });

    return this;
  });
});