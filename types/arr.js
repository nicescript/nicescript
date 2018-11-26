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
    pop () {
      const i = this._items.length - 1;
      let e;
      if(i >= 0){
        e = this._items[i];
        this.removeAt(i);
      }
      return e;
    },

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
      const { onRemove, onAdd } = o;
      return (v, old) => {
        if(old === undefined){
          onAdd && v.each(onAdd);
        } else {
          const l = Math.max(...Object.keys(old || {}), ...Object.keys(v._newValue || {}));
          let i = 0;
          while(i <= l){
            if (onRemove) {
              old[i] !== undefined && onRemove(old[i], i);
            }
            if(onAdd) {
              if(v._newValue && v._newValue.hasOwnProperty(i)){
                onAdd(v._newValue[i], i);
              }
//              else {
//                old.hasOwnProperty(i) && onAdd(v._items[i], i);
//              }
            }
            i++;
          }
//          onRemove && _each(old, (v, k) => {
//            k >= l && onRemove(v, k);
//          });
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

//function apply(type, names){
//  names.split(',').forEach(name => type(name, (z, ...a) => z[name](...a)));
//}
//
//apply(M, findIndex,indexOf,join,keys,lastIndexOf,values,slice');
//
//apply(M, 'every,some,includes');
////apply(nice.Check.Array, 'every,some,includes');
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

A('add', (z, ...a) => {
  a.forEach(v => z.includes(v) || z.push(v));
});

Check.Arr('includes', (a, v) => {
  for(let i of a._items)
    if(nice.equal(i, v))
      return true;
  return false;
});

A('pull', (z, item) => {
  const k = is.Value(item)
    ? z.items.indexOf(item)
    : z.findKey(v => item === v());
  (k === -1 || k === undefined) || z.removeAt(k);
});

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
    if(nice.equal(target, z._items[i]))
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

//findIndex

//'includes,copyWithin,entries,every,indexOf,join,keys,lastIndexOf,reverse,slice,some,sort,'.split(',').forEach(name => {
// F.Array(name, (a, ...bs) => a[name](...bs));
//});
'splice'.split(',').forEach(name => {
 A(name, (a, ...bs) => a._items[name](...bs));
});


function each(z, f){
  const a = z._items;
  const l = a.length;
  for (let i = 0; i < l; i++)
    if(nice.isStop(f(z.get(i), i)))
      break;

  return z;
}

F.Function(each);
F.Function('forEach', each);

F.Function(function eachRight(z, f){
  const a = z._items;
  let i = a.length;
  while (i-- > 0)
    if(nice.isStop(f(z.get(i), i)))
      break;

  return z;
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
  return a.reduceTo.Arr((z, v, k) => z.push(f(v, k)));
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
  return a.get(Math.random() * a.size | 0);
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


M.about('Creates new array with separator between elments.')
(function intersperse(a, separator) {
  const res = Arr();
  const last = a.size - 1;
  a.each((v, k) => res.push(v) && (k < last && res.push(separator)));
  return res;
});


typeof Symbol === 'function' && F(Symbol.iterator, z => {
  let i = 0;
  const l = z._items.length;
  return { next: () => ({ value: z.get(i), done: ++i > l }) };
});