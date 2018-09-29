const NO_NEED = {};

defAll(nice.Anything.proto, {
  _isResolved() { return true; },
  listen(f) {
    //TODO: unsubscribe
    if(typeof f === 'object'){
      const { onRemove = () => {}, onAdd = () => {} } = f;
      f = (v, old) => {
        if(old === undefined){
          v.each(onAdd);
        } else {
          _each(old, (c, k) => {
            c === undefined || onRemove(c, k);
            v._items[k] && onAdd(v._items[k], k);
          });
        }
      };
    }
    const ss = this._subscribers = this._subscribers || [];

    if(!ss.includes(f)){
      ss.push(f);
      if(this.compute){
        this.compute();
      } else {
        const val = this._notificationValue ? this._notificationValue() : this;
        is(val).Pending() || f(val);
      }
    }

  //      this._parent && addHotChild(this._parent);
    return this;
  },

//    listenItem (k, f){
//
//    },


//    listenDiff(f) {
//      this.listen(() => {
//        const diff = this._getDiff();
//        diff === false || f(diff);
//      });
//    },

//    _getDiff (){
////      if(this._diff || this._diff === false)
////        return this._diff;
////      return this._diff = nice.diff(
////          diffConverter(this.initState),
////          diffConverter(this._result)
////      );
//
//      if(this.hasOwnProperty('_oldValue')){
//        ///TODO: if(!this.is.Single())
//        const res = { oldValue: this._oldValue };
//        delete this._oldValue;
//        return res;
//      } else if(this._hasChanges){
//        if(this.is.Single())
//          throw 'ups';
//        const children = {};
//        nice._each(this._items, (v, k) => {
//          const d = v._getDiff();
//          d === false || (children[k] = d);
//        });
//        delete this._hasChanges;
//        return { children };
//      } else {
//        return false;
//      }
//    },

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
    },

    transactionRollback (){
      this._transactionDepth && (this._result = this.initState);
      this._transactionDepth = 0;
      this.initState = null;
      delete this._diff;
      return this;
    },

    _isHot (){
      //TODO: why _transactionDepth here??
//      return this._transactionDepth
//        || (this._subscribers && this._subscribers.length);
      return this._hotChildCount ||
        (this._subscribers && this._subscribers.length);
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
  listenOnce (f) {
    this._isResolved() || this.compute();

    if(this._isResolved())
      return f(this._notificationValue ? this._notificationValue() : this);

    const _f = v => {
      f(v);
      this.unsubscribe(_f);
    };

    (this._subscribers = this._subscribers || []).push(_f);

    return this;
  },


  unsubscribe (target){
    nice._removeArrayValue(this._subscribers, target);
    if(!this._subscribers.length){
      this._subscriptions &&
        this._subscriptions.forEach(_s => _s.unsubscribe(this));
//      this._parent && removeHotChild(this._parent);
    }
  }
});


//  creator: () => {
//    const f = (...a) => {
//      if(a.length === 0){
//        f.compute();
//        return f._result;
//      }
//      if(f._isReactive)
//        throw `This box uses subscriptions you can't change it's value.`;
//      f._notifing || f.setState(...a);
//      return f._parent || f;
//    };
//    f._result = nice.PENDING;
//    f._subscriptions = [];
//    f._subscribers = [];
//    f._isReactive = false;
//    return f;
//  },

//  proto: {
//    by: function (...a){
//      this._by = a.pop();
//      a.length && this.use(...a);
//      this._result = nice.NEED_COMPUTING;
//      this._isReactive = true;
//      return this;
//    },

//    async: function (f){
//      this._asyncBy = f;
//      this._result = nice.NEED_COMPUTING;
//      return this;
//    },

//    follow: function (s){
//      if(s.__proto__ === Promise.prototype) {
//        this.doCompute = () => {
//          this.transactionStart();
//          s.then(v => {
//              this(v);
//              this.transactionEnd();
//              delete this.doCompute;
//            }, e => this.error(e));
//        };
//      } else {
//        expect(s !== this, `Box can't follow itself`).toBe();
//        this._subscriptions = [s];
//        this._isReactive = true;
//      }
//      this._result = nice.NEED_COMPUTING;
//      this.isHot() && this.compute();
//      return this;
//    },

