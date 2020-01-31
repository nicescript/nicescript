//TODO: change all actions to use insertAt|removeAt
nice.Obj.extend({
  name: 'Arr',
//  customCall: (...vs) => {
//    if(vs.length === 0){
//      return 'TODO';
//    } else if (vs.length === 1){
//      this.push(vs[0]);
//    } else {
//      vs.forEach( v => this.push(v));
//    }
//  },
  itemArgs1: (z, v) => z.push(v),
  itemArgsN: (z, vs) => vs.forEach( v => z.push(v)),
  killValue (z) {
    _each(z._order, (v, k) => z.get(k).toNotFound());
    nice._db.update (z._id, '_order', null);
    this.super.killValue(z);
  },

  proto: {
  //  _compareItems: (a1, a2, add, del) => {
  //    let i1 = 0, i2 = 0, ii2, n;
  //    const l1 = a1.length, l2 = a2.length;
  //    for(;i1 < l1; i1++){
  //      if(a1[i1] === a2[i2]){
  //        i2++;
  //      } else {
  //        for(n = i2, ii2 = undefined; n < l2; n++){
  //          if(a2[n] === a1[i1]){
  //            ii2 = n;
  //            break;
  //          }
  //        }
  //        if(ii2 === undefined){
  //          del(a1[i1], i2);
  //        } else {
  //          while(i2 < ii2) add(a2[i2], i2++);
  //          i2++;
  //        }
  //      }
  //    }
  //    while(i2 < l2) add(a2[i2], i2++);
  //  },
    //TODO: remove??
//    pop () {
//      const i = this._items.length - 1;
//      let e;
//      if(i >= 0){
//        e = this._items[i];
//        this.transa
//        this.removeAt(i);
//      }
//      return e;
//    },

//    //TODO: remove??
//    shift () {
//      return this._items.shift();
//    },

    checkKey (i) {
      if(i._isAnything === true)
        i = i();
      if(typeof i !== 'number')
        if(+i != i)
          throw 'Arr only likes number keys.';
      if(i < 0)
        throw 'Arr only likes positive keys.';
      return i;
    },

    _itemsListener (o) {
      const { onRemove, onAdd, onChange } = o;
      return v => {
        const old = v._oldValue;
        if(old === undefined){
          onAdd && v.each(onAdd);
          onChange && v.each((_v, k) => onChange(k, _v));
        } else {
          const l = Math.max(...Object.keys(old || {}), ...Object.keys(v._newValue || {}));
          let i = 0;
          while(i <= l){
            let change = true;
            if (onRemove) {
              i in old && onRemove(old[i], i), change &= true;
            }
            if(onAdd) {
              if(v._newValue && i in v._newValue){
                onAdd(v._newValue[i], i), change &= true;
              }
            }
            if(onChange && change) {
              onChange(v._newValue[i], old[i], i);
            }
            i++;
          }
        }
      };
    }
  }
}).about('Ordered list of elements.')
  .ReadOnly('size', z => z._size)
  .Action(function push(z, ...a) {
    a.forEach(v => z.insertAt(z._order.length, v));
  });

Test("constructor", function(Arr) {
  let a = Arr(1, 5, 8);
  a(9);
  expect(a.get(1)).is(5);
  expect(a.get(3)).is(9);
  expect(a.get(4).isNotFound()).is(true);
});

Test("setter", function(Arr) {
  const a = Arr();

  a(2)(3, 4)(5);
  expect(a.get(1)).is(3);
  expect(a.get(3)).is(5);
});


Test("push", (Arr, push) => {
  const a = Arr(1, 4);
  a.push(2, 1);
  expect(a.jsValue).deepEqual([1, 4, 2, 1]);
});


Test("push links", (Arr, push, Num) => {
  const a = Arr();
  const n = Num(5);
  const n2 = Num(7);
  a.push(n, n2);
  expect(a.jsValue).deepEqual([5,7]);
});


Test("size", (Arr, push, Num) => {
  const a = Arr(2);
  const n = Num(5);
  const n2 = Num(7);
  a.push(3, n2);
  expect(a._size).is(3);
  a.remove(2);
  expect(a._size).is(2);
  a.remove(0);
  expect(a._size).is(1);
});


Test((Arr) => {
  const a = nice.Something()([1,2]);
  expect(a._type).is(Arr);
  expect(a.jsValue).deepEqual([1, 2]);
});

const Arr = nice.Arr;
const F = Func.Arr, M = Mapping.Arr, A = Action.Arr;

