const IS_READY = 1;
const IS_LOADING = 2;
const IS_HOT = 4;

nice.Type({
  name: 'RBox',

  extends: 'Box',

  initBy: (z, ...inputs) => {
    z._by = inputs.pop();
    if(typeof z._by !== 'function')
      throw `RBox only accepts functions`;
    z._status = 0;
    z._inputs = inputs;
    z._inputValues = [];
    z._inputListeners = new Map();
  },

  customCall: (z, ...as) => {
    if(as.length === 0){
      if(!(z._status & IS_READY))
        z .attemptCompute();

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
      if(this._status & IS_HOT)
        this.attemptCompute();

//      this._status = 0;
//      this._inputListeners = [];)
    },

    subscribe(f){
      this.warmUp();
      this.on('state', f);
      if(this._status & IS_READY){
        f(this._value);
      }
    },

    unsubscribe(f){
      this.off('state', f);
      if(!this.countListeners('state'))
        this.coolDown();
    },

    attemptCompute(){
      const ready = this._inputValues.every(v => v !== undefined);

      if(!ready)
        return;

      try {
        const value = this._by(...this._inputValues);
        this.setState(value);
        this._status &= ~IS_LOADING;
        this._status |= IS_READY;
      } catch (e) {
//        this.setState(nice.Err('Fail to compute'));
        this.setState(e);
      }
    },

    warmUp(){
      if(this._status & IS_HOT)
        return ;
      this._status |= IS_LOADING;
      this._status |= IS_HOT;
      this._status &= ~IS_READY;
      this._inputs.forEach(input => this.attachSource(input));
      this._inputValues = this._inputs.map(v => v._value);
      this.attemptCompute();
    },

    coolDown(){
      this._status &= ~IS_HOT;
      for (let [input, f] of this._inputListeners) {
        this.detachSource(input);
//        const source = this._inputs[i];
//        if(source._isBox){
//
//          if(source._isBox)
//            return source.unsubscribe(f);
//
//          return source.off('state', f);
//        }
      };
    },

    attachSource(source, i){
      if(source._isBox){
        const f = state => {
          const position = this._inputs.indexOf(source);
          this._inputValues[position] = state;
          this.attemptCompute();
        };
        this._inputListeners.set(source, f);

        if(source._isRBox)
          return source.subscribe(f);

        return source.on('state', f);
      }
    },

    detachSource(source){
      const f = this._inputListeners.get(source);
      if(source._isBox){

        if(source._isRBox)
          return source.unsubscribe(f);

        return source.off('state', f);
      }
    }
  }
});


function checkSourceStatus(s){
  return s._isRBox ? (s._status & IS_READY) : true;
}

function extractSourceValue(s){
  return s._isBox ? s._value : s;
}


Test('RBox basic case', (Box, RBox) => {
  const b = Box(1);
  const rb = RBox(b, a => a + 1);
  rb.warmUp();
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

