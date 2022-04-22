nice.Type({
  name: 'BoxArray',

  extends: 'Something',

  customCall: (z, ...as) => as.length === 0 ? z._value : z.setAll(as[0]),

  initBy: (z, v) => {
    z._value = [];
    z._sub
    v && z.setAll(v);
  },

  proto: {
    set (k, v) {
      if(v === null)
        throw `Can't be set to null`;

      const values = this._value;

      if(v !== values[k]) {
        const old = k in values ? values[k] : null;
        const oldKey = k in values ? k : null;
        values[k] = v;
        this.emit('element', v, k, old, oldKey);
      }
      return this;
    },
    push (v) {
      this.set(this._value.length, v);
    },
    remove (i) {
      const vs = this._value;
      if(i >= vs.length)
        return;
      const old = vs[i];
      this._value.splice(i, 1);
      this.emit('element', null, null, old, i);
    },
    insert (i, v) {
      const vs = this._value;
      this._value.splice(i, 0, v);
      this.emit('element', v, i, null, null);
    },
    setAll (a) {
      if(!Array.isArray(a))
        throw 'setAll expect array';

      const newLength = a.length;
      const oldValues = this._value;
      const oldLength = oldValues.length;

      a.forEach((v, k) => {
        this.emit('element', v, k,
          k >= oldLength ? null : oldValues[k],
          k >= oldLength ? null : k);
      });

      if(newLength < oldLength) {
        for(let i = newLength; i < oldLength ; i++)
          this.emit('element', null, null, oldValues[i], i);
      }

      this._value = a;
    },
    subscribe (f) {
      this._value.forEach((v, k) => f(v, k, null, null));
      this.on('element', f);
    },
    unsubscribe (f) {
      this.off('value', f);
    },

    map (f) {
      const res = nice.BoxArray();
      this.subscribe((value, index, oldValue, oldIndex) => {
        if(value !== null && oldValue !== null) {
          res.set(index, f(value));
        } else if (value === null) {
          res.remove(oldIndex);
        } else {
          res.insert(index, f(value));
        }
      });
      return res;
    },


    sort (f) {
      const res = nice.BoxArray();

      this.subscribe((value, index, oldValue, oldIndex) => {
        if(oldIndex !== null) {

        }

        if(index !== null) {
          const position = nice.sortedIndex(res._value, value);
          res.insert(position, value);
        }
      });

      return res;
    },

    filter (f) {
      const res = nice.BoxArray();
      const map = [];

      const findPosition = stop => {
        let count = 0;
        let k = 0;
        let l = map.length
        do {
          if(map[k])
            count++;
        } while( ++k < l && k < stop );
        return count;
      }

      this.subscribe((value, index, oldValue, oldIndex) => {
        const pass = !!f(value);
        const oldPass = map[index];
        if(oldIndex === null)
          map.splice(index, 0, pass);
        else {
          if (index === null)
            map.splice(oldIndex, 1);
          else
            map[index] = pass;
        }

        if(pass) {
          if(oldPass) {
            ;//do nothing
          } else {
            res.insert(findPosition(index), value);
          }
        } else {
          if(oldPass) {
            res.remove(findPosition(index));
          } else {
            ;//do nothing
          }
        }
      });
      return res;
    }

  }
});

nice.eventEmitter(nice.BoxArray.proto);

Test((BoxArray, Spy, set) => {
  const a = BoxArray([1,2]);
  const spy = Spy();

  a.subscribe(spy);

  expect(spy).calledWith(1, 0, null, null);
  expect(spy).calledWith(2, 1, null, null);

  a.set(0, 3);

  expect(spy).calledWith(3, 0, 1, 0);

  expect(spy).calledTimes(3);
  expect(a()).deepEqual([3,2]);
});


Test((BoxArray, Spy, insert) => {
  const a = BoxArray([1,2]);
  const spy = Spy();

  a.subscribe(spy);

  a.insert(1, 3);

  expect(spy).calledWith(3, 1, null, null);

  expect(spy).calledTimes(3);
  expect(a()).deepEqual([1,3,2]);
});



Test((BoxArray, Spy, remove) => {
  const a = BoxArray([1,2,3]);
  const spy = Spy();

  a.subscribe(spy);

  a.remove(1);

  expect(spy).calledWith(null, null, 2, 1);

  expect(spy).calledTimes(4);
  expect(a()).deepEqual([1,3]);
});


Test((BoxArray, Spy, map) => {
  const a = BoxArray([1,2]);
  const b = a.map(x => x * 2);

  expect(b()).deepEqual([2,4]);

  a.setAll([2,3]);
  expect(b()).deepEqual([4,6]);

  a.set(2, 5);
  a.set(1, 6);
  expect(b()).deepEqual([4,12,10]);

  a.remove(1);
  expect(b()).deepEqual([4,10]);
});


//TODO:
Test((BoxArray, Spy, filter) => {
  const a = BoxArray([1,2]);
  const b = a.filter(x => x % 2);

  expect(b()).deepEqual([1]);

  a.setAll([2,3]);
  expect(a()).deepEqual([2,3]);
  expect(b()).deepEqual([3]);

  a.set(2, 5);
  expect(a()).deepEqual([2,3,5]);
  expect(b()).deepEqual([3,5]);

  a.set(1, 6);
  expect(a()).deepEqual([2,6,5]);
  expect(b()).deepEqual([5]);

  a.remove(1);
  expect(a()).deepEqual([2,5]);
  expect(b()).deepEqual([5]);

  a.push(7);
  expect(a()).deepEqual([2,5,7]);
  expect(b()).deepEqual([5,7]);

  a.set(1, 10);
  expect(b()).deepEqual([7]);
});


Test((BoxArray, sort) => {
  const a = BoxArray([3,2,4]);
  const b = a.sort();


  expect(b()).deepEqual([2,3,4]);
});
