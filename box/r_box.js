//TODO: cover RBox(input, []) with tests

class Connection{
  constructor(cfg) {
    Object.assign(this, cfg);
    this.version = 0;
  }

  attach(){
    const { source } = this;

    if(source._isBox){
      const needUpdate = source._version === 0 || this.version < source._version;
      source.subscribe(this, this.version);
      return needUpdate;
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
    z._version = 0;
    let by = inputs.pop();

    inputs.forEach((v, k) => {
      if(!v._isBox)
        throw new Error(`Argument ${k} is not a Box`);
    });

    if(Array.isArray(by)){
      z._left = by[1];
      by = by[0];
    }

    if(typeof by === 'object')
      by = objectPointers[inputs.length](by);

    if(typeof by !== 'function')
      throw `Last argument to RBox should be function or object`;

    z._by = by;

    z._ins = inputs.map((source, position) => new Connection({
      source, target:z, value: undefined, position
    }));
    z._isHot = false;
    z.warming = false;
    z._inputValues = Array(inputs.length).fill(undefined);
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

    attemptCompute(){
      let v;
      try {
        if('_left' in this && this._inputValues.some(i => i === undefined))
          v = typeof this._left === 'function' ? this._left() : this._left;
        else
          v = this._by(...this._inputValues);
      } catch (e) {
        v = e;
      }
      this.setState(v);
    },

    coldCompute(){
      let needCompute = false;
      for (let c of this._ins){
        const v = c.source();
        if(c.version === 0 || c.version < c.source._version){
          this._inputValues[c.position] = v;
          c.version = c.source._version;
          needCompute = true;
          break;
        }
      }

      needCompute && this.attemptCompute();
    },

    warmUp(){
      this.warming = true;
      let needCompute = false;
      for (let c of this._ins)
        needCompute |= c.attach();
			this.warming = false;
//      this.coldCompute();
      needCompute && this.attemptCompute();
    },

    coolDown(){
      this._inputValues = [];
      for (let c of this._ins)
        c.detach();
    }
  }
});


const objectPointers = {
  1: o => k => o[k](),
  2: o => (k1, k2) => o?.[k1]?.[k2](),
  2: o => (k1, k2, k3) => o?.[k1]?.[k2]?.[k3]()
};


Test('RBox basic case', (Box, RBox) => {
  const b = Box(1);
  const rb = RBox(b, a => a + 1);
  expect(rb()).is(2);
  b(3);
  expect(rb()).is(4);
});


Test('RBox cold compute', (Box, RBox, Spy) => {
  const b = Box(1);
  const spy = Spy(a => a + 1);
  const spy2 = Spy();
  const rb = RBox(b, spy);

  expect(rb._value).is(undefined);
  expect(rb()).is(2);
  expect(spy).calledOnce();

  expect(rb()).is(2);
  expect(spy).calledOnce();

  b(3);
  expect(spy).calledOnce();
  expect(rb._value).is(2);

  expect(rb()).is(4);
  expect(spy).calledTwice();

  rb.subscribe(spy2);
  expect(spy).calledTwice();
  expect(spy2).calledOnce();
  expect(spy2).calledWith(4);
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


Test('Array as subscriber', (Box, RBox, Spy) => {
  var a = Box();
  const spy = Spy();
  var b = RBox(a, [x => x + 3, 0]);
  b.subscribe(spy);

  expect(b()).is(0);
  expect(spy).calledWith(0);

  a(1);
  expect(b()).is(4);
  expect(spy).calledWith(4);
});


Test((RBox, Box) => {
  const b = Box();
  const rb = RBox(b, v => '12');
  expect(rb()).is('12');
});


