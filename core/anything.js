/*
 * 1. setting new(calculated) value
 * 2. recalculate on each use when not hot?
 * 3.
 */

//TODO: empty transactions on empty values

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
        const ref = z._value;
        ref !== v._id && unfollow(ref, z);
      } else {
        z._isRef = true;
      }
      z._value = v;
      Object.setPrototypeOf(z, v._type.proto);
      redirectExistingChildren(z, v);
      v._follow(z);
    } else {
      tearDown(z);
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
        tearDown(z);
        nice._initItem(z, type, [v]);
        return z;
      }

      const cast = cellType.castFrom && cellType.castFrom[type.name];
      if(cast !== undefined){
        tearDown(z);
        nice._initItem(z, type, [cast(v)]);
        return z;
      };

      z.toErr(`Can't cast`, type.name, 'to', cellType.name);
      return ;
    }

    throw 'Unknown type';
  },

  itemArgsN: (z, vs) => {
    throw new Error(`${z._type.name} doesn't know what to do with ${vs.length} arguments.`);
  },

  fromValue (_value){
    return Object.assign(this(), { _value });
  },

  //TODO: change to setter
  setValue (z, value) {
    if(value === z.__value)
      return;

    z.__value = value;
    notifyItem(z);
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
      tearDown(this);
      nice._initItem(this, type, as);
      return this;
    },

    //TODO:0 don't allow to edit ref's children
    get (key) {
      if(key._isAnything === true)
        key = key();

      if(key in this._children)
        return this._children[key];

      if(this._isRef){
        const res = nice._createChild(this, key);
        res(this.__value.get(key));
        return res;
      }

      const type = this._type;

      if(key in type.defaultArguments)
        return nice._createChildArgs(this, key,
          type && type.types[key], type.defaultArguments[key]);

      return nice._createChild(this, key, type && type.types[key]);
    },

    getDeep (...path) {
      let res = this, i = 0;
      while(i < path.length) res = res.get(path[i++]);
      return res;
    },

    get _value() {
      const value = this.__value;
      return this._isRef
        ? value._value
        : value;
    },

    set _value(v) {
      this.__value = v;
      return true;
    },

    get _type() {
      return this._isRef
        ? this.__value._type
        : this.__type;
    },

//    get _cellType() {
//      return db.getValue(this._id, '_cellType');
//    },
//
//    set _cellType(v) {
//      return db.update(this._id, '_cellType', v);
//      return true;
//    },

//    get _isRef() {
//      return db.getValue(this._id, '_isRef');
//    },
//
//    set _isRef(v) {
//      return db.update(this._id, '_isRef', v);
//      return true;
//    },

    get _children() {
      if(!('__children' in this))
        this.__children = {};
      return this.__children;
    },

    get _order() {
      return this._isRef
        ? this._value._order
        : this._order;
    },

    get _name() {
      return this.__name;
    },

    set _name(v) {
      if(v === null || v === undefined)
        throw `Can't set empty name`;

      if('__name' in this)
        throw `Can't change name`;

      const index = this._parent._children;

      if(v in index)
        throw `Can't duplicate name`;

      this.__name = v;
      index[v] = this;

      return true;
    },

    get _size() {
      const target = this._isRef ? this._value : this;
      if(!('__size' in target))
        target.__size = 0;
      return target.__size;
    },

    set _size(n) {
      this.__size = n;
      return true;
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
      let ls = z._listeners;
      ls === undefined && (z._listeners = ls = new Map());

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

      let ls = this._itemsListeners;
      ls === undefined && (this._itemsListeners = ls = new Map());

      if(ls.has(key))
        return;

      typeof f === 'function' || (f = objectListener(f));

      ls.set(key, f);
      this._compute();
      this._status = 'hot';
      this.isPending() || this.each(f);
    },

    _follow (target) {
      expect(target._isAnything).is(true);
      let ls = this._links;
      ls === undefined && (this._links = ls = new Set());

      if(ls.has(target))
        return;

      ls.add(target);
      //TODO:
//      this._compute();
//      this._status = 'hot';
//      this.isPending() || this.each(f);

    },

    listenDeep (f, key) {
      key === undefined && (key = f);

      let ls = this._deepListeners;
      ls === undefined && (this._deepListeners = ls = new Map());

      if(ls.has(key))
        return;

      expect(typeof f).is('function');

      ls.set(key, f);
      this._compute();
      this._status = 'hot';
      notifyDown(f, this);
    },

    get _status() {
      if(!('__status' in this))
        this.__status = 'cooking';
      return this.__status;
    },

    set _status(v) {
      if(!(v === 'hot' || v === 'cold' || v === 'cooking'))
        throw 'Bad status ' + v;
      return this.__status = v;
    },

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

function unfollow (source, target) {
  let ls = source._links;
  if(ls){
    expect(source._isAnything).is(true);
    expect(target._isAnything).is(true);
    ls.delete(target);
  }
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


function redirectExistingChildren(z, v) {
  //optimization: maby check if child is used before creating one at `v`
  for(let k in z._children){
    z.get(k)(v.get(k));
  }
};


function tearDown (z) {
  if(z._isRef){
    unfollow(z.__value, z);
    z._isRef = false;
  }
  for(let k in z._children){
    z.get(k).toNotFound();
  }
}


Anything = nice.Anything;

defGet(Anything.proto, 'switch', function () { return Switch(this); });


nice.ANYTHING = Object.seal(create(Anything.proto, new String('ANYTHING')));
//Anything.proto._type = Anything;


reflect.on('type', t =>
  t.name && def(Anything.proto, 'to' + t.name, function (...as) {
    tearDown(this);
    return nice._initItem(this, t, as);
  })
);


function notifyLink(item){
  //TODO: make sure there is parent for every child
  if(!item)
    return;

  const type = item._type;
  Object.setPrototypeOf(item, type.proto);
//  db.emit('_type', id, type);//TODO:, old??
  notifyItem(item);
}


function notifyItem(z) {
  const ls = z._listeners;
  ls && ls.forEach(f => f(z));

  const links = z._links;
  links && links.forEach(notifyLink);

  const parent = z._parent;
  if(parent !== undefined){
    const ls = parent._itemsListeners;
    const name = z._name;
    ls && ls.forEach(f => f(z, name));
  }

  let nextParent = parent;
  const path = [];
  //TODO: protection from loop
  while(nextParent !== undefined){
    path.unshift(nextParent);

    const ls = nextParent._deepListeners;
    ls && ls.forEach(f => f(z, path));

    const links = nextParent._links;
    //TODO: do not create childeren, only notify existing
    //TODO: test
    links &&
      links.forEach(link => notifyLink(link.getDeep(...path)));

    nextParent = nextParent._parent;
  }
}
