nice.define(nice, 'BooleanPrototype', {
  _typeTitle: 'Boolean',
  _set: n => !!n,
  _default: () => false,

  on: function () { return this(true); },
  off: function () { return this(false); },
  switch: function () { return this(!this()); },

  and: function (v) { return nice.Boolean().by(z => z(this() && v)); },
  or: function (v) { return nice.Boolean().by(z => z(this() || v)); },
  xor: function (v) { return nice.Boolean().by(z => z(this() ^ !!v)); }
});

nice.Type(nice.BooleanPrototype);