//    interval: function (f, t = 200) {
//      setInterval(() => this.setState(f(this._result)), t);
//      return this;
//    },
//
//    timeout: function (f, t = 200) {
//      setTimeout(() => f(this), t);
//      return this;
//    },

//    getDiffTo: function (oldValue = this.initState){
//      return this._diff = nice.diff(
//          diffConverter(oldValue),
//          diffConverter(this._result)
//      );
//    },
//

//
//    _simpleSetState: function(v){
//      if(v === undefined)
//        throw `Can't set _result of the box to undefined.`;
//      if(v === this)
//        throw `Can't set _result of the box to box itself.`;
//
//      while(v && v._up_)
//        v = v._up_;
//
//      this._result = v;
//    },
//
//    setState: function(v){
//      if(v === undefined)
//        throw `Can't set _result of the box to undefined.`;
//      if(v === this)
//        throw `Can't set _result of the box to box itself.`;
//
//      while(v && v._up_)
//        v = v._up_;
//
////      if(nice.is.Box(v))
////        return this.follow(v)();
//
//      if(this._result !== v) {
//        this.transactionStart();
//        this._result = v;
//        this.transactionEnd();
//      }
//
//      return this._result;
//    },

//    isHot: function (){
//      return this._transactionDepth
//        || (this._subscribers && this._subscribers.length);
//    },
//
//    lock: function(){
//      this._locked = true;
//      return this;
//    },
//
//    unlock: function(){
//      this._locked = false;
//      return this;
//    },
//
//    'default': function (v) {
//      isResolved(this) || this(v);
//    },
//
//    error: function(e) {
//      return this.setState(is.Err(e) ? e : nice.Err(e));
//    },
//

//    isResolved: function (){
//      return this._result !== nice.NEED_COMPUTING && this._result !== nice.PENDING;
//    },

//    getPromise: function () {
//      return new Promise((resolve, reject) => {
//        this.listenOnce(v => (is.Err(v) ? reject : resolve)(v));
//      });
//    }


//['use', 'follow', 'once', 'by', 'async']
//    .forEach(k => def(Box, k, (...a) => Box()[k](...a)));




//
//F.Box(function bind(y, x) {
//  y(x());
//  x.listen(y);
//  y.listen(x);
//  return y;
//});
//
//
//F.Box(function unbind(y, x) {
//  nice.unsubscribe(y, x);
//  nice.unsubscribe(x, y);
//  return y;
//});


function notify(z){
  let needNotification = false;
  let oldValue;

//  if(z._items) {
//    if(z._oldItems){
//      needNotification = true;
//      oldValue = z._oldValue;
//      delete z._oldValue;
//    };
////    _each(z._items, (v, k) => {
////      const res = notify(v);
////      if(res !== NO_NEED){
////        oldValue = oldValue || {};
////        oldValue[k] = res;
////      }
////    });
//  } else
  if(z.hasOwnProperty('_oldValue')) {
    needNotification = true;
    oldValue = z._oldValue;
    delete z._oldValue;
  }
  if(needNotification && z._subscribers){
    z._notifing = true;
    z._subscribers.forEach(s => {
      if(s.doCompute){
        s._notifing || s.doCompute();
      } else {
        z._isResolved()
            && s(z._notificationValue ? z._notificationValue() : z, oldValue);
      }
    });
    z._notifing = false;
  }
  return needNotification ? oldValue : NO_NEED;
};

//function addHotChild(z){
//  if(!z._hotChildCount){
//    z._hotChildCount = 1;
//    z._parent && addHotChild(z._parent);
//  } else {
//    z._hotChildCount++;
//  }
//}

//function removeHotChild(z){
//  z._hotChildCount--;
//  if(!z._hotChildCount){
//    z._parent && removeHotChild(z._parent);
//  }
//}
