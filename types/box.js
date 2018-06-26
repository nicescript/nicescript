nice.Type({
  title: 'Box',

  extends: 'Something',

  creator: () => {
    const f = (...a) => {
      if(a.length === 0){
        f.compute();
        return f.state;
      }
      f._notifing || f.setState(...a);
      return f._parent || f;
    };
    f.state = nice.PENDING;
    f._subscriptions = [];
    f._subscribers = [];
    return f;
  },

  constructor: (z, ...a) => a.length && z(...a),

  proto: {
    by: function (...a){
      this._by = a.pop();
      a.length && this.use(...a);
      this.state = nice.NEED_COMPUTING;
      return this;
    },

    async: function (f){
      this._asyncBy = f;
      this.state = nice.NEED_COMPUTING;
      return this;
    },

    use: function (...ss){
      ss.forEach(s => {
        if(s.__proto__ === Promise.prototype)
          s = Box().follow(s);

        expect(s !== this, `Box can't use itself`).toBe();
        expect(s, `Can use only box or promise.`).Box();
        this._subscriptions.push(s);
        this.state = nice.NEED_COMPUTING;
      });
      this.isHot() && this.compute();
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
      }
      this.state = nice.NEED_COMPUTING;
      this.isHot() && this.compute();
      return this;
    },

    interval: function (f, t = 200) {
      setInterval(() => f(this), t);
      return this;
    },

    timeout: function (f, t = 200) {
      setTimeout(() => f(this), t);
      return this;
    },

    doCompute: function (){
      this.transactionStart();
      this.state = nice.PENDING;
      let state;
      const ss = this._subscriptions;

      ss.forEach(s => {
        if(!s._subscribers.includes(this)){
          s.isResolved() || s.compute();
          s._subscribers.push(this);
        }
      });

      const states = ss.map(s => s.state);

      if(ss.some(s => !s.isResolved())){
        state = nice.PENDING;
      } else if(states.find(is.Error)){
        state = nice.Error(`Dependency error`);
      }

      try {
        if(state){
          this(state);
        } else if(this._by){
          this(this._by(...states));
        } else if(this._asyncBy){
          this._asyncBy(this, ...states);
        } else {
          this(states[0]);
        }
      } catch (e) {
        console.log('ups', e);
        this.error(e);
        return;
      } finally {
        return this.transactionEnd(true);
      }

      return this.state;
    },

    compute: function() {
      return this.state !== nice.NEED_COMPUTING || this._transactionDepth
        ? this.state : this.doCompute();
    },

    valueOf: function() {
      return this.hasOwnProperty('state') && this.state;
    },

    getDiff: function (){
      if(this._diff || this._diff === false)
        return this._diff;

      return this._diff = nice.diff(
          diffConverter(this.initState),
          diffConverter(this.state)
      );
    },

    change: function (f){
      this.transactionStart();
      let res = f(this.state);
      res === undefined || (this.state = res);
      this.transactionEnd();
      return this;
    },

    setState: function(v){
      if(v === undefined)
        throw `Can't set state of the box to undefined.`;
      if(v === this)
        throw `Can't set state of the box to box itself.`;

      while(v && v._up_)
        v = v._up_;

      if(nice.is.Box(v))
        return this.follow(v)();

      this.transactionStart();
      this.state = v;
      this.transactionEnd();
      return this.state;
    },

    _notify: function (){
      this._notifing = true;
      this._subscribers.forEach(s => {
        if(s.doCompute){
          s._notifing || s.doCompute();
        } else {
          this.isResolved() && s(this.state);
        }
      });
      this._notifing = false;
    },

    isHot: function (){
      return this._transactionDepth
        || (this._subscribers && this._subscribers.length);
    },

    lock: function(){
      this._locked = true;
      return this;
    },

    unlock: function(){
      this._locked = false;
      return this;
    },

    'default': function (v) {
      this.isResolved() || this(v);
    },

    error: function(e) {
      return this.setState(is.Error(e) ? e : nice.Error(e));
    },

    transactionStart: function(){
      if(this._locked)
        throw nice.LOCKED_ERROR;
      if(!this._transactionDepth){
        this.initState = this.state;
        this.state = nice.cloneDeep(this.initState);
        this._diff = null;
        this._transactionDepth = 0;
      }
      this._transactionDepth++;
      return this;
    },

    transactionEnd: function(onlyIfDiff = false){
      if(--this._transactionDepth > 0)
        return false;

      this._transactionDepth = 0;

      const go = this.getDiff();
      go && this._notify();
      this.initState = null;
      Object.freeze(this.state);
      delete this._diff;
      return go;
    },

    transactionRollback: function(){
      this._transactionDepth && (this.state = this.initState);
      this._transactionDepth = 0;
      this.initState = null;
      delete this._diff;
      return this;
    },

    transaction: function (f, p) {
      this.transactionStart();
      f();
      this.transactionEnd(p);
      return this;
    },

    isResolved: function (){
      return this.state !== nice.NEED_COMPUTING && this.state !== nice.PENDING;
    },

    getPromise: function () {
      return new Promise((resolve, reject) => {
        this.listenOnce(v => (is.Error(v) ? reject : resolve)(v));
      });
    }
  }
}).about('Observable component for declarative style programming.');
Box = nice.Box;
const F = Func.Box;


