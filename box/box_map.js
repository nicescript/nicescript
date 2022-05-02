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
        const oldValue = k in values ? values[k] : null;
        if(v === null)
          delete values[k];
        else
          values[k] = v;
        this.emit('value', v, ''+k, oldValue);
      }
      return this;
    },
    get (k) {
      return this._value[k];
    },
    subscribe (f) {
      _each(this._value, (v, k) => f(v, k, null));
      this.on('value', f);
    },
    unsubscribe (f) {
      this.off('value', f);
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


Mapping.BoxMap('sort', (z) => {
  const res = nice.BoxArray();
  const values = [];

  z.subscribe((v, k, oldV) => {
    if(oldV !== null) {
      const i = nice.sortedIndex(values, oldV);
      values.splice(i, 1);
      res.remove(i);
    }
    if(v !== null) {
      const i = nice.sortedIndex(values, v);
      values.splice(i, 0, v);
      res.insert(i, k);
    }
  });

  return res;
});


Test('sort keys by values', (BoxMap, sort) => {
  const a = BoxMap({a:1, c: 3, b:2});
  const b = a.sort();

  expect(b()).deepEqual(['a', 'b', 'c']);

  a.set('a', 4);
  expect(b()).deepEqual(['b', 'c', 'a']);

  a.set('d', 5);
  expect(b()).deepEqual(['b', 'c', 'a', 'd']);

  a.set('c', null);
  expect(b()).deepEqual(['b', 'a', 'd']);
});


Mapping.BoxMap.Function('sort', (z, f) => {
  const res = nice.BoxArray();
  const values = [];

  z.subscribe((v, k, oldV) => {
    if(oldV !== null) {
      const i = nice.sortedIndex(values, f(oldV, k));
      values.splice(i, 1);
      res.remove(i);
    }
    if(v !== null) {
      const computed = f(v, k);
      const i = nice.sortedIndex(values, computed);
      values.splice(i, 0, computed);
      res.insert(i, k);
    }
  });

  return res;
});


Test('sort keys by function', (BoxMap, sort) => {
  const a = BoxMap({a:1, c: 3, b:2});
  const b = a.sort((v, k) => 1 / v);

  expect(b()).deepEqual(['c', 'b', 'a']);

  a.set('a', 4);
  expect(b()).deepEqual(['a', 'c', 'b']);

  a.set('d', 5);
  expect(b()).deepEqual(['d', 'a', 'c', 'b']);

  a.set('c', null);
  expect(b()).deepEqual(['d', 'a', 'b']);
});


Mapping.BoxMap.BoxMap('sort', (z, index) => {
  const res = nice.BoxArray();
  const targetValues = z._value;
  const indexValues = index._value;
  const values = [];

  z.subscribe((v, k, oldV) => {
    if(oldV !== null) {
      const i = nice.sortedIndex(values, indexValues[k]);
      values.splice(i, 1);
      res.remove(i);
    }
    if(v !== null) {
      const computed = indexValues[k];
      const i = nice.sortedIndex(values, computed);
      values.splice(i, 0, computed);
      res.insert(i, k);
    }
  });

  let ignoreIndex = true;
  index.subscribe((v, k, oldV) => {
    if(ignoreIndex || !(k in z._value))
      return;
    let oldI = nice.sortedIndex(values, oldV);

//    assure old position for equal elements
    for(let i = oldI; values[i] === oldV; i++){
      if(res._value[i] === k)
        oldI = i;
    }
    
    const i = nice.sortedIndex(values, v);
    if(oldI !== i){
      values.splice(oldI, 1);
      res.remove(oldI);
      values.splice(i, 0, v);
      res.insert(i, k);
    }
  });
  ignoreIndex = false;

  return res;
});


Test('sort keys by values from another BoxMap', (BoxMap, sort) => {
  const a = BoxMap({a:true, c: true, b:true});
  const index = BoxMap({a:1, c: 3, b:2});
  const b = a.sort(index);

  expect(b()).deepEqual(['a', 'b', 'c']);

  index.set('a', 4);
  expect(b()).deepEqual(['b', 'c', 'a']);

  a.set('d', true);
  expect(b()).deepEqual(['d', 'b', 'c', 'a']);

  index.set('d', 6);
  expect(b()).deepEqual(['b', 'c', 'a', 'd']);

  index.set('c', 6);
  expect(b()).deepEqual(['b', 'a', 'd', 'c']);
  index.set('c', null);
  expect(b()).deepEqual(['c', 'b', 'a', 'd']);

//  index.set('c', null);
//  expect(b()).deepEqual(['c', 'b', 'a', 'd']);
});