A('set', (a, key, value, ...tale) => {
  const k = a.checkKey(key);

  if(value === undefined)
    throw `Can't set ${key} to undefined`;

  const order = a._order;
  if(k > order.length)
    throw `Can't set ${key} array has only ${order.length} elements`;

  if(value === null)
    return a.remove(k);

  const item = a.get(k);
  item(value, ...tale);
  order[k] = item._id;
});


F('each', (a, f) => {
  const o = a._order, db = nice._db;
  for(let i = 0; i < o.length; i++)
    if(nice.isStop(f(db.getValue(o[i], 'cache'), i)))
      break;
  return a;
});

Test("each", (Arr, Spy) => {
  const a = Arr(1, 2);
  const spy = Spy();
  a.each(spy);
  expect(spy).calledTwice();
  expect(spy).calledWith(1, 0);
  expect(spy).calledWith(2, 1);
});


M.Function('reduce', (a, f, res) => {
  _each(a, (v, k) => res = f(res, v, k));
  return res;
});

M.Function('reduceRight', (a, f, res) => {
  a.eachRight((v, k) => res = f(res, v, k));
  return res;
});

//future: copyWithin,entries,findIndex

//mappings: indexOf, join, keys, lastIndexOf, flat,flatMap

//,reverse,  ,sort,'.split(',').forEach(name => {
// F.Array(name, (a, ...bs) => a[name](...bs));
//});
//'splice'.split(',').forEach(name => {
// A(name, (a, ...bs) => a._items[name](...bs));
//});


//function apply(type, names){
//  names.split(',').forEach(name => type
//      .about('Delegates to native Array.prototype.' + name)
//      (name, (z, ...a) => z._items[name](...a)));
//}
//apply(M, 'findIndex,indexOf,keys,lastIndexOf,values,slice');
//apply(F, 'entries,splice,pop,forEach');
//apply(A, 'copyWithin,fill,unshift,shift,sort,reverse');

M.rStr('join', (r, a, s = '') => r(a.jsValue.join(s)));

Test((Arr, join) => {
  const a = Arr(1,2);
  expect(a.join(' ')()).is('1 2');
});



//M.Function('mapAndFilter', (o, f) => nice.with([], a => {
//  for(let i in o){
//    let v = f(o[i], i);
//    v && a.push(v);
//  }
//}));


//M.Array('concat', (a, ...bs) => a._items.concat(...bs));
M('sum', (a, f) => a.reduce(f ? (sum, n) => sum + f(n) : (sum, n) => sum + n, 0));


A('unshift', (z, ...a) => a.reverse().forEach(v => z.insertAt(0, v)));

A('add', (z, ...a) => {
  a.forEach(v => z.includes(v) || z.push(v));
});

Test((add, Arr) => {
  expect(Arr(1,2).add(2).jsValue).deepEqual([1,2]);
  expect(Arr(1,2).add(3).jsValue).deepEqual([1,2,3]);
});


A('pull', (z, item) => {
  const k = is.Value(item)
    ? z.items.indexOf(item)
    : z.findKey(v => item === v());
  (k === -1 || k === undefined) || z.remove(k);
});


A.Number('insertAt', (z, i, v) => {
  i = +i;
  z.each((c, k) => k > i && (c._name = k + 1));
  const item = z.get(i);
  z._order.splice(i, 0, item._id);
  item(v);
});


A('insertAfter', (z, target, v) => {
  z.each((v, k) => v.is(target) && z.insertAt(+k+1, v) && nice.Stop());
});


A('remove', (z, k) => {
  k = +k;
  const db = nice._db, order = z._order;

  if(k >= order.length)
    return;

  z.get(k).toNotFound();
  _each(z._children, (v, _k) => {
    _k > k && db.update(v, '_name', db.getValue(v, '_name') - 1);
  });
  order.splice(k, 1);
});

Test((Arr, remove) => {
  const a = Arr(1,2,3,4);
  expect(a.size).is(4);
  expect(a.get(1)).is(2);
  a.remove(1);
  expect(a.size).is(3);
  expect(a.get(1)).is(3);
});


F('callEach', (z, ...a) => {
  z().forEach( f => f.apply(z, ...a) );
  return z;
});

A.about('Remove all values equal to `v` from `a`.')
  ('removeValue', (z, target) => {
    z.each((v, k) => v.is(target) && z.remove(k));
  });

Test((removeValue, Arr) => {
  expect(removeValue(Arr(1,2,3), 2).jsValue).deepEqual([1,3]);
});

Action.Array.about('Remove all values equal to `v` from `a`.')
  ('removeValue', (a, v) => {
    nice.eachRight(a, (_v, k) => is(_v, v) && a.splice(k,1));
  });

Test(removeValue => {
  expect(removeValue([1,2,3], 2)).deepEqual([1,3]);
});


