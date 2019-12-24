/*
 * 1. setting new(calculated) value
 * 2. recalculate on each use when not hot?
 * 3.
 */

//TODO: empty transactions on empty values
const db = nice._db;

const proxy = new Proxy({}, {
  get (o, k, receiver) {
    if(k[0] === '_')
      return undefined;

    if(k === 'isPrototypeOf')
      return Object.prototype.isPrototypeOf;

    return k in receiver ? receiver[k] : receiver.get(k);
  },
});

nice.registerType({
  name: 'Anything',

  description: 'Parent type for all types.',

  extend (name, by){
    return nice.Type(name, by).extends(this);
  },

  itemArgs0: z => {
    z._compute();
    return z._value;
  },

//set tearDown -> guessType -> assignType -> assignValue

  itemArgs1: (z, v) => {
    if (v && v._isAnything) {
      if(z._isRef){
        const ref = db.getValue(z._id, '_value');
        ref !== v._id && unfollow(ref, z._id);
      } else {
        z._isRef = true;
      }
      db.update(z._id, '_value', v._id);
      Object.setPrototypeOf(z, v._type.proto);
      v._follow(z._id);
    } else {
      if(z._isRef) {
        unfollow(db.getValue(z._id, '_value'), z._id);
        (z._isRef = false);
      }
      z._cellType.setPrimitive(z, v);
    }
    return z;
  },

  setPrimitive: (z, v) => {
    const t = typeof v;
    let type;

    if(v === undefined) {
      type = nice.Undefined;
    } else if(v === null) {
      type = nice.Null;
    } else if(t === 'number') {
      type = Number.isNaN(v) ? nice.NumberError : nice.Num;
    } else if(t === 'function') {
      type = nice.Func;
    } else if(t === 'string') {
      type = nice.Str;
    } else if(t === 'boolean') {
      type = nice.Bool;
    } else if(Array.isArray(v)) {
      type = nice.Arr;
    } else if(v[nice.TYPE_KEY]) {
      type = nice[v[nice.TYPE_KEY]];
    } else if(t === 'object') {
      type = nice.Obj;
    }

    if(type !== undefined) {
      if(type === z._type && !z._isRef)
        return type.setValue(z, v);

      const cellType = z._cellType;
      if(cellType === type || cellType.isPrototypeOf(type)){
        nice._setType(z, type);
        nice._initItem(z, type, v);
        return z;
      }

      const cast = cellType.castFrom && cellType.castFrom[type.name];
      if(cast !== undefined){
        nice._setType(z, type);
        nice._initItem(z, type, cast(v));
        return z
      };

      nice._setType(z, Err);
      nice._initItem(z, Err, type.name, ' to ', cellType.name);
//      nice._initItem(z, type, type.name, ' to ', cellType.name);
      return ;
    }

    throw 'Unknown type';
  },

  itemArgsN: (z, vs) => {
    throw new Error(`${z._type.name} doesn't know what to do with ${vs.length} arguments.`);
  },

  initChildren: () => 0,

  fromValue (_value){
    return Object.assign(this(), { _value });
  },

  setValue (z, value) {
    if(value === z._value)
      return;
    nice._db.update(z._id, '_value', value);
  },

  toString () {
    return this.name;
  },

//  deserialize (v){
//    const res = this();
//    res._value = nice.deserialize(v);
//    return res;
//  },

  _isNiceType: true,

  proto: Object.setPrototypeOf({
    _isAnything: true,

    to (type, ...as){
      nice._setType(this, type);
      nice._initItem(this, type, ...as);
      return this;
    },

    get (key) {
      if(key._isAnything === true)
        key = key();

      return key in this._children
        ? nice._db.getValue(this._children[key], 'cache')
        : nice._createChild(this._id, key, this._type && this._type.types[key]);
    },

    getDeep (...path) {
      let res = this, i = 0;
      while(i < path.length) res = res.get(path[i++]);
      return res;
    },

    get _value() {
      const value = db.getValue(this._id, '_value');
      return this._isRef
        ? nice._db.getValue(value, '_value')
        : value;
    },

    get _type() {
      return this._isRef
        ? db.getValue(db.getValue(this._id, '_value'), '_type')
        : db.getValue(this._id, '_type');
    },

    get _cellType() {
      return db.getValue(this._id, '_cellType');
    },

    set _cellType(v) {
      return db.update(this._id, '_cellType', v);
      return true;
    },

    get _parent() {
      return db.getValue(this._id, '_parent');
    },

    set _parent(v) {
      return db.update(this._id, '_parent', v);
      return true;
    },

    get _isRef() {
      return db.getValue(this._id, '_isRef');
    },

    set _isRef(v) {
      return db.update(this._id, '_isRef', v);
      return true;
    },

    get _children() {
      return db.getValue(this._id, '_children');
    },

    get _order() {
      return this._isRef
        ? db.getValue(db.getValue(this._id, '_value'), '_order')
        : db.getValue(this._id, '_order');
//      return db.getValue(this._id, '_order');
    },

    get _name() {
      return db.getValue(this._id, '_name');
    },

    set _name(v) {
      return db.update(this._id, '_name', v);
      return true;
    },

    get _size() {
      return this._isRef
        ? db.getValue(db.getValue(this._id, '_value'), '_size')
        : db.getValue(this._id, '_size');
      //nice.reflect.emit('itemUse', z);
      return db.getValue(this._id, '_size');
    },

    //TODO: forbid public names with _
//        const type = target._get('_type');
//        if(type.types[key])
//          return f.get(key);
//
//        if(type.readOnlys[key])
//          return type.readOnlys[key](f);
//
//        return target[key];

    valueOf () {
      return '_value' in this ? ('' + this._value) : undefined;
    },

    toString () {
      return this._type.name + '('
        + ('_value' in this ? ('' + this._value) : '')
        + ')#' + this._id;
    },

    super (...as){
      const type = this._type;
      const superType = type.super;
//      ??
//      this._type = superType;
      superType.initBy(this, ...as);
//      this._type = type;
      return this;
    },

    apply(f){
      try {
        f(this);
      } catch (e) { return nice.Err(e) }
      return this;
    },

    Switch (...vs) {
      const s = Switch(this, ...vs);
      return defGet(s, 'up', () => {
        s();
        return this;
      });
    },

    SwitchArg (...vs) {
      const s = Switch(this, ...vs);
      s.checkArgs = vs;
      return defGet(s, 'up', () => {
        s();
        return this;
      });
    },

//    setValue (v) {
//      const z = this;
//      if (v && v._isAnything) {
//        nice._setType(z, nice.Reference);
//        nice._initItem(z, nice.Reference, v);
//      } else {
//        z._cellType.setPrimitive(z, v);
//      }
//    },

    _compute (follow = false){
      this._status === 'cold' && this._doCompute(follow);
    },

    _doCompute (follow = false) {
      this._status = 'cooking';
      this._by(nice, this, follow, ...this._args);
      this._status = follow ? 'cooking' : 'cold';
    },

    listen (f, key) {
      key === undefined && (key = f);
      if(f === undefined)
        throw `Undefined can't listen`;

      const z = this;
      let ls = db.getValue(z._id, '_listeners');
      ls === undefined && db.update(z._id, '_listeners', ls = new Map());

      if(ls.has(key))
        return;

      let needHot = false;

      if(f._isAnything){
        needHot = f._status === 'hot';
      } else {
        typeof f === 'function' || (f = objectListener(f));
        needHot = true;
      }

      ls.set(key, f);
      if(needHot){
        this._compute(true);
        this.isPending() || f(this);//notifyItem(f, this);
      }
    },

    listenItems (f, key) {
      key === undefined && (key = f);

      const db = nice._db;
      let ls = db.getValue(this._id, '_itemsListeners');
      ls === undefined && db.update(this._id, '_itemsListeners', ls = new Map());

      if(ls.has(key))
        return;

      typeof f === 'function' || (f = objectListener(f));

      ls.set(key, f);
      this._compute();
      this._status = 'hot';
      this.isPending() || this.each(f);
    },

    _follow (target) {
      expect(typeof target).is('number');
      let ls = db.getValue(this._id, '_links');
      ls === undefined && db.update(this._id, '_links', ls = new Set());

      if(ls.has(target))
        return;

      ls.add(target);
      //TODO:
//      this._compute();
//      this._status = 'hot';
//      this.isPending() || this.each(f);

    },

    get _deepListeners(){
      return nice._db.getValue(this._id, '_deepListeners');
    },

    set _deepListeners(v){
      nice._db.update(this._id, '_deepListeners', v);
      return true;
    },

    listenDeep (f, key) {
      key === undefined && (key = f);

      const db = nice._db;
      let ls = db.getValue(this._id, '_deepListeners');
      ls === undefined && db.update(this._id, '_deepListeners', ls = new Map());

      if(ls.has(key))
        return;

      expect(typeof f).is('function');

      ls.set(key, f);
      this._compute();
      this._status = 'hot';
      notifyDown(f, this);
    },

    get _status() {
      return nice._db.getValue(this._id, '_status');
    },

    set _status(v) {
      if(!(v === 'hot' || v === 'cold' || v === 'cooking'))
        throw 'Bad status ' + v;
      return nice._db.update(this._id, '_status', v);
    },

//    listenOnce (f, target) {
//      this._isHot || this._compute();
//
//      if(this._isResolved())
//        return f(this);
//
//      const key = target || f;
//      const _f = v => {
//        f(v);
//        this.unsubscribe(key);
//      };
//
////      this._subscribers.set(key, f);
//      this._set('_isHot', true);
//
//      return this;
//    },

    _has (k) {
      return k in this;
    },

//    unsubscribe (target){
//      this._subscribers.delete(target);
//      if(!this._subscribers.size){
//        this._set('_isHot', false);
//        this._subscriptions &&
//          this._subscriptions.forEach(_s => _s.unsubscribe(this));
//      }
//    },
    [Symbol.toPrimitive]() {
      return this.toString();
    }
  }, proxy),

  configProto: {
    extends (parent){
      const type = this.target;
      nice.isString(parent) && (parent = nice[parent]);
      expect(parent).isType();
      nice.extend(type, parent);
      return this;
    },

    about (...a) {
      this.target.description = nice.format(...a);
      return this;
    },

    ReadOnly (...a){
      nice.ReadOnly[this.target.name](...a);
      return this;
    },
  },

  types: {},

  static (...a) {
    const [name, v] = a.length === 2 ? a : [a[0].name, a[0]];
    def(this, name, v);
    return this;
  }
});


