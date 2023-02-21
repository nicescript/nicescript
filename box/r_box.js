//idea?? box always have value(even undefined); subscribe always produce call(even undefined)

class Connection{
  constructor(cfg) {
    Object.assign(this, cfg);
    this.version = -1;
  }

  attach(){
    const { source } = this;

    if(source._isBox){
      return source.subscribe(this);
    } else {
//      throw '';
    }

  }

  detach() {
    this.source.unsubscribe(this);
  }

  notify(v){
    const target = this.target;
    this.version = this.source._version;
    target._inputValues[this.position] = v;
    target.warming || target.attemptCompute();
  }
};

nice.DataSource.Connection = Connection;


nice.Type({
  name: 'RBox',

  extends: 'Box',

  initBy: (z, ...inputs) => {
    //TODO: throw error on wrong inputs
    z._version = -1;
    z._by = inputs.pop();

    if(typeof z._by === 'object')
      z._by = objectPointers[inputs.length](z._by);

    if(typeof z._by !== 'function')
      throw `Last argument to RBox should be function or object`;

    z._ins = inputs.map((source, position) => new Connection({
      source, target:z, value: undefined, position
    }));
    z._isHot = false;
    z.warming = false;
    z._inputValues = [];
  },

  customCall: (z, ...as) => {
    if(as.length === 0) {
      z._isHot === true || z.coldCompute();
      return z._value;
    }

    throw `Can't set value to reactive box`;
  },

  proto: {
    reconfigure(...inputs) {
      const rememberIsHot = this._isHot;
      this._by = inputs.pop();
      if(typeof this._by !== 'function')
        throw `Last argument to RBox should be function`;

			this.warming = true;
      inputs.forEach((source, position) => {
        const old = this._ins[position];
        if(source !== old.source) {
          this._isHot && old.detach();
          const c = new Connection({
            source, target:this, value: undefined, position
          });
          this._isHot && c.attach();
          this._ins[position] = c;
        }
      });
			this.warming = false;

      this._isHot && this.attemptCompute();
    },

//    subscribe(f, v) {
//      this.warmUp();
//      this.__proto__.__proto__.subscribe.call(this, f, v);
//    },

//    unsubscribe(f){
//      this.off('state', f);
//      if(!this.countListeners('state')){
//        this.coolDown();
//        this.emit('noMoreSubscribers', this);
//      }
//    },

    attemptCompute(){
      try {
        const value = this._by(...this._inputValues);
        this.setState(value);
      } catch (e) {
        this.setState(e);
      }
    },

    coldCompute(){
      let needCompute = false;
      for (let c of this._ins){
        const v = c.source();
        if(c.version < 0 || c.version < c.source._version){
          this._inputValues[c.position] = v;
          c.version = c.source._version;
          needCompute = true;
        }
      }

      needCompute && this.attemptCompute();
    },

    warmUp(){
			this.warming = true;
      for (let c of this._ins)
        c.attach();
			this.warming = false;
      this.attemptCompute();
    },

    coolDown(){
      this._inputValues = [];
      for (let c of this._ins)
        c.detach();
    }
  }
});


const objectPointers = {
  1: o => k => o[k],
  2: o => (k1, k2) => o?.[k1]?.[k2],
  2: o => (k1, k2, k3) => o?.[k1]?.[k2]?.[k3]
};


Test('RBox basic case', (Box, RBox) => {
  const b = Box(1);
  const rb = RBox(b, a => a + 1);
  expect(rb()).is(2);
  b(3);
  expect(rb()).is(4);
});


Test('RBox undefined input', (Box, RBox) => {
  const b = Box();
  const rb = RBox(b, a => a + 1);
  expect(isNaN(rb())).is(true);
  b(1);
  expect(rb()).is(2);
  b(3);
  expect(rb()).is(4);
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


Test('RBox unsubscribe', (Box, RBox, Spy) => {
  const spy = Spy();
  const b = Box(1);
  const rb = RBox(b, a => a + 1);
  rb.subscribe(spy);
  expect(spy).calledOnce();
  rb.unsubscribe(spy);
  b(7);
  expect(spy).calledOnce();
  expect(rb.countListeners('state')).is(0);
  expect(b.countListeners('state')).is(0);
});


Test('lazy compute', (Box, RBox, Spy) => {
  const heavyFunction = Spy(a => a + 1);
  const b = Box(1);
  const rb = RBox(b, heavyFunction);
  expect(heavyFunction).not.called();

  expect(rb()).is(2);
  expect(heavyFunction).calledTimes(1);

  expect(rb()).is(2);
  expect(heavyFunction).calledTimes(1);

  b(2);
  expect(rb()).is(3);
  expect(heavyFunction).calledTimes(2);

  expect(rb()).is(3);
  expect(heavyFunction).calledTimes(2);
});


Test('lazy wakeup', (Box, RBox, Spy) => {
  const spy = Spy();
  const heavyFunction = Spy(a => a + 1);
  const b = Box(1);
  const rb = RBox(b, heavyFunction);
  expect(heavyFunction).not.called();
  rb.subscribe(spy);
  expect(heavyFunction).calledTimes(1);

  expect(rb()).is(2);
  expect(heavyFunction).calledTimes(1);

  rb.unsubscribe(spy);
  expect(heavyFunction).calledTimes(1);

  expect(rb()).is(2);
  expect(heavyFunction).calledTimes(1);

  b(2);
  expect(rb()).is(3);
  expect(heavyFunction).calledTimes(2);
});


Test('RBox 2 sources', (Box, RBox, Spy) => {
  const spy = Spy();
  const a = Box(1);
  const b = Box(2);
  const rb = RBox(a, b, (a, b) => a * b);
  rb.subscribe(spy);
  expect(spy).calledWith(2);
  b(3);
  expect(spy).calledWith(3);
  a(2);
  expect(spy).calledWith(6);
});


Test('RBox reconfigure', (Box, RBox, Spy) => {
  const spy = Spy();
  const a = Box(1);
  const b = Box(2);
  const c = Box(3);
  const rb = RBox(a, b, (a, b) => a * b);
  rb.subscribe(spy);
  expect(spy).calledWith(2);
  rb.reconfigure(c, a, (c, a) => c + a);
  expect(spy).calledWith(4);
  a(7);
  expect(spy).calledWith(10);
  expect(b.countListeners('state')).is(0);
});


Test('RBox cold compute', (Box, RBox) => {
  var a = Box(1);
  var b = RBox(a, x => x + 3);
  expect(b()).is(4);
});