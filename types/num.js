nice.Single.extend({
  name: 'Num',

  onCreate: z => z._value = 0,
  itemArgs1: (z, n) => {
    const res = +n;
    if(Number.isNaN(res))
      throw `Can't create Num from ${typeof n}`;
    z._setValue(+n);
  },
}).about('Wrapper for JS number.');

_each({
  between: (n, a, b) => n > a && n < b,
  integer: n => Number.isInteger(n),
  saveInteger: n => Number.isSaveInteger(n),
  finite: n => Number.isFinite(n),
  lt: (n, a) => n < a,
  lte: (n, a) => n <= a,
  gt: (n, a) => n > a,
  gte: (n, a) => n >= a,
}, (f, name) => Check.Number(name, f));

const M = Mapping.Number;

_each({
  sum: (a, b) => a + b,
  difference: (a, b) => a - b,
  product: (a, b) => a * b,
  fraction: (a, b) => a / b,
  reminder: (a, b) => a % b,
  next: n => n + 1,
  previous: n => n - 1
}, (f, name) => M(name, f));


`acos
asin
atan
ceil
clz32
floor
fround
imul
max
min
round
sqrt
trunc
abs
exp
log
atan2
pow
sign
asinh
acosh
atanh
hypot
cbrt
cos
sin
tan
sinh
cosh
tanh
log10
log2
log1pexpm1`.split('\n').forEach(k =>
  M.about('Delegates to Math.' + k)(k, (n, ...a) => Math[k](n, ...a)));


M('clamp', (n, min, max) => {
  if(max === undefined){
    max = min;
    min = 0;
  }
  return n < min
    ? min
    : n > max
      ? max
      : n;
});

M.function('times', (n, f) => {
  let i = 0;
  const res = [];
  while(i < n) res.push(f(i++));
  return res;
});


const A = Action.Num;
A('inc', (z, n = 1) => z(z() + n));
A('dec', (z, n = 1) => z(z() - n));
A('divide', (z, n) => z(z() / n));
A('multiply', (z, n) => z(z() * n));
A('negate', z => z(-z()));
A('setMax', (z, n) => n > z() && z(n));
A('setMin', (z, n) => n < z() && z(n));
