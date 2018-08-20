defAll(nice.Anything.proto, {

    _addHotChild: function(){
      if(!this._hotChildCount){
        this._hotChildCount = 1;
        this._parent && this._parent._addHotChild();
      } else {
        this._hotChildCount++;
      }
    },

    _removeHotChild: function(){
      this._hotChildCount--;
      if(!this._hotChildCount){
        this._parent && this._parent._removeHotChild();
      }
    },

    listen: function(f) {
      const ss = this._subscribers = this._subscribers || [];

      if(!ss.includes(f)){
        ss.push(f);
        isResolved(this) ? f(this) : this.compute();
      }

      this._parent && this._parent._addHotChild();
      return this;
    },


//    listenDiff: function(f) {
//      this.listen(() => {
//        const diff = this._getDiff();
//        diff === false || f(diff);
//      });
//    },

    _notify: function (diff){
      _each(diff.children, (v, k) => {
        const c = this._items[k];
        c && c._notify(v);
      });
      if(!this._subscribers)
        return;
      this._notifing = true;
      this._subscribers.forEach(s => {
        if(s.doCompute){
          s._notifing || s.doCompute();
        } else {
          isResolved(this) && s(this, diff);
        }
      });
      this._notifing = false;
    },

    _getDiff: function (){
//      if(this._diff || this._diff === false)
//        return this._diff;
//      return this._diff = nice.diff(
//          diffConverter(this.initState),
//          diffConverter(this._result)
//      );

      if(this.hasOwnProperty('_oldValue')){
        ///TODO: if(!this.is.Single())
        const res = { oldValue: this._oldValue };
        delete this._oldValue;
        return res;
      } else if(this._hasChanges){
        if(this.is.Single())
          throw 'ups';
        const children = {};
        nice._each(this._items, (v, k) => {
          const d = v._getDiff();
          d === false || (children[k] = d);
        });
        delete this._hasChanges;
        return { children };
      } else {
        return false;
      }
    },

    transactionStart: function(){
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

    transactionEnd: function(){
      if(--this._transactionDepth > 0)
        return false;

      this._transactionDepth = 0;

      const diff = this._getDiff();
      diff && this._notify(diff);

//      this.initState = null;
//      is.Box(this._result) || Object.freeze(this._result);
//      (this._result && this._result._notify) || Object.freeze(this._result);
//      delete this._diff;
      return diff;
    },

    transactionRollback: function(){
      this._transactionDepth && (this._result = this.initState);
      this._transactionDepth = 0;
      this.initState = null;
      delete this._diff;
      return this;
    },

    _isHot: function (){
      //TODO: why _transactionDepth here??
//      return this._transactionDepth
//        || (this._subscribers && this._subscribers.length);
      return this._hotChildCount ||
        (this._subscribers && this._subscribers.length);
    },

    transaction: function (f) {
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
  listenOnce: function (f) {
    isResolved(this) || this.compute();

    if(isResolved(this))
      return f(this._result);

    const _f = v => {
      f(v);
      this.unsubscribe(_f);
    };

    this._subscribers.push(_f);

    return this;
  },


  unsubscribe: function (target){
    nice._removeArrayValue(this._subscribers, target);
    if(!this._subscribers.length){
      this._subscriptions &&
        this._subscriptions.forEach(_s => _s.unsubscribe(this));
      this._parent && this._parent._removeHotChild();
    }
  }
});


function isResolved (s){
  return s._result !== nice.NEED_COMPUTING && s._result !== nice.PENDING;
}



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

//    use: function (...ss){
//      ss.forEach(s => {
//        if(s.__proto__ === Promise.prototype)
//          s = Box().follow(s);
//
//        expect(s !== this, `Box can't use itself`).toBe();
//        //TODO: restore
////        expect(s, `Can use only box or promise.`).Box();
//        this._subscriptions.push(s);
//        this._isReactive = true;
//        this._result = nice.NEED_COMPUTING;
//      });
//      this.isHot() && this.compute();
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

//    doCompute: function (){
//      this.transactionStart();
//      this._result = nice.PENDING;
//      let _result;
//      const ss = this._subscriptions;
//
//      ss.forEach(s => {
//        if(!s._subscribers.includes(this)){
//          isResolved(s) || s.compute();
//          s._subscribers.push(this);
//        }
//      });
//
//      const unwrap = s => is.Box(s) ? unwrap(s._result) : s;
//      const _results = ss.map(unwrap);
//
//      if(ss.some(s => !isResolved(s))){
//        _result = nice.PENDING;
//      } else if(_results.find(is.Err)){
//        _result = nice.Err(`Dependency error`);
//      }
//
//      try {
//        if(_result){
//          this._simpleSetState(_result);
//        } else if(this._by){
//          this._simpleSetState(this._by(..._results));
//        } else if(this._asyncBy){
//          //this will unlock the Box for edit. Maybe there is beter solution
//          this._isReactive = false;
//          this._asyncBy(this, ..._results);
////          this._isReactive = true;
//        } else {
//          this._simpleSetState(_results[0]);
//        }
//      } catch (e) {
//        console.log('ups', e);
//        this.error(e);
//        return;
//      } finally {
//        return this.transactionEnd(true);
//      }
//
//      return this._result;
//    },
//
//    compute: function() {
//      return this._result !== nice.NEED_COMPUTING || this._transactionDepth
//        ? this._result : this.doCompute();
//    },
//
//    valueOf: function() {
//      return this.hasOwnProperty('_result') && this._result;
//    },
//
//
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


function diffConverter(v){
  return is.Value(v) ? v._getResult() : v;
}




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


//def(nice, 'resolveChildren', (v, f) => {
//  if(!v)
//    return f(v);
//
//  if(is.Box(v))
//    return v.listenOnce(_v => nice.resolveChildren(_v, f));
//
//  if(v._result){
//    if(is.Object(v._result)){
//      let count = 0;
//      const next = () => {
//        count--;
//        count === 0 && f(v);
//      };
//      _each(v._result, () => count++);
//      !count ? f(v) : _each(v._result, (vv, kk) => {
//        nice.resolveChildren(vv, _v => {
//          if(_v && _v._type){
//            _v = _v._result;
//          }
//          v._result[kk] = _v;
//          next();
//        });
//      });
//    } else {
//      f(v);
//    }
//  } else {
//    if(is.Object(v)){
//      let count = 0;
//      const next = () => {
//        count--;
//        count === 0 && f(v);
//      };
//      _each(v, () => count++);
//      !count ? f(v) : _each(v, (vv, kk) => {
//        nice.resolveChildren(vv, _v => {
//          if(_v && _v._type){
//            _v = _v._result;
//          }
//          v[kk] = _v;
//          next();
//        });
//      });
//    } else {
//      f(v);
//    }
//  }
//});
