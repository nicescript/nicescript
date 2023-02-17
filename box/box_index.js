nice.Type({
  name: 'BoxIndex',

  extends: 'DataSource',

  customCall: (z, ...as) => {
    if(as.length)
      throw 'Use access methods to change BoxMap';
    return z._value;
  },

  initBy: z => z._value = new Map(),

  proto: {
    add (v, k) {
      //TODO: handle NaN, -0, +0
//      const type = typeof v;
//      if(type !== 'string' || type !== 'number' || type !== 'boolean')
//        throw 'BoxIndex only takes string, number, and boolean values. You tried ' + type;

      if(Array.isArray(k))
        throw "Array can't be used as BoxIndex key.";

      const map = this._value;

      if(map.has(v)){
        const current = map.get(v);
        if(current instanceof Set) {
          if(!current.has(k)){
            current.add(k);
            this.emit('add', v, k);
          }
        } else if (current !== k) {
          map.set(v, new Set([current, k]));
          this.emit('add', v, k);
        }
      } else {
        map.set(v, k);
        this.emit('add', v, k);
      }
      return this;
    },

    delete (v, k) {
      const map = this._value;

      if(map.has(v)){
        const current = map.get(v);
        if(current instanceof Set) {
          current.delete(k) && this.emit('delete', v, k);
          if(current.size === 1)
            map.set(v, current.values().next().value);
        } else {
          if(current === k){
            map.delete(v);
            this.emit('delete', v, k);
          }
        }
      }
      return this;
    },

    has (v, k) {
      const map = this._value;
      if(map.has(v)){
        const kk = map.get(v);
        return (kk instanceof Set) ? kk.has(k) : k === kk;
      }
      return false;
    },

    getKeys (v) {
      const map = this._value;
      if(map.has(v)){
        const kk = map.get(v);
        return (kk instanceof Set) ? Array.from(kk) : [kk];
      }
      return null;
    },

    iterateValue (v, f) {
      const map = this._value;
      if(map.has(v)){
        const kk = map.get(v);
        kk instanceof Set ? kk.forEach(_v => f(_v)) : f(kk);
      }
      return this;
    },

    iterateAll (f) {
      this._value.forEach((kk, v) => kk instanceof Set
        ? kk.forEach(k => f(v, k))
        : f(v, kk));
    },

    subscribe ({add, del}) {
      expect(typeof add).is('function');
      expect(typeof del).is('function');
      this.iterateAll(add);
      this.on('add', add);
      this.on('delete', del);
    },

    unsubscribe ({add, del}) {
      this.off('add', add);
      this.off('delete', del);
    },

  }
});


Test((BoxIndex, Spy) => {
  const b = BoxIndex();
  b.add('qwe', 1);
  b.add('qwe', 3);
  b.add('asd', 15);

  expect(b.has('qwe', 1)).isTrue();
  expect(b.has('qwe', 3)).isTrue();

  expect(b.has('qwe', 15)).isFalse();
  expect(b.has('asd', 15)).isTrue();

  b.delete('qwe', 3);
  expect(b.has('qwe', 1)).isTrue();
  expect(b.has('qwe', 3)).isFalse();

  const spy = Spy();
  b.iterateValue('qwe', spy);
  expect(spy).calledOnce();

  b.delete('asd', 15);
  expect(b.has('qwe', 15)).isFalse();

  const spy2 = Spy();
  b.iterateValue('asd', spy2);
  expect(spy2).neverCalled();

  const spy3 = Spy();
  b.iterateAll(spy3);
  expect(spy3).calledOnce();
});



Test((BoxIndex, Spy) => {
  const b = BoxIndex();
  const add = Spy();
  const del = Spy();
  b.subscribe({add, del});

  b.add('a', 1);
  expect(add).calledWith('a', 1);

  b.add('a', 2);
  expect(add).calledWith('a', 2);

  b.add('a', 3);
  expect(add).calledWith('a', 3);
  expect(del).neverCalled();

  b.delete('a', 2);
  expect(del).calledWith('a', 2);

  b.delete('a', 4);
  expect(del).calledTimes(1);

  b.delete('a', 1);
  b.delete('a', 3);
  b.delete('a', 3);
  expect(del).calledTimes(3);
  expect(add).calledTimes(3);
});