Test(function getDeep(Obj){
  const o = Obj({q:{a:2}});
  expect(o.getDeep('q', 'a')).is(2);
  expect(o.getDeep('q', 'z')).isNotFound();
  expect(o.getDeep() === o).isTrue();
});


Test(function listen(Num){
  const n = Num();
  let res;
  n.listen(v => res = v());
  expect(res).is(0);
  n(1);
  expect(res).is(1);
});


Test(function listenItems(Obj, Spy){
  const o = Obj({q:1});
  const spy = Spy();
  o.listenItems(spy);
  expect(spy).calledOnce().calledWith(1, 'q');
  o.set('a', 2);
//  expect(spy).calledTwice(); //TODO: avoud call with  (0, a)
  expect(spy).calledWith(2, 'a');
});

Test(function listenItems(Obj, Num, Spy){
  const n = Num();
  const o = Obj({z: n});
  const spy = Spy();

  o.listenItems(spy);
  expect(spy).calledOnce().calledWith(0, 'z').calledWith(n, 'z');

  n(2);
  expect(spy).calledTwice().calledWith(2, 'z');
});


function notifyDown(f, o){
  if(o.isPending())
    return;
  f(o);
  o.isObj() && o.each(v => notifyDown(f, v));
}


Test(function listenDeep(Obj, Spy){
  const o = Obj({q:{a:2}});
  const spy = Spy();
  o.listenDeep(spy);
  expect(spy).calledWith(o).calledWith(o.q).calledWith(2);
  o.set('z', 1);
  expect(spy).calledWith(1);
//  expect(spy).calledTimes(4);
  o.q.set('x', 3);
  expect(spy).calledWith(3);
//  expect(spy).calledTimes(5);
});

