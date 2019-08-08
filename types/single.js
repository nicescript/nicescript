nice.Type({
  name: 'Single',

  extends: nice.Value,

  proto: {}
}).about('Parent type for all single value types.');


reflect.on('type', type => {
  def(nice.Single.configProto, type.name, () => {
    throw "Can't add properties to SingleValue types";
  });
});
