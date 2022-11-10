nice.Type({
  name: 'BoxSet',

  extends: 'DataSource',

  customCall: (z, ...as) => {
    if(as.length)
      SthrowF('Use access methods');
    return z._value;
  },

  initBy: (z, ...a) =>  {
    z._version = 0;
    z._value = new Set(a);
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

    intersection (b) {
      const av = this._value;
      const bv = b._value;
      const res = nice.BoxSet();

      if(av.size > bv.size) {
        bv.forEach(v => av.has(v) && res.add(v));
      } else {
        av.forEach(v => bv.has(v) && res.add(v));
      }

      this.subscribe((v, oldV) => {
        v === null
          ? res.delete(oldV)
          : bv.has(v) && res.add(v);
      });

      b.subscribe((v, oldV) => {
        v === null
          ? res.delete(oldV)
          : av.has(v) && res.add(v);
      });

      return res;
    },

    subscribe (f) {
      for (let v of this._value) f(v);
      this.on('value', f);
    },

    subscribe (f) {
      for (let v of this._value) f(v);
      this.on('value', f);
    },

    unsubscribe (f) {
      this.off('value', f);
    },
  }
});


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


Test((BoxSet, intersection, Spy) => {
  const a = BoxSet(1,2,3);
  const b = BoxSet(2,4,6);
  const c = a.intersection(b);

  expect([...c()]).deepEqual([2]);

  a.add(4);
  expect([...c()]).deepEqual([2,4]);

  a.delete(2);
  expect([...c()]).deepEqual([4]);

  b.delete(4);
  expect([...c()]).deepEqual([]);
});