//function notify(z){
//  let needNotification = '_oldValue' in z;
//
//  if(needNotification && z._subscribers){
//    z._notifing = true;
//    z._isResolved() && z._subscribers.forEach(s => notifyItem(s, z));
//    z._notifing = false;
//  }
//
//  delete z._oldValue;
//};

//function notifyItem(f, value){
//  f._isAnything ? f._doCompute() : f(value);
//}

function unfollow (sourceId, targetId) {
  expect(typeof sourceId).is('number');
  expect(typeof targetId).is('number');
  const db = nice._db;
  let ls = db.getValue(sourceId, '_links');
  ls && ls.delete(targetId);
};


function objectListener(o){
  return v => {
    for(let i in o){
      if(i !== '*' && v['is' + i]())
        return o[i](v);
    }
    o['*'] && o['*'](v);
  };
}

Anything = nice.Anything;

//const coreId = nice._db.push({}).lastId;
//nice._db.core = nice._db.getValue(coreId, 'cache');


//defGet(Anything.proto, function jsValue(z) { return z._value; });
defGet(Anything.proto, 'switch', function () { return Switch(this); });


nice.ANYTHING = Object.seal(create(Anything.proto, new String('ANYTHING')));
//Anything.proto._type = Anything;


reflect.on('type', t =>
  t.name && Mapping.Anything('to' + t.name, function (...as) {
    return this.to(t, ...as);
  })
);

