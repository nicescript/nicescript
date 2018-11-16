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
    res._subscriptions = [];
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

  async: function (f){
    const b = Box();
    b._asyncBy = f;
    b._value = NEED_COMPUTING;
    return b;
  },

  proto: {
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
      const ss = this._subscriptions || [];

      ss.forEach(s => {
        s._subscribers = s._subscribers || new Map();
        if(!s._subscribers.has(this)){
          s._isResolved() || s.compute();
          s._subscribers.set(this, () => this._notifing || this.doCompute());
        }
      });

      const _results = ss.map(s =>
          s._notificationValue ? s._notificationValue() : s);

      if(ss.some(s => !s._isResolved())){
        _value = PENDING;
      } else if(_results.find(nice.isErr)){
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
          return;
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
      return !nice.isNeedComputing(this._value) || this._transactionDepth
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

//      if(nice.isBox(v))
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
      let res = this._value;
      return res && res._notificationValue ? res._notificationValue() : res;
    },

    _isHot: function (){
      return this._transactionDepth
        || (this._subscribers && this._subscribers.size);
    },

    _isResolved (){
      return !nice.isPending(this._value) && !nice.isNeedComputing(this._value);
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

    getPromise: function () {
      return new Promise((resolve, reject) => {
        this.listenOnce(v => (is.Err(v) ? reject : resolve)(v));
      });
    }
  }
})
  .ReadOnly('jsValue', ({_value}) => _value._isAnything ? _value.jsValue : _value)
  .about('Observable component for declarative style programming.');
Box = nice.Box;
const F = Func.Box;


function diffConverter(v){
  return is.Value(v) ? v._getResult() : v;
}


def(nice, 'resolveChildren', (v, f) => {
  if(!v)
    return f(v);

  if(nice.isBox(v))
    return v.listenOnce(_v => nice.resolveChildren(_v, f));

  if(nice.isObj(v)){
    let count = v.size;
    const next = () => {
      count--;
      count === 0 && f(v);
    };
    !count ? f(v) : _each(v._items, (vv, kk) => {
      nice.resolveChildren(vv, _v => {
        next();
      });
    });
  } else {
    f(v);
  }
});