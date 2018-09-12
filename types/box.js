const PENDING = nice.Pending(), NEED_COMPUTING = nice.NeedComputing();

nice.Type({
  name: 'Box',

  extends: 'Something',

  onCreate: z => {
    z._value = PENDING;
    z._isReactive = false;
  },

  itemArgs1: (z, v) => {
    if(z._isReactive)
      throw `This box uses subscriptions you can't change it's value.`;
    z._setValue(v);
  },

  initBy: (z, ...a) => a.length && z(...a),
  initBy2: (z, ...a) => a.length && z(...a),

  by (...inputs){
    const res = Box();
    res._by = inputs.pop();
    res._subscriptions = res._subscriptions || [];
    res._value = nice.NeedComputing();
    res._isReactive = true;
    inputs.forEach(s => {
      if(s.__proto__ === Promise.prototype)
        s = Box().follow(s);

      expect(s.listen, `Bad source`).toBe();
      res._subscriptions.push(s);
    });
    return res;
  },

  proto: {
    async: function (f){
      this._asyncBy = f;
      this._value = NEED_COMPUTING;
      return this;
    },

    follow: function (s){
      if(s.__proto__ === Promise.prototype) {
        this.doCompute = () => {
          this.transactionStart();
          s.then(v => {
              this(v);
              this.transactionEnd();
              delete this.doCompute;
            }, e => this.error(e));
        };
      } else {
        expect(s !== this, `Box can't follow itself`).toBe();
        this._subscriptions = [s];
        this._isReactive = true;
      }
      this._value = NEED_COMPUTING;
      this._isHot() && this.compute();
      return this;
    },

    interval: function (f, t = 200) {
      setInterval(() => this.setState(f(this._value)), t);
      return this;
    },

    timeout: function (f, t = 200) {
      setTimeout(() => f(this), t);
      return this;
    },

    doCompute: function (){
      this.transactionStart();
      this.hasOwnProperty('_oldValue') || (this._oldValue = this._value);
      this._value = PENDING;
      let _value;
      const ss = this._subscriptions;

      ss.forEach(s => {
        s._subscribers = s._subscribers || [];
        if(!s._subscribers.includes(this)){
          s._isResolved() || s.compute();
          s._subscribers.push(this);
        }
      });

      const unwrap = s => is.Box(s) ? unwrap(s._value) : s;
      const _results = ss.map(unwrap);

      if(ss.some(s => !s._isResolved())){
        _value = PENDING;
      } else if(_results.find(is.Err)){
        _value = nice.Err(`Dependency error`);
      }

      try {
        if(_value){
          this._simpleSetState(_value);
        } else if(this._by){
          this._simpleSetState(this._by(..._results));
        } else if(this._asyncBy){
          //this will unlock the Box for edit. Maybe there is beter solution
          this._isReactive = false;
          this._asyncBy(this, ..._results);
//          this._isReactive = true;
        } else {
          this._simpleSetState(_results[0]);
        }
      } catch (e) {
        console.log('ups', e);
        this.error(e);
        return;
      } finally {
        return this.transactionEnd();
      }

      return this._value;
    },

    compute: function() {
      return !is(this._value).NeedComputing() || this._transactionDepth
        ? this._value : this.doCompute();
    },

//    valueOf: function() {
//      return this.hasOwnProperty('_result') && this._result;
//    },

//    getDiff: function (){
//      if(this._diff || this._diff === false)
//        return this._diff;
//
//      return this._diff = nice.diff(
//          diffConverter(this.initState),
//          diffConverter(this._result)
//      );
//    },

//    getDiffTo: function (oldValue = this.initState){
//      return this._diff = nice.diff(
//          diffConverter(oldValue),
//          diffConverter(this._result)
//      );
//    },

//    change: function (f){
//      this.transactionStart();
//      let res = f(this._result);
//      res === undefined || (this._result = res);
//      this.transactionEnd();
//      return this;
//    },

    _simpleSetState: function(v){
      if(v === undefined)
        throw `Can't set result of the box to undefined.`;
      if(v === this)
        throw `Can't set result of the box to box itself.`;

      while(v && v._up_)
        v = v._up_;

//      this.hasOwnProperty('_oldValue') || (this._oldValue = this._value);
      this._value = v;
    },

    setState: function(v){
      if(v === undefined)
        throw `Can't set result of the box to undefined.`;
      if(v === this)
        throw `Can't set result of the box to box itself.`;

      while(v && v._up_)
        v = v._up_;

//      if(nice.is.Box(v))
//        return this.follow(v)();

      if(this._value !== v) {
        this.transactionStart();
        this.hasOwnProperty('_oldValue') || (this._oldValue = this._value);
        this._value = v;
        this.transactionEnd();
      }

      return this._value;
    },

    _notificationValue(){
      return this._value;
    },

    _isHot: function (){
      return this._transactionDepth
        || (this._subscribers && this._subscribers.length);
    },

    _isResolved (){
      return !is(this._value).Pending() && !is(this._value).NeedComputing();
    },

    lock: function(){
      this._locked = true;
      return this;
    },

    unlock: function(){
      this._locked = false;
      return this;
    },

//    'default': function (v) {
//      isResolved(this) || this(v);
//    },

    error: function(e) {
      return this.setState(is.Err(e) ? e : nice.Err(e));
    },

//    transactionStart: function(){
//      if(this._locked)
//        throw nice.LOCKED_ERROR;
//      if(!this._transactionDepth){
//        this.initState = this._result;
//        this._result = nice.cloneDeep(this.initState);
//        this._diff = null;
//        this._transactionDepth = 0;
//      }
//      this._transactionDepth++;
//      return this;
//    },
//
//    transactionEnd: function(onlyIfDiff = false){
//      if(--this._transactionDepth > 0)
//        return false;
//
//      this._transactionDepth = 0;
//
//      const go = this.getDiff();
//      go && this._notify();
//      this.initState = null;
////      is.Box(this._result) || Object.freeze(this._result);
//      (this._result && this._result._notify) || Object.freeze(this._result);
//      delete this._diff;
//      return go;
//    },

//    transactionRollback: function(){
//      this._transactionDepth && (this._result = this.initState);
//      this._transactionDepth = 0;
//      this.initState = null;
//      delete this._diff;
//      return this;
//    },
//
//    transaction: function (f, p) {
//      this.transactionStart();
//      f();
//      this.transactionEnd(p);
//      return this;
//    },

    getPromise: function () {
      return new Promise((resolve, reject) => {
        this.listenOnce(v => (is.Err(v) ? reject : resolve)(v));
      });
    }
  }
}).about('Observable component for declarative style programming.');
Box = nice.Box;
const F = Func.Box;


