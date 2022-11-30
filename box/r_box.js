//idea?? box always have value(even undefined); subscribe always produce call(even undefined)

nice.Type({
  name: 'RBox',

  extends: 'Box',

  initBy: (z, ...inputs) => {
    z._version = 0;
    z._by = inputs.pop();
    if(typeof z._by !== 'function')
      throw `RBox only accepts functions`;
    z._isHot = false;
    z._inputs = inputs;
    z._inputValues = [];
    z._inputListeners = new Map();
  },

  customCall: (z, ...as) => {
    if(as.length === 0) {
      z._isHot === true || z.coldCompute();
      return z._value;
    }

    throw `Can't set value for reactive box`;
  },

  proto: {
    reconfigure(...inputs) {
      const by = inputs.pop();

      if(typeof by !== 'function')
        throw `RBox only accepts functions`;

      const oldInputs = this._inputs;
      oldInputs.forEach(input => {
        inputs.includes(input) || this.detachSource(input);
      });

      this._by = by;
      this._inputs = inputs;
      this._inputValues = this._inputs.map(v => v._value);
      inputs.forEach(input => {
        oldInputs.includes(input) || this.attachSource(input);
      });
      this._isHot === true && this.attemptCompute();
    },

    subscribe(f) {
      this.warmUp();
      this.on('state', f);
      f(this._value);
    },

    unsubscribe(f){
      this.off('state', f);
      if(!this.countListeners('state')){
        this.coolDown();
        this.emit('noMoreSubscribers', this);
      }
    },

    attemptCompute(){
      try {
        const value = this._by(...this._inputValues);
        this.setState(value);
      } catch (e) {
        this.setState(e);
      }
    },

    coldCompute(){
      this._inputValues = this._inputs.map(v => v());
      this.attemptCompute();
    },

    warmUp(){
      if(this._isHot === true)
        return ;
      this._isHot = true;
			this.warming = true;
      this._inputs.forEach(input => this.attachSource(input));
			delete this.warming;
      this._inputValues = this._inputs.map(v => v._value);
      this.attemptCompute();
    },

    coolDown(){
      this._isHot = false;
      for (let [input, f] of this._inputListeners)
        this.detachSource(input);
    },

    attachSource(source) {
      if(source._isBox){
        const f = state => {
          const position = this._inputs.indexOf(source);
          this._inputValues[position] = state;
          this.warming || this.attemptCompute();
        };
        this._inputListeners.set(source, f);

        return source.subscribe(f);
      }
    },

    detachSource(source) {
      source._isBox && source.unsubscribe(this._inputListeners.get(source));
    }
  }
});


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