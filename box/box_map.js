nice.Type({
  name: 'BoxMap',

  extends: 'Something',

  customCall: (z, ...as) => {
    if(as.length)
      throwF('Use access methods to change BoxMap');
    return z._value;
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
        else
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
    },
    map (f) {
      const res = nice.BoxMap();
      this.subscribe((v,k) => res.set(k, f(v)));
      return res;
    },
    filter (f) {
      const res = nice.BoxMap();
      this.subscribe((v,k) => f(v, k)
          ? res.set(k, v)
          : k in res._value && res.set(k, null)
      );
      return res;

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
  b.set('a', null);
  expect(spy).calledWith(null, 'a');
  expect(b()).deepEqual({z:3});
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
  expect(b()).deepEqual({a:1, z:3});
});


Test((BoxMap, map, Spy) => {
  const a = BoxMap({a:1, b:2});
  const b = a.map(x => x * 2);
  const spy = Spy();
  b.subscribe(spy);
  expect(spy).calledTwice();
  expect(spy).calledWith(2, 'a');
  expect(spy).calledWith(4, 'b');
  a.set('a', 3);
  expect(spy).calledWith(6, 'a');
  expect(spy).calledTimes(3);
  a.set('c', 4);
  expect(b()).deepEqual({a:6, b:4, c:8});
});


Test((BoxMap, filter) => {
  const a = BoxMap({a:1, b:2, c: 3});
  const b = a.filter(x => x % 2);

  expect(b()).deepEqual({a:1, c:3});

  a.set('a', 4);
  expect(b()).deepEqual({c:3});

  a.set('d', 5);
  expect(b()).deepEqual({c:3, d:5});

  a.set('z', null);
  expect(b()).deepEqual({c:3, d:5});
});
