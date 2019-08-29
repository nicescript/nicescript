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

  itemArgs0: z => z._value,

  itemArgs1: (z, v) => {
    if (v && v._isAnything) {
      z.transactionStart();
      nice._setType(z, nice.Reference);
      nice._initItem(z, nice.Reference, v);
      z.transactionEnd();
    } else {
      z._cellType.setPrimitive(z, v);
    }
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
      type = nice.Function;
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

      const cast = cellType.castFrom[type.name];
      if(cast !== undefined){
        nice._setType(z, type);
        nice._initItem(z, type, cast(v));
        return z
      };

      nice._setType(z, Err);
      nice._initItem(z, type, type.name, ' to ', cellType.name);
      return ;
    }

    throw 'Unknown type';
  },

  itemArgsN: (z, vs) => {
    throw `${z._type.name} doesn't know what to do with ${vs.length} arguments.`;
  },

  initChildren: () => 0,

  fromValue (_value){
    return Object.assign(this(), { _value });
  },

  setValue (z, value) {
    if(value === z._value)
      return;
    z.transaction(() => nice._db.update(z._id, '_value', value));
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

    get (key) {
      if(key._isAnything === true)
        key = key();

      return key in this._children
        ? nice._db.getValue(this._children[key], 'cache')
        : nice._createChild(this._id, key, this._type.types[key]);
    },

    get _value() {
      return nice._db.getValue(this._id, '_value');
    },

    get _type() {
      return nice._db.getValue(this._id, '_type');
    },

    get _cellType() {
      return nice._db.getValue(this._id, '_cellType');
    },

    get _parent() {
      return nice._db.getValue(this._id, '_parent');
    },

    set _parent(v) {
      return nice._db.update(this._id, '_parent', v);
      return true;
    },

    get _children() {
      return nice._db.getValue(this._id, '_children');
    },

    get _order() {
      return nice._db.getValue(this._id, '_order');
    },

    get _name() {
      return nice._db.getValue(this._id, '_name');
    },

    set _name(v) {
      return nice._db.update(this._id, '_name', v);
      return true;
    },

    get _size() {
      //nice.reflect.emit('itemUse', z);
      return nice._db.getValue(this._id, '_size');
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

    _compute (){
//      if(this._transactionDepth)
//        return;

      if(!this._functionName || this._isHot)
        return;

      this._doCompute();
    },
//    _compute () {
////      return !nice.isNeedComputing(this._value) || this._transactionDepth
////        ? this._value : this._doCompute();
//    },

    _doCompute () {
      this._args.forEach(a => {
        if(a._isAnything){
          a._isHot || a._compute();
          a.listen(this);
        }
      });

      try {
        const result = nice[this._functionName](...this._args);
        this._changeValue(result);
      } catch (e) {
        this._changeValue('Error while _doCompute', Err)
      }

    },

    listen (f, key) {
      key === undefined && (key = f);

      const z = this, db = nice._db;
      let ls = db.getValue(z._id, '_listeners');
      ls === undefined && db.update(z._id, '_listeners', ls = new Map());

      if(ls.has(key))
        return;

      let isHot = false;

      if(f._isAnything){
        isHot = f._isHot;
      } else {
        typeof f === 'function' || (f = objectListener(f));
        isHot = true;
      }

      ls.set(key, f);
      if(isHot){
        this._compute();
        this._set('_isHot', true);
        this.isPending() || notifyItem(f, this);
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
      this._set('_isHot', true);
      this.isPending() || this.each(f);
    },

    get _deepListeners(){
      return nice._db.getValue(this._id, '_deepListeners');
    },

    set _deepListeners(v){
      nice._db.update(this._id, '_deepListeners', v);
      return true;
    },

    listenDeep (f) {
      typeof f === 'function' || (f = objectListener(f));
    },

    get _transaction () {
      return nice._db.getValue(this._id, '_transaction');
    },

    transactionStart (){
      if('_locked' in this)
        throw nice.LOCKED_ERROR;
//      if(!'_transactionDepth' in this){
//        this._transactionDepth = 0;
//      }
//      this._transactionDepth++;
      this._transaction.depth++;
      return this;
    },

    transactionEnd (){
      const tr = this._transaction;
      if(--tr.depth > 0)
        return false;

      const db = nice._db, z = this;
      tr.depth = 0;

      if('_value' in tr || '_type' in tr){
        const ls = db.getValue(z._id, '_listeners');
        ls && ls.forEach(f => notifyItem(f, z));

        const parentId = z._parent;
        if(parentId !== undefined){
          const ls = db.getValue(parentId, '_itemsListeners');
          ls && ls.forEach(f => f(z));
        }

        let nextParentId = z._parent;
        let path = [];
        //TODO: protection from loop
        while(nextParentId !== undefined){
          const ls = db.getValue(nextParentId, '_deepListeners');
          path.unshift(nextParentId);
          ls && ls.forEach(f => f(z, path));
          nextParentId = db.getValue(nextParentId, '_parent');
        }
      }

      delete this._transaction;
    },

//    transactionRollback (){
//      this._transactionDepth > 0 && (this._result = this.initState);
//      this._transactionDepth = 0;
//      this.initState = null;
//      delete this._newValue;
//      return this;
//    },

    get _isHot() {
      if(this._has('_hot'))
        return this._has('_hot');
      return false;
    },

    set _isHot(v) {
      this._set('_hot', !!v);
    },

     _isResolved (){
      return !this.isPending() && !this.isNeedComputing();
    },


    transaction (f) {
      this.transactionStart();
      f(this);
      this.transactionEnd();
      return this;
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

    //TODO:0 remove
    _get (k) {
      if(k in this)
        return this[k];
      return undefined;
    },

    //TODO:0 remove
    _set (k, v) {
      this[k] = v;
      return this;
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

    //TODO: replace with Mapping??
    ReadOnly (...a){
      const [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
      expect(f).isFunction();
      defGet(this.target.proto, name, function() {
        return f(this);
      });
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


Test(function listen(Num){
  const n = Num();
  let res;
  n.listen(v => res = v());
  expect(res).is(0);
  n(1);
  expect(res).is(1);
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

function notifyItem(f, value){
  f._isAnything ? f._doCompute() : f(value);
}

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


defGet(Anything.proto, function jsValue() { return this._value; });
defGet(Anything.proto, 'switch', function () { return Switch(this); });


nice.ANYTHING = Object.seal(create(Anything.proto, new String('ANYTHING')));
//Anything.proto._type = Anything;

