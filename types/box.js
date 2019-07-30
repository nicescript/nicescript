const PENDING = nice.Pending(), NEED_COMPUTING = nice.NeedComputing();

nice.Type({
  name: 'Box',

  extends: 'Something',

  onCreate: z => {
    z._value = PENDING;
    z._isReactive = false;

  },
  itemArgs0: z => z.compute(),

  itemArgs1: (z, v) => z._setValue(v),

  initBy: (z, ...a) => a.length && z(...a),

  async (f){
    const b = Box();
    b._asyncBy = f;
    b._value = NEED_COMPUTING;
    return b;
  },

  proto: {
    interval (f, t = 200) {
      setInterval(() => this.setState(f(this._value)), t);
      return this;
    },

    timeout (f, t = 200) {
      setTimeout(() => f(this), t);
      return this;
    },

    setState (v){
      if(v === undefined)
        throw `Can't set result of the box to undefined.`;
      if(v === this)
        throw `Can't set result of the box to box itself.`;

      while(v && v._up_)
        v = v._up_;

      if(this._value !== v) {
        this.transactionStart();
        '_oldValue' in this || (this._oldValue = this._value);
        this._value = v;
        this.transactionEnd();
      }

      return this._value;
    },

    _notificationValue () {
      let res = this._value;
      return res && res._notificationValue ? res._notificationValue() : res;
    },

    _isHot (){
      return this._transactionDepth
        || (this._subscribers && this._subscribers.size);
    },

    _isResolved (){
      return !nice.isPending(this._value) && !nice.isNeedComputing(this._value);
    },

    lock (){
      this._locked = true;
      return this;
    },

    unlock (){
      this._locked = false;
      return this;
    },

    error (e) {
      return this.setState(nice.isErr(e) ? e : nice.Err(e));
    },

    getPromise () {
      return new Promise((resolve, reject) => {
        this.listenOnce(v => (nice.isErr(v) ? reject : resolve)(v));
      });
    },
    follow (s){
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
      this._isHot && this.compute();
      return this;
    },

    doCompute (){
      this.transactionStart();
      '_oldValue' in this || (this._oldValue = this._value);
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
        this._simpleSetState(Err('Error while doCompute'));
        return this._value;
      } finally {
        this.transactionEnd();
      }

      return this._value;
    },

    compute () {
      return !nice.isNeedComputing(this._value) || this._transactionDepth
        ? this._value : this.doCompute();
    },

    _simpleSetState (v){
      if(v === undefined)
        throw `Can't set result of the box to undefined.`;
      if(v === this)
        throw `Can't set result of the box to box itself.`;

      while(v && v._up_)
        v = v._up_;

      this._value = v;
    }
  }
})
  .ReadOnly('jsValue', ({_value}) => _value._isAnything ? _value.jsValue : _value)
  .about('Observable component.');
Box = nice.Box;


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