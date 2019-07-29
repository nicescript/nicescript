//def(nice, 'observableProto', {
//  _isResolved() { return true; },
//  listen (f, target) {
//    if(typeof f === 'object'){
//      f = this._itemsListener(f);
//    }
//    const key = target || f;
//    const ss = this._subscribers = this._subscribers || new Map();
//
//    if(!ss.has(key)){
//      this.compute && this.compute();
//      ss.set(key, f);
//      const val = this._notificationValue ? this._notificationValue() : this;
//      nice.isPending(val) || f(val);
//    }
//
//    if(target) {
//      target._subscriptions = target._subscriptions || [];
//      target._subscriptions.push(this);
//    }
//
//    return () => this.unsubscribe(key);
//  },
//
//  listenChanges(f, target) {
//    let counter = 0;
//    if(typeof f === 'object'){
//      f = this._itemsListener(f);
//    }
//    this.listen((...a) => counter++ && f(...a), target || f);
//  },
//
//  listenChildren (f, path = [], skip = true) {
//    this.listen(this.isObj()
//      ? {
//          onRemove: (v, k) => {
//            //TODO: unsubscribe
//            v.unsubscribe && v.unsubscribe(f);
//            f(null, path.concat(k));
//          },
//          onAdd: (v, k) => {
//            const _path = path.concat(k);
//            skip || f(v, _path);
//            v && v._isAnything&& v.listenChildren(f, _path, skip);
//          }
//        }
//      : v => skip || f(v, path),
//    f);
//    skip = false;
//  },
//
//  transactionStart (){
//    if('_locked' in this)
//      throw nice.LOCKED_ERROR;
//    if(!'_transactionDepth' in this){
//      this._transactionDepth = 0;
//    }
//    this._transactionDepth++;
//    return this;
//  },
//
//  transactionEnd (){
//    if(--this._transactionDepth > 0)
//      return false;
//
//    this._transactionDepth = 0;
//
//    this._oldValue === this._value || notify(this);
//    delete this._newValue;
//  },
//
//  transactionRollback (){
//    this._transactionDepth && (this._result = this.initState);
//    this._transactionDepth = 0;
//    this.initState = null;
//    delete this._newValue;
//    return this;
//  },
//
//  _isHot (){
//    return this._subscribers && this._subscribers.size;
//  },
//
//  transaction (f) {
//    this.transactionStart();
//    f(this);
//    this.transactionEnd();
//    return this;
//  },
//
//  listenOnce (f, target) {
//    this._isResolved() || this.compute();
//
//    if(this._isResolved())
//      return f(this._notificationValue ? this._notificationValue() : this);
//
//    const key = target || f;
//    const _f = v => {
//      f(v);
//      this.unsubscribe(key);
//    };
//
//    (this._subscribers = this._subscribers || new Map());
//    this._subscribers.set(key, f);
//
//    return this;
//  },
//
//  unsubscribe (target){
//    this._subscribers.delete(target);
//    if(!this._subscribers.size){
//      this._subscriptions &&
//        this._subscriptions.forEach(_s => _s.unsubscribe(this));
//    }
//  }
//});
//
//defAll(nice.Anything.proto, nice.observableProto);


//function notify(z){
//  let needNotification = false;
//  let oldValue;
//
//  if('_oldValue' in z) {
//    needNotification = true;
//    oldValue = z._oldValue;
//    delete z._oldValue;
//  }
//  if(needNotification && z._subscribers){
//    z._notifing = true;
//    z._subscribers.forEach(s => {
//      z._isResolved()
//          && s(z._notificationValue ? z._notificationValue() : z, oldValue);
//    });
//    z._notifing = false;
//  }
//};