//['use', 'follow', 'once', 'by', 'async']
//    .forEach(k => def(Box, k, (...a) => Box()[k](...a)));


function diffConverter(v){
  return is.Value(v) ? v._getResult() : v;
}


//F('listenDiff', (b, f) => b.listen(() => f(b.getDiff())));


F(function unsubscribe(s, target){
  nice._removeArrayValue(s._subscribers, target);
  s._subscribers.length || s._subscriptions.forEach(_s => _s.unsubscribe(s));
});


F.Box(function bind(y, x) {
  y(x());
  x.listen(y);
  y.listen(x);
  return y;
});


F.Box(function unbind(y, x) {
  nice.unsubscribe(y, x);
  nice.unsubscribe(x, y);
  return y;
});


//TODO: fix or remove
//named inputs
//nice._on('Type', type => {
//  if(!type.name)
//    return;
//
//  def(Box.proto, nice._decapitalize(type.name), function (name, value) {
//    expect(name).String();
//
//    const input = Box();
//    value !== undefined && input(value);
//    input._parent = this;
//    def(this, name, input);
//    return this.use(input);
//  });
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


//nice._on('Action', f => {
//  const {name} = f;
//  Box.proto.hasOwnProperty(name) || def(Box.proto, name,
//    function (...a) {
//      return this.change(_result => f(_result, ...a));
//    }
//  );
//});
//
//
//nice._on('Mapping', ({name}) => {
//  Box.proto.hasOwnProperty(name) || def(Box.proto, name,
//    function (...a) {
//      return Box().use(this).by(z => nice[name](z, ...a));
//    }
//  );
//});
//
//
//nice._on('Property', ({name}) => {
//  Box.proto.hasOwnProperty(name) || def(Box.proto, name,
//    function (...a) {
//      return a.length
//        ? this.change(state => state[name](...a))
//        : this._result[name](...a);
//    }
//  );
//});