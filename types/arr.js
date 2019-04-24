//TODO: change all actions to use insertAt|removeAt
nice.Obj.extend({
  name: 'Arr',
  onCreate: z => z._items = [],
  itemArgs0: z => z._items,
  itemArgs1: (z, v) => z.set(z._items.length, v),
  itemArgsN: (z, vs) => vs.forEach( v => z.set(z._items.length, v)),
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
    pop () {
      const i = this._items.length - 1;
      let e;
      if(i >= 0){
        e = this._items[i];
        this.removeAt(i);
      }
      return e;
    },

    //TODO: remove??
    shift () {
      return this._items.shift();
    },

    checkKey (i) {
      if(i._isAnything === true)
        i = i();
      if(typeof i !== 'number')
        throw 'Arr only likes number keys.';
      return i;
    },

    _itemsListener (o) {
      const { onRemove, onAdd, onChange } = o;
      return (v, old) => {
        if(old === undefined){
          onAdd && v.each(onAdd);
          onChange && v.each((_v, k) => onChange(k, _v));
        } else {
          const l = Math.max(...Object.keys(old || {}), ...Object.keys(v._newValue || {}));
          let i = 0;
          while(i <= l){
            let change = true;
            if (onRemove) {
              old.hasOwnProperty(i) && onRemove(old[i], i), change &= true;
            }
            if(onAdd) {
              if(v._newValue && v._newValue.hasOwnProperty(i)){
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
  .ReadOnly('size', z => {
    return z._items.length;
  })
  .Action(function push(z, ...a) {
    a.forEach(v => z.insertAt(z._items.length, v));
  });


const Arr = nice.Arr;
const F = Func.Arr, M = Mapping.Arr, A = Action.Arr;

M.Function('reduce', (a, f, res) => {
  each(a, (v, k) => res = f(res, v, k));
  return res;
});

M.Function('reduceRight', (a, f, res) => {
  a.eachRight((v, k) => res = f(res, v, k));
  return res;
});
//findIndex

//checks -> every

//future: copyWithin,entries

//mappings: indexOf, join, keys, lastIndexOf, flat,flatMap,slice

//,reverse,  some,sort,'.split(',').forEach(name => {
// F.Array(name, (a, ...bs) => a[name](...bs));
//});
//'splice'.split(',').forEach(name => {
// A(name, (a, ...bs) => a._items[name](...bs));
//});


//function apply(type, names){
//  names.split(',').forEach(name => type(name, (z, ...a) => z[name](...a)));
//}
//
//apply(M, findIndex,indexOf,join,keys,lastIndexOf,values,slice');
//
//apply(M, 'every,some');
////apply(nice.Check.Array, 'every,some');
//
//apply(F, 'entries,splice,pop,forEach');
//apply(A, 'copyWithin,fill,unshift,shift,sort,reverse');
//
////F.Function('each', (a, f) => a.forEach(f));
//f.Function('each', (a, f) => {
//  const l = a.length;
//  for (let i = 0; i < l; i++)
//    if(nice.isStop(f(a[i], i)))
//      break;
//  return a;
//});
//
//
//A('removeValue', (a, item) => {
//  for(let i = a.length; i--; ){
//    a[i] === item && a.splice(i, 1);
//  }
//  return a;
//});
//
//
//M.Function('mapAndFilter', (o, f) => nice.with([], a => {
//  for(let i in o){
//    let v = f(o[i], i);
//    v && a.push(v);
//  }
//}));
//
//
M.Array('concat', (a, ...bs) => a._items.concat(...bs));
M('sum', (a, f) => a.reduce(f ? (sum, n) => sum + f(n) : (sum, n) => sum + n, 0));


A('unshift', (z, ...a) => a.reverse().forEach(v => z.insertAt(0, v)));

A.test((add, Arr) => {
    expect(Arr(1,2).add(2)()).deepEqual([1,2]);
    expect(Arr(1,2).add(3)()).deepEqual([1,2,3]);
  })
  ('add', (z, ...a) => {
    a.forEach(v => z.includes(v) || z.push(v));
  });

A('pull', (z, item) => {
  const k = is.Value(item)
    ? z.items.indexOf(item)
    : z.findKey(v => item === v());
  (k === -1 || k === undefined) || z.removeAt(k);
});

//TODO: its very slow
A.Number('insertAt', (z, i, v) => {
  i = +i;
  const old = z._items;
  z._oldValue = z._oldValue || {};
  z._newValue = z._newValue || {};
  z._newValue[i] = v;
  z._items = [];
  _each(old, (_v, k) => {
    +k === i && z._items.push(v);
    z._items.push(_v);
  });
  if(old.length <= i)
    return z._items[i] = v;
});


A('insertAfter', (z, target, v) => {
  let i;
  for(i in z._items)
    if(is(target, z._items[i]))
      break;
  return z.insertAt(+i+1, v);
});


A('removeAt', (z, i) => {
  i = +i;
  const old = z._items;
  z._oldValue = z._oldValue || {};
  z._oldValue[i] = old[i];
  z._items = [];
  _each(old, (v, k) => +k === i || z._items.push(v));
});

F('callEach', (z, ...a) => {
  z().forEach( f => f.apply(z, ...a) );
  return z;
});

A.test((removeValue, Arr) => {
    expect(removeValue(Arr(1,2,3), 2).jsValue).deepEqual([1,3]);
  })
  .about('Remove all values equal to `v` from `a`.')('removeValue', (a, v) => {
  for(let i in a._items)
    is(v, a._items[i]) && a.removeAt(i);
});

Action.Array
  .test(removeValue => {
    expect(removeValue([1,2,3], 2)).deepEqual([1,3]);
  })
  .about('Remove all values equal to `v` from `a`.')
  ('removeValue', (a, v) => {
    nice.eachRight(a, (_v, k) => is(_v, v) && a.splice(k,1));
  });


function each(z, f){
  const a = z._items;
  const l = a.length;
  for (let i = 0; i < l; i++)
    if(nice.isStop(f(z._items[i], i)))
      break;

  return z;
}

F.Function(each);
F.Function('forEach', each);

Func.Array.Function(function eachRight(a, f){
  let i = a.length;
  while (i-- > 0)
    if(nice.isStop(f(a[i], i)))
      break;
  return a;
});


A(function fill(z, v, start = 0, end){
  const l = z._items.length;
  end === undefined && (end = l);
  start < 0 && (start += l);
  end < 0 && (end += l);
  for(let i = start; i < end; i++){
    z.set(i, v);
  }
});


M.Function(function map(a, f){
  return a.reduceTo(Arr(), (z, v, k) => z.push(f(v, k)));
});

Mapping.Array.Function(function map(a, f){
  return a.reduce((z, v, k) => { z.push(f(v, k)); return z; }, []);
});


M(function rMap(a, f){
  const res = a._type();
  a.listen({
    onAdd: (v, k) => res.insertAt(k, f(v, k)),
    onRemove: (v, k) => res.removeAt(k)
  });
  return res;
});

M.Function(function filter(a, f){
  return a.reduceTo(Arr(), (res, v, k) => f(v, k, a) && res.push(v));
});


M(function random(a){
  return a._items[Math.random() * a.size | 0];
});


M(function sortBy(a, f){
  f = nice.mapper(f);

  const res = Arr();
  const source = a._items;
  source
    .map((v, k) => [k, f(v)])
    .sort((a, b) => +(a[1] > b[1]) || +(a[1] === b[1]) - 1)
    .forEach(v => res.push(source[v[0]]));
  return res;
});


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


M('rFilter', (a, f) => a._type().apply(res => {
  const mapping = [];
  a.listen({
    onAdd: (v, k) => {
      if(!f(v, k))
        return;

      let pos;
      for(let i = 0; i++; i < mapping.length){
        if(mapping[i] >= i)
          pos = i;
      }
      pos = pos || mapping.length;
      res.insertAt(pos, v);
      mapping[pos] = k;
    },
    onRemove: (v, k) => {
      res.removeAt(k);
      const i = mapping.indexOf(k);
      expect(i !== -1).isTrue();
      mapping.splice(i, 1);
    }
  });
}));


M.about('Creates new array with aboutseparator between elments.')
(function intersperse(a, separator) {
  const res = Arr();
  const last = a.size - 1;
  a.each((v, k) => res.push(v) && (k < last && res.push(separator)));
  return res;
});

M.about('Returns last element of `a`.')
  .test((last, Arr) => {
    expect(Arr(1,2,4).last()).is(4);
  })
(function last(a) {
  return a._items[a._items.length - 1];
});


typeof Symbol === 'function' && F(Symbol.iterator, z => {
  let i = 0;
  const l = z._items.length;
  return { next: () => ({ value: z._items[i], done: ++i > l }) };
});