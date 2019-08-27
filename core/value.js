nice.Type({
  name: 'Value',

  extends: 'Something',

  default: () => undefined,

  isSubType,

  creator: () => { throw 'Use Single or Object.' },

  proto: create(Anything.proto, {
    valueOf (){ return this._value; }
  }),

  configProto: {

    by(...a){
      if(typeof a[0] === 'function')
        this.target.initBy = a[0];
      else if(typeof a[0] === 'string')
        this.target.initBy = (z, ...vs) => {
          a.forEach((name, i) => z.set(name, vs[i]));
        }
      return this;
    },

    assign (...o) {
      Object.assign(this.target.proto, ...o);
      return this;
    },

    addProperty (name, cfg){
      Object.defineProperty(this.target.proto, name, cfg);
      return this;
    },

    Const (name, value){
      def(this.target, name, value);
      def(this.target.proto, name, value);
      return this;
    },
  },
}).about('Parent type for all values.');


defGet(nice.Value.configProto, function Method() {
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
  typeof t === 'string' && (t = nice.Type(t));
  return t === this || t.isPrototypeOf(this);
};
nice.jsTypes.isSubType = isSubType;
