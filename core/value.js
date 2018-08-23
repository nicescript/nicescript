nice.Type({
  name: 'Value',

  extends: 'Something',

  default: () => undefined,

  isSubType,

  creator: () => { throw 'Use Single or Object.' },

//  constructor: (z, ...a) => a.length && z.setValue(...a),

  proto: create(nice.Anything.proto, {
    _isSingleton: false,

    valueOf: function (){ return this._value; }
  }),

  configProto: {


    by: function(f){
      this.target.initBy = f;
      return this;
    },

    assign: function (...o) {
      Object.assign(this.target.proto, ...o);
      return this;
    },

    addProperty: function (name, cfg){
      Object.defineProperty(this.target.proto, name, cfg);
      return this;
    },

    Const: function(name, value){
      def(this.target, name, value);
      def(this.target.proto, name, value);
      return this;
    },

    ReadOnly: function(...a){
      const [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
      expect(f).function();
      defGet(this.target.proto, name, f);
      return this;
    }
  },
}).about('Parent type for all values.');


defGet(nice.Value.configProto, 'Method', function () {
  const type = this.target;
  return Func.next({ returnValue: this, signature: [{type}] });
});


['Action', 'Mapping', 'Check'].forEach(t =>
  defGet(nice.Value.configProto, t, function () {
    const type = this.target;
    return nice[t].next({ returnValue: this, signature: [{type}] });
  })
);



function isSubType(t){
  is.String(t) && (t = nice.Type(t));
  return t === this || t.isPrototypeOf(this);
};
nice.jsTypes.isSubType = isSubType;
