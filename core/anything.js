const builtIns = ['_subscribers', '_subscriptions', '_setValue', '_oldValue',
  '_newValue', '_value', '_type', 'isPrototypeOf'];
const proxy = new Proxy({}, {
  get (o, k, receiver) {
    if(k[0] === '_')
      return undefined;
    if(k === 'isPrototypeOf')
      return Object.prototype.isPrototypeOf;

//    console.log(k);

    if(k in receiver){
      return receiver[k];//Reflect.get(receiver, k)
    } else {
      k.toString && (k = k.toString());
      return nice.Err(`Property ${k} not found in`);// ${receiver}`);
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

    _setValue (v){
      if(v === this._value)
        return;
      this.transaction(() => {
        !('_oldValue' in this) && (this._oldValue = this._value);
        this._value = v;
      });
    },

    _isResolved() { return true; },

    listen (f, target) {
      if(typeof f === 'object'){
        f = this._itemsListener(f);
      }
      const key = target || f;
      const ss = this._subscribers = this._subscribers || new Map();

      if(!ss.has(key)){
        this.compute && this.compute();
        ss.set(key, f);
        const val = '_notificationValue' in this ? this._notificationValue() : this;
        nice.isPending(val) || f(val);
      }

      if(target) {
//        target._subscriptions = target._subscriptions || [];
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

    _isHot (){
      return '_subscribers' in this && this._subscribers.size;
    },

    transaction (f) {
      this.transactionStart();
      f(this);
      this.transactionEnd();
      return this;
    },

    listenOnce (f, target) {
      this._isResolved() || this.compute();

      if(this._isResolved())
        return f('_notificationValue' in this ? this._notificationValue() : this);

      const key = target || f;
      const _f = v => {
        f(v);
        this.unsubscribe(key);
      };

//      (this._subscribers = this._subscribers || new Map());
      this._subscribers.set(key, f);

      return this;
    },

    unsubscribe (target){
      this._subscribers.delete(target);
      if(!this._subscribers.size){
        this._subscriptions &&
          this._subscriptions.forEach(_s => _s.unsubscribe(this));
      }
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
  let needNotification = false;
  let oldValue;

  if('_oldValue' in z) {
    needNotification = true;
    oldValue = z._oldValue;
    delete z._oldValue;
  }
  if(needNotification && z._subscribers){
    z._notifing = true;
    z._subscribers.forEach(s => {
      z._isResolved()
          && s('_notificationValue' in z ? z._notificationValue() : z, oldValue);
    });
    z._notifing = false;
  }
};

Anything = nice.Anything;


defGet(Anything.proto, function jsValue() { return this._value; });
defGet(Anything.proto, 'switch', function () { return Switch(this); });


nice.ANYTHING = Object.seal(create(Anything.proto, new String('ANYTHING')));
Anything.proto._type = Anything;

