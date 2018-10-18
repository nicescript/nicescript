nice.Type({
  name: 'Single',

  extends: nice.Value,

  proto: {
  }
}).about('Parent type for all non composite types.');


reflect.on('Type', type => {
  def(nice.Single.configProto, type.name, () => {
    throw "Can't add properties to SingleValue types";
  });
});
