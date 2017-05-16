nice.NumberPrototype = {
  _typeTitle: 'Number',
  _set: n => + n,
  _default: () => 0,

  sum: function (n) { return nice.Number().by(z => z(this() + n)); },
  diff: function (n) { return nice.Number().by(z => z(this() - n)); },
  product: function (n) { return nice.Number().by(z => z(this() * n)); },
  fraction: function (n) { return nice.Number().by(z => z(this() / n)); },
  reminder: function (n) { return nice.Number().by(z => z(this()  % n)); },

  inc: function (n = 1) { this(this() + n); return this.obj; },
  dec: function (n = 1) { this(this() - n); return this.obj; },
  divide: function (n) { this(this() / n); return this.obj; },
  multiply: function (n) { this(this() * n); return this.obj; },
  negate: function () { this(-this()); return this.obj; },
  setMax: function (n) { n > this() && this(n); return this.obj; },
  setMin: function (n) { n < this() && this(n); return this.obj; }
};

"acos,asin,atan,ceil,clz32,floor,fround,imul,max,min,round,sqrt,trunc,abs,exp,log,atan2,pow,sign,asinh,acosh,atanh,hypot,cbrt,cos,sin,tan,sinh,cosh,tanh,log10,log2,log1p,expm1"
  .split(',').forEach(k => {
    nice.NumberPrototype[k] = function(...a){
      return nice.Number().by(z => z(Math[k](this(), ...a)));
    };
  });


nice.Type(nice.NumberPrototype);
