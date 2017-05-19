nice.define(nice, 'item', (initValue, proto) => {
  var f = nice.ItemPrototype._creator();
  nice._initItem(f, proto || nice.ItemPrototype);
  initValue && f(initValue);
  return f;
});


nice.ItemPrototype = {
  _typeTitle: 'Item',
  _creator: () => {
    var f = function (...a){
      if(a.length === 0){
        f._compute();
        return f._getData();
      }
      f.set(...a);
      return f._container || f;
    };
    return f;
  },

  _default: () => undefined,

  resetValue: function (){
    if(this._locked)
      throw nice.LOCKED_ERROR;

    this._setData(this._default());
    this._constructor(this);
  },

  _constructor: (z, ...v) => z(...v),

  by: function(f) {
    this.expect(f).toBeFunction();
    this._status = nice.NEED_COMPUTING;
    this._selfStatus = nice.NEED_COMPUTING;
    this._container && this._container._childrenBy();
    this._by = f;
    this._isHot() && this._computeSelf();
    return this;
  },

  _childrenBy: function (){
    this._status = nice.NEED_COMPUTING;
    this._container && this._container._childrenBy();
  },

  _getData: function() {
    if(this.hasOwnProperty('_container')){
      var res = this._container._getData()[this._containerKey];
      return res === undefined ? this._default() : res;
    } else {
      return this.hasOwnProperty('_result') ? this._result : this._default();
    }
  },

  _assertData: function(){
    if(this.hasOwnProperty('_container')){
      var o = this._container._assertData();
      return o[this._containerKey] === undefined
        ? o[this._containerKey] = this._default()
        : o[this._containerKey];
    } else {
      return !this.hasOwnProperty('_result')
        ? this._result = this._default()
        : this._result;
    }
  },

  _setData: function(data){
    if(this.hasOwnProperty('_container')){
      this._container._changeItem(this._containerKey, data);
    } else {
      this._result = data;
    }
  },

  _changeItem: function(k, v){
    var data = this._assertData();
    if(!this._modified){
      data = nice.clone(data);
      if(this.hasOwnProperty('_container')){
        this._container._changeItem(this._containerKey, data);
      } else {
        this._result = data;
      }
      this._modified = true;
    }
    if(v === null){
      delete data[k];
    } else {
      data[k] = v;
    }
  },

  _getDiff: function (){
    if(this._diff)
      return this._diff;

    return this._diff = nice.diff(this._transactionResult, this._getData());
  },

  setBy: function(f){
    this._by = function(){
      this.replace(f(this));
    };
    return this;
  },

  use: function (source) {
    var subscription = nice.subscription(source, this).skip(1);
    var ready = subscription.resolve();
    subscription.skip(0);

    if(source._error){
      this.transactionRollback();
      this._sourceError(source._error);
      throw nice.NOT_RESOLVED;
    }

    if(ready)
      return source;
    else
      throw nice.NOT_RESOLVED;
  },

  useOnce: function(source){
    if(source._error){
      this.transactionRollback();
      this._sourceError(source._error);
    }

    if(source._compute())
      return source;

    var subscription = nice.subscription(source, this).skip(1).onlyOnce();
    subscription.resolve();
    subscription.skip(0);
    throw nice.NOT_RESOLVED;
  },

  try: function (source) {
    var subscription = nice.subscription(source, this).skip(1)
        .onError(() => this._computeSelf());
    var ready = subscription.resolve();
    subscription.skip(0);

    if(ready)
      return source;
    else
      throw nice.NOT_RESOLVED;
  },

  tryOnce: function (source) {
    if(source._compute())
      return source;

    var subscription = nice.subscription(source, this).onlyOnce()
        .onError(() => this._computeSelf());
    setTimeout(() => {
      subscription.resolve();
    }, 0);
    throw nice.NOT_RESOLVED;
  },

  _computeSelf: function (){
    if(!this._by)
      return true;

    this._selfStatus === nice.NEED_COMPUTING && (this._selfStatus = nice.PENDING);
    this.transactionStart();
    this._oldSubscriptions = this._subscriptions;
    this._subscriptions = [];
    try {
      this.resetValue();
      this._by(this);
    } catch (e) {
      if(e === nice.NOT_RESOLVED)
        return;
      console.log('ups', e);
      this.error(e);
      return;
    } finally {
      nice.each(
        s => nice.includes(s, this._subscriptions) || nice.unsubscribe(s, this),
        this._oldSubscriptions
      );
      this._oldSubscriptions = undefined;

      if(this._error)
        return true;

      return this.transactionEnd();
    }
  },

  _compute: function(){
    if(this._status !== nice.NEED_COMPUTING)
      return !this._status;

    var res = 0;
    if(this._selfStatus === nice.NEED_COMPUTING){
      this._computeSelf() || res++;
    }
    if(this._children)
      for(let i in this._children)
        this._children[i]._compute() || res++;
    return !res;
  },

  extends: function(type){
    type = nice.type(type);

    if(!nice.ItemPrototype.isPrototypeOf(type))
      return nice.error('Bad prototype to extend');

    Object.setPrototypeOf(this, type);

    return this;
  },

  set: function(...a){
    if(this._locked)
      throw nice.LOCKED_ERROR;

    this.transactionStart();

    var value = this._set ? this._set(...a) : a[0];

    if(value === null)
      return this.error('Result is null');

    this._setData(value);
    this.resolve();

    this.transactionEnd();

    return value;
  },

  _isResolved: function (){
    if(this._selfStatus)
      return false;

    var res = 0;
    if(this._children){
      for(let i in this._children)
        this._children[i]._isResolved() || res++;
    }
    res || (this._status = nice.RESOLVED);
    return !res;
  },

  resolve: function(){
    delete this._error;
    this._selfStatus = nice.RESOLVED;
    this._notify();
  },

  _notify: function (source){
    if(source === this)
      return nice.error('Item trying to notify itself.');

    if(source && source.error())
      this._childError(source);

    if(this._transactionDepth)
      return;

    if(this._isResolved()){
      this._subscribers && this._subscribers.forEach(s => s.notify());
      this._container && this._container._notify(source || this);
    }
  },

  is: function (v) {
    return this() === v;
  },

  ifThen: function(...a){
    return this()
      ? nice.is.Function(a[0]) ? a[0](this) : a[0]
      : nice.is.Function(a[1]) ? a[1](this) : a[1];
  },

  isAnyOf: function (...a) {
    return a.includes(this());
  },

  listenBy: function (target, onError) {
    var subscription = nice.subscription(this, target);
    onError && subscription.onError(onError);
    subscription.resolve();
    return this;
  },

  listenTo: function (source, onError) {
    var subscription = nice.subscription(source, this);
    onError && subscription.onError(onError);
    subscription.resolve();
    return this;
  },

  _isHot: function (){
    return (this._subscribers && this._subscribers.length)
      || (this.hasOwnProperty('onAdd') && this.onAdd.items.length)
      || (this.hasOwnProperty('onRemove') && this.onRemove.items.length)
      || (this._container && this._container._isHot());
  },

  expect: function (value, message){
    return Object.setPrototypeOf(
      {value:value, message: message, item: this},
      nice.expectPrototype
    );
  },

  Constant: function(name, value){
    nice.define(this, name, value);
    return this;
  },

  Method: function(...a){
    var [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
    this.expect(f).toBeFunction();
    Object.defineProperty(this, name, {get: function(){
      return f.bind(this);
    }});
    return this;
  },

  ReadOnly: function(...a){
    var [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
    this.expect(f).toBeFunction();
    Object.defineProperty(this, name, {get: f});
    return this;
  },

  timeout: function(ms, message){
    setTimeout(() => {
      this._isResolved() || this.error('Timeout' || message);
    }, ms);
    return this;
  },

  pending: function(){
    this._status = this._selfStatus = nice.PENDING;
    this._container && this._container._childPending();
    return this;
  },

  _childPending: function(){
    this._status = nice.PENDING;
    this._container && this._container._childPending();
    return this;
  },

  lock: function(){
    this._locked = true;
    return this;
  },

  unlock: function(){
    this._locked = false;
    return this;
  },

  onCancel: function (f) {
    this._onCancel = f;
    return this;
  }
};

nice.FunctionsSet(nice.ItemPrototype, 'onAdd', z => nice.activateItem(z));
nice.FunctionsSet(nice.ItemPrototype, 'onRemove', z => nice.activateItem(z));

nice.define(nice.ItemPrototype, 'onEach', function (f){
  this.each(f);
  this.onAdd(f);
  return this;
});

nice.new(nice.ItemPrototype, nice.CollectionPrototype);
nice.Type(nice.new(Function.prototype, nice.ItemPrototype));