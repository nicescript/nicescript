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
    z._inputListeners = [];
  },

  customCall: (z, ...as) => {
    if(as.length === 0)
      return z._value;

    throw `Can't set value for reactive box`;
  },

  proto: {
    subscribe(f){
      this.warmUp();
      this.on('state', f);
      if(this._status & IS_READY){
        f(this._value);
      }
    },

    unSubscribe(f){
      this.off('state', f);
      if(!this.countListeners('state'))
        this.coolDown();
    },

    attemptCompute(){
      try {
        //check dependencies
        const ready = this._inputValues.every(v => v !== undefined);

        if(!ready)
          return;

        //compute
        const value = this._by(...this._inputValues);
        this.setState(value);
        this._status &= ~IS_LOADING;
        this._status |= IS_READY;
      } catch (e) {
        this.setState(nice.Err('Fail to compute'));
      }
    },

    warmUp(){
      if(this._status & IS_HOT)
        return ;
      this._status |= IS_LOADING;
      this._status |= IS_HOT;
      this._status &= ~IS_READY;
      this._inputs.forEach((input, i) => this.attachSource(input, i));
      this.attemptCompute();
    },

    coolDown(){
      this._status &= ~IS_HOT;
      this._inputListeners.forEach((f, i) => {
        const source = this._inputs[i];
        if(source._isBox){

          if(source._isRBox)
            return source.unSubscribe(f);

          return source.off('state', f);
        }
      });
    },

    attachSource(s, i){
      if(s._isBox){
        const f = state => {
          this._inputValues[i] = state;
          this.attemptCompute();
        };
        this._inputListeners[i] = f;

        if(s._isRBox)
          return s.subscribe(f);

        this._inputValues[i] = s._value;
        return s.on('state', f);
      }
    },
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
  rb.unSubscribe(spy);
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

