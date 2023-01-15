nice.Type({
  name: 'LazyBox',

  extends: 'Box',

  initBy: (z, f) => {
    z._version = -1;
    z._by = f;

    if(typeof z._by !== 'function')
      throw `Last argument to RBox should be function or object`;

    z._isHot = false;
  },

  customCall: (z, ...as) => {
    if(as.length === 0) {
      z.warmUp();
      return z._value;
    }

    z.setState(as[0]);
  },

  proto: {
    reconfigure(f) {
      //TODO:
    },

    subscribe(f, v) {
      this.warmUp();
      this.__proto__.__proto__.subscribe.call(this, f, v);
    },

    unsubscribe(f){
      this.off('state', f);
      if(!this.countListeners('state')){
//        this.coolDown();
        this.emit('noMoreSubscribers', this);
      }
    },

    warmUp(){
      if(this._isHot === true)
        return ;
      this._isHot = true;
      try {
        const v = this._version;
        const value = this._by(this);
        if(v === this._version)
          this.setState(value);
      } catch (e) {
        this.setState(e);
      }
    },

//    coolDown(){
//      this._isHot = false;
//      this._inputValues = [];
//      for (let c of this._ins)
//        c.detach();
//    }
  }
});


Test((LazyBox, Spy) => {
  const spy = Spy(() => 2);
  const b = LazyBox(spy);
  expect(b()).is(2);
  expect(b()).is(2);
  expect(spy).calledOnce();
});


Test((LazyBox, Spy) => {
  const spy = Spy(b => b(2));
  const b = LazyBox(spy);
  expect(b()).is(2);
  expect(b()).is(2);
  expect(spy).calledOnce();
});


Test('RBox subscribe', (Box, RBox, Spy) => {
  const spy = Spy();
  const b = Box(1);
  const rb = RBox(b, a => a + 1);
  rb.subscribe(spy);
  expect(spy).calledWith(2);
  b(3);
  expect(spy).calledWith(4);
});