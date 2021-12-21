nice.Type({
  name: 'BoxMap',

  extends: 'Something',

  customCall: (z, ...as) => {
    throwF('Use access methods');
  },

  initBy: (z, o) => {
    z._value = {};
    o && _each(o, (v, k) => z.set(k, v));
  },

  proto: {
    set (k, v) {
      const values = this._value;
      if(v === values[k]) {
        ;
      } else {
        if(v === null)
          delete this._value[k];
        this._value[k] = v;
        this.emit('value', v, ''+k);
      }
      return this;
    },
    get (k) {
      return this._value[k];
    },
    subscribe (f) {
      _each(this._value, f);
      this.on('value', f);
    },
    unsubscribe (f) {
      this.off('value', f);
    },
    setState (v){
      this._value = v;
      this.emit('state', v);
    }
  }
});
nice.eventEmitter(nice.BoxMap.proto);

Test((BoxMap, Spy) => {
  const b = BoxMap();
  const spy = Spy();
  b.set('a', 1);
  b.subscribe(spy);
  expect(spy).calledWith(1, 'a');
  b.set('z', 3);
  expect(spy).calledWith(3, 'z');
  expect(spy).calledTwice();
});

Action.BoxMap('assign', (z, o) => _each(o, (v, k) => z.set(k, v)));

Test((BoxMap, assign, Spy) => {
  const b = BoxMap();
  const spy = Spy();
  b.set('a', 1);
  b.subscribe(spy);
  expect(spy).calledWith(1, 'a');
  b.assign({z: 3});
  expect(spy).calledWith(3, 'z');
  expect(spy).calledTwice();
});