['use', 'follow', 'once', 'by', 'async']
    .forEach(k => def(Box, k, (...a) => Box()[k](...a)));


function diffConverter(v){
  return is.Value(v) ? v.getResult() : v;
}


F.function(function listen(source, f) {
  const ss = source._subscribers;

  if(!ss.includes(f)){
    ss.push(f);
    source.isResolved() ? f(source.state) : source.compute();
  }

  return source;
});


F.function(function listenOnce(source, f) {
  source.isResolved() || source.compute();

  if(source.isResolved())
    return f(source.state);

  const _f = v => {
    f(v);
    source.unsubscribe(_f);
  };

  source._subscribers.push(_f);

  return source;
});


F('listenDiff', (b, f) => b.listen(() => f(b.getDiff())));


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


nice._on('Type', type => {
  if(!type.title)
    return;

  def(Box.proto, type.title, function (name, value) {
    expect(name).string();

    const input = Box();
    value !== undefined && input(value);
    input._parent = this;
    def(this, name, input);
    return this.use(input);
  });
});


def(nice, 'resolveChildren', (v, f) => {
  if(!v)
    return f(v);

  if(is.Box(v))
    return v.listenOnce(_v => nice.resolveChildren(_v, f));

  if(v._result){
    if(is.object(v._result)){
      let count = 0;
      const next = () => {
        count--;
        count === 0 && f(v);
      };
      _each(v._result, () => count++);
      !count ? f(v) : _each(v._result, (vv, kk) => {
        nice.resolveChildren(vv, _v => {
          if(_v && _v._type){
            _v = _v._result;
          }
          v._result[kk] = _v;
          next();
        });
      });
    } else {
      f(v);
    }
  } else {
    if(is.object(v)){
      let count = 0;
      const next = () => {
        count--;
        count === 0 && f(v);
      };
      _each(v, () => count++);
      !count ? f(v) : _each(v, (vv, kk) => {
        nice.resolveChildren(vv, _v => {
          if(_v && _v._type){
            _v = _v._result;
          }
          v[kk] = _v;
          next();
        });
      });
    } else {
      f(v);
    }
  }
});


nice._on('Action', f => {
  const {name} = f;
  Box.proto.hasOwnProperty(name) || def(Box.proto, name,
    function (...a) {
      return this.change(state => f(state, ...a));
    }
  );
});


nice._on('Mapping', ({name}) => {
  Box.proto.hasOwnProperty(name) || def(Box.proto, name,
    function (...a) {
      return Box().use(this).by(z => nice[name](z, ...a));
    }
  );
});
