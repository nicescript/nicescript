nice.Type({
  name: 'Single',

  defaultValue: () => undefined,

//  creator: () => {
//    const f = (...a) => {
//      if(a.length === 0)
//        return f.getResult();
//
//      f.setValue(...a);
//      return f._parent || f;
//    };
//    return f;
//  },

  extends: nice.Value,

  proto: {
    setValue: function(...a) {
      const { set } = this._type;
      this.setResult(set ? set(...a) : a[0]);
      return this._parent || this;
    },
    setByType: null,
    remove: null,
    removeAll: null,
  }
}).about('Parent type for all non composite types.');


nice._on('Type', type => {
  def(nice.Single.configProto, type.name, () => {
    throw "Can't add properties to SingleValue types";
  });
});
