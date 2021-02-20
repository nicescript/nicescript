nice.Type({
  name: 'Single',

  extends: nice.Value,

  isFunction: true,

  proto: {
    [Symbol.toPrimitive]() {
      return this.valueOf();
    }
  }
}).about('Parent type for all single value types.');


reflect.on('type', type => {
  def(nice.Single.configProto, type.name, () => {
    throw new Error("Can't add properties to SingleValue types");
  });
});
