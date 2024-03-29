nice.Type({
  name: 'BoxArray',

  extends: 'DataSource',

  customCall: (z, ...as) => as.length === 0 ? z._value : z.setAll(as[0]),

  initBy: (z, v) => {
    z._value = [];
    v && z.setAll(v);
  },

  proto: {
    notify(q,w,e,r){
      if(this.subscribers)
        for (const f of this.subscribers) {
          f.notify
            ? f.notify(q,w,e,r)
            : f(q,w,e,r);
        }
    },

    get (k) {
      return this._value[k];
    },

    last () {
      return this._value[this._value.length - 1];
    },

    set (k, v) {
      if(v === null)
        throw `Can't be set to null`;

      const values = this._value;

      if(v !== values[k]) {
        const old = k in values ? values[k] : null;
        const oldKey = k in values ? k : null;
        values[k] = v;
        this.notify(v, k, old, oldKey);
      }
      return this;
    },
    push (v) {
      this.set(this._value.length, v);
    },
    remove (i) {
      expect(i).isNumber();
      const vs = this._value;
      if(i >= vs.length)
        return;
      const old = vs[i];
      this._value.splice(i, 1);
      this.notify(null, null, old, i);
    },
    removeValue (v) {
      const vs = this._value;
			for(let i = vs.length - 1; i >= 0; i--){
				if(vs[i] === v)
					this.remove(i);
			}
    },
    insert (i, v) {
      const vs = this._value;
      this._value.splice(i, 0, v);
      this.notify(v, i, null, null);
    },
    setAll (a) {
      if(!Array.isArray(a))
        throw 'setAll expect array';

      const newL = a.length;
      const oldA = this._value;
      const oldL = oldA.length;

      a.forEach((v, k) => {
        this.notify(v, k, k >= oldL ? null : oldA[k], k >= oldL ? null : k);
      });

      if(newL < oldL) {
        for(let i = newL; i < oldL ; i++)
          this.notify(null, null, oldA[newL], newL);
      }

      this._value = a;
    },

    notifyExisting(f){
      this._value.forEach((v, k) => f(v, k, null, null));
    },

    map (f) {
      const res = nice.BoxArray();
      this.subscribe((value, index, oldValue, oldIndex) => {
        if(value !== null && oldValue !== null) {
          res.set(index, f(value, index));
        } else if (value === null) {
          res.remove(oldIndex);
        } else {
          res.insert(index, f(value, index));
        }
      });
      return res;
    },


      //TODO: f & BoxMap versions
    sort (f) {
      const res = nice.BoxArray();

      this.subscribe((value, index, oldValue, oldIndex) => {
        if(oldIndex !== null) {
          const position = nice.sortedIndex(res._value, oldValue);
          res.remove(position);
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
      let box;
      if(f._isBox){
        box = f;
        f = f();
      }

      const findPosition = stop => {
        let count = 0;
        let k = 0;
        let l = map.length;
        do {
          if(map[k])
            count++;
        } while( ++k < l && k < stop );
        return count;
      };

      this.subscribe((value, index, oldValue, oldIndex) => {
        const pass = !!f(value);
        const oldPass = oldIndex === null ? null : map[index];
        if(oldIndex === null)
          map.splice(index, 0, pass);
        else {
          if (index === null)
            map.splice(oldIndex, 1);
          else
            map[index] = pass;
        }

        pass && !oldPass && res.insert(findPosition(index), value);

        !pass && oldPass && res.remove(findPosition(index));
      });

      box && box.subscribe(newF => {
        this._value.forEach((v, k) => {
          const pass = !!newF(v);
          const oldPass = map[k];

          if(pass && !oldPass){
            map[k] = true;
            res.insert(findPosition(k), v);
          }

          if(!pass && oldPass){
            map[k] = false;
            res.remove(findPosition(k));
          }

        });
        f = newF;
      });

      return res;
    },

    window(start, length) {
      const res = nice.BoxArray();
      const resValue = res._value;
      const source = this._value;

      const within = n => n >= start && n < start + length;
      this.subscribe((value, index, oldValue, oldIndex) => {
        if(oldIndex !== null) {
          within(oldIndex) && res.remove(oldIndex - start);
          if(oldIndex < start && (index === null || index >= start)) {
            res.remove(0);
            if(res._value.length + start < source.length){
              res.push(source[start + length - 1]);
            }
          };
        }

        if(index !== null) {
          within(index) && res.insert(index - start, value);
          if(index < start && (oldIndex === null || oldIndex >= start)) {
            res.insert(0, source[start]);
          };
        }

        if(res._value.length > length)
          res.remove(length);
      });
      return res;
    }

  }
});


nice.BoxArray.subscribeFunction = ba => {
  return (value, index, oldValue, oldIndex) => {
    if(value !== null && oldValue !== null) {
      ba.set(index, value);
    } else if (value === null) {
      ba.remove(oldIndex);
    } else {
      ba.insert(index, value);
    }
  };
};


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


Test((BoxArray, Spy, push) => {
  const a = BoxArray([1,2]);
  const spy = Spy();

  a.subscribe(spy);

  a.push(3);

  expect(spy).calledWith(3, 2, null, null);

  expect(spy).calledTimes(3);
  expect(a()).deepEqual([1,2,3]);
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



Test((BoxArray, Spy, removeValue) => {
  const a = BoxArray([1,2,3]);
  const spy = Spy();

  a.subscribe(spy);

  a.removeValue(2);

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

  a.remove(1);
  expect(b()).deepEqual([3,4]);

  a.push(7);
  a.push(7);
  a.push(1);
  expect(b()).deepEqual([1,3,4,7,7]);
});


Test((BoxArray, window) => {
  const a = BoxArray([1,2,3,4]);
  const b = a.window(2,2);


  expect(b()).deepEqual([3,4]);

  a.remove(2);
  expect(b()).deepEqual([4]);

  a.push(5);
  expect(b()).deepEqual([4,5]);

  a.insert(0,0);
  expect(b()).deepEqual([2,4]);

  a.remove(0);
  expect(b()).deepEqual([4,5]);

//  a.push(7);
//  a.push(1);
//  expect(b()).deepEqual([1,3,4,7,7]);
});
