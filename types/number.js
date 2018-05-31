nice.Single.extend({
  title: 'Number',

  defaultValue: () => 0,

  set: n => +n,

  saveValue: v => v,

  loadValue: v => v
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
}, (f, name) => Check.number(name, f));

const M = Mapping.number;

_each({
  sum: (a, b) => a + b,
  difference: (a, b) => a - b,
  product: (a, b) => a * b,
  fraction: (a, b) => a / b,
  reminder: (a, b) => a % b
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


const A = Action.Number;
A('inc', (z, n = 1) => z(z() + n));
A('dec', (z, n = 1) => z(z() - n));
A('divide', (z, n) => z(z() / n));
A('multiply', (z, n) => z(z() * n));
A('negate', z => z(-z()));
A('setMax', (z, n) => { n > z() && z(n); return z._parent || z; });
A('setMin', (z, n) => { n < z() && z(n); return z._parent || z; });
