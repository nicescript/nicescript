nice.Type({
  name: 'IntervalBox',

  extends: 'Box',

  initBy: (z, ms, f) => {
    if(typeof ms !== 'number')
      throw `1st argument must be number`;
    if(typeof f !== 'function')
      throw `2nd argument must be functions`;
    z._ms = ms;
    z._f = f;
    z._interval = null;
  },

  proto: {
    subscribe(f){
      if(this._interval === null){
        this._interval = setInterval(() => this(this._f(this())), this._ms);
        this._value === undefined && this.setState(this._f());
      }
      if(this._value !== undefined)
        f.notify ? f.notify(this._value) : f(this._value);
      this.on('state', f);
    },

    unsubscribe(f){
      this.off('state', f);
      if(!this.countListeners('state')){
        if(this._interval !== null){
          clearInterval(this._interval);
          this._interval = null;
        }
        this.emit('noMoreSubscribers', this);
      }
    },
  }
});

Action.Box('changeAfter', (z, ms, f) => setTimeout(() => z(f(z())), ms));


Test((IntervalBox, RBox, Spy) => {
  const n = IntervalBox(450, (old = 0) => old + 1);
  const x2 = RBox(n, n => n * 2);
  const spy = Spy();

  Test(() => {
    expect(n._value).is(undefined);
    expect(spy).calledTimes(0);
    x2.subscribe(spy);
    expect(n._value).is(1);
    expect(spy).calledTimes(1);
  });

  Test(() => {
    x2.unsubscribe(spy);
    expect(n._interval).is(null);
    expect(spy).calledTimes(1);
  });
});
