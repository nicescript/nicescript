const NO_NEED = {};

def(nice, 'observableProto', {
  _isResolved() { return true; },
  listen (f, target) {
    if(typeof f === 'object'){
      f = this._itemsListener(f);
    }
    const key = target || f;
    const ss = this._subscribers = this._subscribers || new Map();

    if(!ss.has(key)){
      ss.set(key, f);
      if(this.compute){
        this.compute();
      } else {
        const val = this._notificationValue ? this._notificationValue() : this;
        is(val).Pending() || f(val);
      }
    }

    if(target) {
      target._subscriptions = target._subscriptions || [];
      target._subscriptions.push(this);
    }

    return () => this.unsubscribe(key);
  },

  transactionStart (){
    if(this._locked)
      throw nice.LOCKED_ERROR;
    if(!this._transactionDepth){
//        this.initState = this._result;
//        this._result = nice.cloneDeep(this.initState);
//        this._diff = null;
      this._transactionDepth = 0;
    }
    this._transactionDepth++;
    return this;
  },

  transactionEnd (){
    if(--this._transactionDepth > 0)
      return false;

    this._transactionDepth = 0;

//      const diff = this._getDiff();
//      diff && this._notify(diff);

//      this.initState = null;
//      is.Box(this._result) || Object.freeze(this._result);
//      (this._result && this._result._notify) || Object.freeze(this._result);
//      delete this._diff;
//      delete this._oldValue;
    this._oldValue === this._value || notify(this);
    delete this._newValue;
  },

  transactionRollback (){
    this._transactionDepth && (this._result = this.initState);
    this._transactionDepth = 0;
    this.initState = null;
//      delete this._diff;
    delete this._newValue;
    return this;
  },

  _isHot (){
    //TODO: why _transactionDepth here??
//      return this._transactionDepth
//        || (this._subscribers && this._subscribers.length);
    return this._hotChildCount ||
      (this._subscribers && this._subscribers.size);
  },

  transaction (f) {
    this.transactionStart();
    f(this);
    this.transactionEnd();
    return this;
  },


//    change: function (f){
//      this.transactionStart();
//      let res = f(this._result);
//      res === undefined || (this._result = res);
//      this.transactionEnd();
//      return this;
//    },
  listenOnce (f, target) {
    this._isResolved() || this.compute();

    if(this._isResolved())
      return f(this._notificationValue ? this._notificationValue() : this);

    const key = target || f;
    const _f = v => {
      f(v);
      this.unsubscribe(key);
    };

    (this._subscribers = this._subscribers || new Map());
    this._subscribers.set(key, f);

    return this;
  },

  unsubscribe (target){
    this._subscribers.delete(target);
//    nice._removeArrayValue(this._subscribers, target);
    if(!this._subscribers.size){
      this._subscriptions &&
        this._subscriptions.forEach(_s => _s.unsubscribe(this));
    }
  }
});

defAll(nice.Anything.proto, nice.observableProto);


function notify(z){
  let needNotification = false;
  let oldValue;

  if(z.hasOwnProperty('_oldValue')) {
    needNotification = true;
    oldValue = z._oldValue;
    delete z._oldValue;
  }
  if(needNotification && z._subscribers){
    z._notifing = true;
    z._subscribers.forEach(s => {
//      if(s.doCompute){
//        s._notifing || s.doCompute();
//      } else {
        z._isResolved()
            && s(z._notificationValue ? z._notificationValue() : z, oldValue);
//      }
    });
    z._notifing = false;
  }
  return needNotification ? oldValue : NO_NEED;
};
