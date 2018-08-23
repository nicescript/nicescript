nice.Obj.extend({
  name: 'Arr',
  onCreate: z => z._items = [],
  itemArgs0: z => z._items,
  itemArgs1: (z, v) => z.set(z._items.length, v),
  itemArgsN: (z, vs) => vs.forEach( v => z.set(z._items.length, v)),
//  defaultValue: () => [],
//  initBy: (z, ...a) => z.push(...a),
  proto: {
//    itemArgs: undefined,
//    setValue: function (...a){
//      return this.push(...a);
//    },

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
    pop: function () {
      return nice.toItem(this._getResult().pop());
    },

    shift: function () {
      return nice.toItem(this._getResult().shift());
    },
  }
}).about('Ordered list of elements.')
  .ReadOnly(function size() {
    return this._getResult().length;
  })
  .Action(function push(z, ...a) {
    a.forEach(v => z.set(z._getResult().length, v));
  });


const Arr = nice.Arr;
const F = Func.Arr, M = Mapping.Arr, A = Action.Arr;
const f = Func.Array, m = Mapping.Array, a = Action.Array;

M.function('reduce', (a, f, res) => {
  each(a, (v, k) => res = f(res, v, k));
  return res;
});

M.function('reduceRight', (a, f, res) => {
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
////F.function('each', (a, f) => a.forEach(f));
//f.function('each', (a, f) => {
//  const l = a.length;
//  for (let i = 0; i < l; i++)
//    if(is.Stop(f(a[i], i)))
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
//M.function('mapAndFilter', (o, f) => nice.with([], a => {
//  for(let i in o){
//    let v = f(o[i], i);
//    v && a.push(v);
//  }
//}));
//
//
M.Array('concat', (a, ...bs) => a._result.concat(...bs));
M('sum', (a, f) => a.reduce(f ? (sum, n) => sum + f(n) : (sum, n) => sum + n, 0));


A('unshift', (z, ...a) => a.reverse().forEach(v => z.insertAt(0, v)));

A('add', (z, ...a) => {
  const toAdd = Array.isArray(a[0]) ? a[0] : a;
  const data = z._getResult();
  toAdd.forEach(v => data.includes(v) || z.push(v));
});

A('pull', (z, item) => {
  const k = is.Value(item)
    ? z._getResult().indexOf(item)
    : z.findKey(v => item === v());
  (k === -1 || k === undefined) || z.removeAt(k);
});

A('insertAt', (z, i, v) => {
  z._getResult().splice(i, 0, null);
  z.set(i, v);
});

A('removeAt', (z, i) => z._getResult().splice(i, 1));

F('callEach', (z, ...a) => {
  z().forEach( f => f.apply(z, ...a) );
  return z;
});

//findIndex

//'includes,copyWithin,entries,every,indexOf,join,keys,lastIndexOf,reverse,slice,some,sort,'.split(',').forEach(name => {
// F.Array(name, (a, ...bs) => a[name](...bs));
//});
'splice'.split(',').forEach(name => {
 A(name, (a, ...bs) => a._getResult()[name](...bs));
});


function each(z, f){
  const a = z._getResult();
  const l = a.length;
  for (let i = 0; i < l; i++)
    if(is.Stop(f(z.get(i), i)))
      break;

  return z;
}

F.function(each);
F.function('forEach', each);

F.function(function eachRight(z, f){
  const a = z._getResult();
  let i = a.length;
  while (i-- > 0)
    if(is.Stop(f(z.get(i), i)))
      break;

  return z;
});


A(function fill(z, v, start = 0, end){
  const l = z._getResult().length;
  end === undefined && (end = l);
  start < 0 && (start += l);
  end < 0 && (end += l);
  for(let i = start; i < end; i++){
    z.set(i, v);
  }
});


M.function(function map(a, f){
  return a.reduceTo.Arr((z, v, k) => z.push(f(v, k)));
});


M.function(function filter(a, f){
  return a.reduceTo(Arr(), (res, v, k) => f(v, k, a) && res.push(v));
});


M(function random(a){
  return a.get(Math.random() * a.size | 0);
});


M(function sortBy(a, f){
  f = nice.mapper(f);

  const res = Arr();
  const source = a._getResult();
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


M.about('Creates new array with separator between elments.')
(function intersperse(a, separator) {
  const res = Arr();
  const last = a.size - 1;
  a.each((v, k) => res.push(v) && (k < last && res.push(separator)));
  return res;
});


typeof Symbol === 'function' && F(Symbol.iterator, z => {
  let i = 0;
  const l = z._getResult().length;
  return { next: () => ({ value: z.get(i), done: ++i > l }) };
});