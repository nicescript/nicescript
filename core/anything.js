/*
 * 1. setting new(calculated) value
 * 2. recalculate on each use when not hot?
 * 3.
 */
const proxy = new Proxy({}, {
  get (o, k, receiver) {
    if(k[0] === '_')
      return undefined;
    if(k === 'isPrototypeOf')
      return Object.prototype.isPrototypeOf;

    if(k in receiver){
      return receiver[k];
    } else {
      k.toString && (k = k.toString());
      const res = nice.Err(`Property ${k} not found`)
        ._set('_functionName', 'get')
        ._set('_args', [receiver, k]);
      receiver.listen(res);
      return res;
    }
  },
});

nice.registerType({
  name: 'Anything',

  description: 'Parent type for all types.',

  extend (name, by){
    return nice.Type(name, by).extends(this);
  },

  itemArgs0: z => z._value,
  itemArgs1: (z, v) => z._setValue(v),
  itemArgsN: (z, vs) => {
    throw `${z._type.name} doesn't know what to do with ${vs.length} arguments.`;
  },

  initChildren: () => 0,

  fromValue (_value){
    return Object.assign(this(), { _value });
  },

  deserialize (v){
    const res = this();
    res._value = nice.deserialize(v);
    return res;
  },

  _isNiceType: true,

  proto: Object.setPrototypeOf({
    _isAnything: true,

    valueOf () {
      return '_value' in this ? this._value : undefined;
    },

    super (...as){
      const type = this._type;
      const superType = type.super;
      this._type = superType;
      superType.initBy(this, ...as);
      this._type = type;
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

    _changeValue (v, t){
      if(v === this._value)
        return;
      let value, type;
      if(v !== null && v !== undefined && v._isAnything){
        value = v._value;
        type = t || v._type;
      } else {
        value = v;
        type = nice.getType(v);
        type = type.niceType ? nice[type.niceType] : type;
      }
      if(type !== this._type) {
        if(!type._isNiceType)
          throw('Bad type');
        Object.setPrototypeOf(this, type.proto);
      }
      this._setValue(value);
    },


    _setValue (v){
      if(v === this._value)
        return;
      this.transaction(() => {
        !('_oldValue' in this) && (this._oldValue = this._value);
        this._set('_value', v);
      });
    },

    compute (){
//      if(this._transactionDepth)
//        return;

      if(!this._functionName || this._isHot)
        return;

      this.doCompute();
    },
//    compute () {
////      return !nice.isNeedComputing(this._value) || this._transactionDepth
////        ? this._value : this.doCompute();
//    },

    doCompute () {
      this._args.forEach(a => {
        if(a._isAnything){
          a._isHot || a.compute();
          a.listen(this);
        }
      });

      try {
        const result = nice[this._functionName](...this._args);
        this._changeValue(result);
      } catch (e) {
        this._changeValue('Error while doCompute', Err)
      }

    },

    listen (f, target) {
      if(typeof f === 'object' && !f._isAnything){
        f = this._itemsListener(f);
      }
      const key = target || f;
      const ss = this._subscribers = this._subscribers || new Map();

      if(!ss.has(key)){
        this.compute();
        ss.set(key, f);
        this._set('_isHot', true);
        this.isPending() || notifyItem(f, this);
      }

      if(target) {
        target._subscriptions.push(this);
      }

      return () => this.unsubscribe(key);
    },

    listenChanges(f, target) {
      let counter = 0;
      if(typeof f === 'object'){
        f = this._itemsListener(f);
      }
      this.listen((...a) => counter++ && f(...a), target || f);
    },

    listenChildren (f, path = [], skip = true) {
      this.listen(this.isObj()
        ? {
            onRemove: (v, k) => {
              //TODO: unsubscribe
              v.unsubscribe && v.unsubscribe(f);
              f(null, path.concat(k));
            },
            onAdd: (v, k) => {
              const _path = path.concat(k);
              skip || f(v, _path);
              v && v._isAnything&& v.listenChildren(f, _path, skip);
            }
          }
        : v => skip || f(v, path),
      f);
      skip = false;
    },

    transactionStart (){
      if('_locked' in this)
        throw nice.LOCKED_ERROR;
//      if(!'_transactionDepth' in this){
//        this._transactionDepth = 0;
//      }
      this._transactionDepth++;
      return this;
    },

    transactionEnd (){
      if(--this._transactionDepth > 0)
        return false;

      this._transactionDepth = 0;

      if(!('_oldValue' in this) || this._oldValue !== this._value)
        notify(this);
//      this._oldValue === this._value || notify(this);
      delete this._newValue;
    },

    transactionRollback (){
      this._transactionDepth > 0 && (this._result = this.initState);
      this._transactionDepth = 0;
      this.initState = null;
      delete this._newValue;
      return this;
    },

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

    listenOnce (f, target) {
      this._isHot || this.compute();

      if(this._isResolved())
        return f(this);

      const key = target || f;
      const _f = v => {
        f(v);
        this.unsubscribe(key);
      };

      this._subscribers.set(key, f);
      this._set('_isHot', true);

      return this;
    },

    _get (k) {
      if(k in this)
        return this[k];
      return undefined;
    },

    _set (k, v) {
      this[k] = v;
      return this;
    },

    _has (k) {
      return k in this;
    },

    unsubscribe (target){
      this._subscribers.delete(target);
      if(!this._subscribers.size){
        this._set('_isHot', false);
        this._subscriptions &&
          this._subscriptions.forEach(_s => _s.unsubscribe(this));
      }
    },
    [Symbol.toPrimitive]() {
      return this.jsValue;
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


function notify(z){
  let needNotification = '_oldValue' in z;

  if(needNotification && z._subscribers){
    z._notifing = true;
    z._isResolved() && z._subscribers.forEach(s => notifyItem(s, z));
    z._notifing = false;
  }

  delete z._oldValue;
};

function notifyItem(f, value){
  f._isAnything ? f.doCompute() : f(value);
}

Anything = nice.Anything;


defGet(Anything.proto, function jsValue() { return this._value; });
defGet(Anything.proto, 'switch', function () { return Switch(this); });


nice.ANYTHING = Object.seal(create(Anything.proto, new String('ANYTHING')));
Anything.proto._type = Anything;

