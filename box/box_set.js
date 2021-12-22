nice.Type({
  name: 'BoxSet',

  extends: 'Something',

  customCall: (z, ...as) => {
    throwF('Use access methods');
  },

  initBy: (z, o) => {
    z._value = new Set();
    o && _each(o, (v, k) => z.set(k, v));
  },

  proto: {
    add (v) {
      if(v === null)
        throw `BoxSet does not accept null`;
      const values = this._value;
      if(!values.has(v)) {
        values.add(v);
        this.emit('value', v);
      }
      return this;
    },
    has (v) {
      return this._value.has(v);
    },
    delete (v) {
      this.emit('value', null, v);
      return this._value.delete(v);
    },
    subscribe (f) {
      for (let v of this._value) f(v);
      this.on('value', f);
    },
    unsubscribe (f) {
      this.off('value', f);
    },
//    setState (v){
//      this._value = v;
//      this.emit('state', v);
//    }
  }
});
nice.eventEmitter(nice.BoxSet.proto);

Test((BoxSet, Spy) => {
  const b = BoxSet();
  const spy = Spy();
  b.add(1);
  b.subscribe(spy);
  expect(spy).calledWith(1);
  b.add('z');
  expect(spy).calledWith('z');
  expect(spy).calledTwice();

  Test(has => {
    expect(b.has(1)).is(true);
    expect(b.has('1')).is(false);
    expect(b.has('z')).is(true);
    expect(b.has('@')).is(false);
  });

  Test('delete',  () => {
    expect(b.delete(1)).is(true);
    expect(b.has(1)).is(false);
    expect(spy).calledWith(null, 1);
  });
});
