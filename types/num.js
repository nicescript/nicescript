nice.Single.extend({
  name: 'Num',

  itemArgs1: (z, v) => {
    z._type.setValue(z, nice.simpleTypes.number.cast(v));
  },

  defaultValueBy: () => 0,

  help: 'Wrapper for JS number.'
});

Test(Num => {
  const n = Num();
  expect(n).is(0);
  n(3);
  expect(n).is(3);
  expect(() => n('qwe')).throws();
});


Check('between', (n, a, b) => n > a && n < b);

_each({
  integer: n => Number.isInteger(n),
  saveInteger: n => Number.isSaveInteger(n),
  finite: n => Number.isFinite(n),
}, (f, name) => Check.Number(name, f));

_each({
  lt: (n, a) => n < a,
  lte: (n, a) => n <= a,
  gt: (n, a) => n > a,
  gte: (n, a) => n >= a,
}, (f, name) => Check.Number.Number(name, f));

const M = Mapping.Number;

_each({
  sum: (a, ...bs) => bs.reduce((x, y) => x + y, a),
  difference: (a, b) => a - b,
  product: (a, b) => a * b,
  fraction: (a, b) => a / b,
  reminder: (a, b) => a % b,
  next: n => n + 1,
  previous: n => n - 1
}, (f, name) => M(name, f));

//TODO:0  Number->Num & Num-> Number signatures
//Test((sum, Num) => {
//  var a = Num(1);
//  var b = a.sum(2);
//  expect(b).is(3);
//});


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
  M.about('Wrapper for `Math.' + k + '`')(k, (n, ...a) => Math[k](n, ...a)));


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

Test(clamp => {
  expect(clamp(0, 1, 3)).is(1);
  expect(clamp(2, 1, 3)).is(2);
  expect(clamp(10, 1, 3)).is(3);
});

const A = Action.Num;
A('add', (z, n) => z(z() + n));
A('inc', (z, n = 1) => z(z() + n));
A('dec', (z, n = 1) => z(z() - n));
A('divide', (z, n) => z(z() / n));
A('multiply', (z, n) => z(z() * n));
A('negate', z => z(-z()));
A('setMax', (z, n) => n > z() && z(n));
A('setMin', (z, n) => n < z() && z(n));