Func.Array.Function(function eachRight(a, f){
  let i = a.length;
  while (i-- > 0)
    if(nice.isStop(f(a[i], i)))
      break;
  return a;
});


F(function eachRight(a, f){
  const o = a._order, db = nice._db;
  for(let i = o.length - 1; i >= 0; i--)
    if(nice.isStop(f(db.getValue(o[i], 'cache'), i)))
      break;
  return a;
});


Test("eachRight", () => {
  let a = Arr(1, 2);
  let b = [];
  a.eachRight(v => b.push(v()));
  expect(b).deepEqual([2, 1]);
});


A(function fill(z, v, start = 0, end){
  const l = z._size;
  end === undefined && (end = l);
  start < 0 && (start += l);
  end < 0 && (end += l);
  for(let i = start; i < end; i++)
    z.insertAt(i, v);
});


M.Function.rArr('map', (r, a, f) => a.each((v, k) => r.push(f(v, k))));

Test("map", () => {
  expect(Arr(4, 3, 5).map(x => x * 2).jsValue).deepEqual([8,6,10]);
});


Mapping.Array.Function(function map(a, f){
  return a.reduce((z, v, k) => { z.push(f(v, k)); return z; }, []);
});


//M(function rMap(a, f){
//  const res = a._type();
//  a.listen({
//    onAdd: (v, k) => res.insertAt(k, f(v, k)),
//    onRemove: (v, k) => res.removeAt(k)
//  });
//  return res;
//});

M.Function(function filter(a, f){
  return a.reduceTo(Arr(), (res, v, k) => f(v, k, a) && res.push(v));
});


M(function random(a){
  return a.get(Math.random() * a._order.length | 0);
});


//M(function sortBy(a, f){
//  f = nice.mapper(f);
//
//  const res = Arr();
////  const source = a._items;
//  a.map((v, k) => [k, f(v)])
//    .sort((a, b) => +(a[1] > b[1]) || +(a[1] === b[1]) - 1)
//    .forEach(v => res.push(source[v[0]]));
//  return res;
//});


M('sortedIndex', (a, v, f = (a, b) => a - b) => {
  let i = a.size;
  a.each((vv, k) => {
    if(f(v, vv) <= 0){
      i = k;
      return nice.Stop();
    }
  });
  return i;
});


M.Array('intersection', (a, b) => {
  const res = Arr();
  a.each(v => b.includes(v) && res.push(v));
  return res;
});


Mapping.Array.Array('intersection', (a, b) => {
  const res = [];
  a.forEach(v => is.includes(b, v) && res.push(v));
  return res;
});


//M('rFilter', (a, f) => a._type().apply(res => {
//  const mapping = [];
//  a.listen({
//    onAdd: (v, k) => {
//      if(!f(v, k))
//        return;
//
//      let pos;
//      for(let i = 0; i++; i < mapping.length){
//        if(mapping[i] >= i)
//          pos = i;
//      }
//      pos = pos || mapping.length;
//      res.insertAt(pos, v);
//      mapping[pos] = k;
//    },
//    onRemove: (v, k) => {
//      res.removeAt(k);
//      const i = mapping.indexOf(k);
//      expect(i !== -1).isTrue();
//      mapping.splice(i, 1);
//    }
//  });
//}));


M.about('Creates new array with `separator` between elments.')
(function intersperse(a, separator) {
  const res = Arr();
  const last = a.size - 1;
  a.each((v, k) => res.push(v) && (k < last && res.push(separator)));
  return res;
});

M.about('Returns last element of `a`.')
  (function last(a) {
  return a.get(a._size - 1);
});

Test((last, Arr) => {
  expect(Arr(1,2,4).last()()).is(4);
});


//M.Number.about('Returns `n` last elements of `a`.')
//  .test((Arr) => {
//    expect(Arr(1,2,4).last(2)()).deepEqual([2,4]);
//  })
//(function last(a, n) {
//  const res = a._type();
//  res._items = a._items.slice(-n);
//  return res;
//});


M.about('Returns first element of `a`.')
  (function first(a) {
    return a.get(0);
  });

Test((Arr, first) => {
  expect(Arr(1,2,4).first()).is(1);
});


//M.Number.about('Returns `n` first elements of `a`.')
//  .test((Arr) => {
//    expect(Arr(1,2,4).first(2)()).deepEqual([1,2]);
//  })
//(function first(a, n) {
//  const res = a._type();
//  res._items = a._items.slice(0, n);
//  return res;
//});


typeof Symbol === 'function' && F(Symbol.iterator, z => {
  let i = 0;
  const l = z._size;
  return { next: () => ({ value: z.get(i), done: ++i > l }) };
});