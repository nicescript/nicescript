nice.Type({
  name: 'Single',

  extends: nice.Value,

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

//TODO:0 test cast errors

Test((Single, Num) => {
  const x = Single();
  expect(x).isSingle();
  expect(x._cellType).is(Single);
  x(2);
  expect(x).isNum();
  expect(x._cellType).is(Single);
  x('qwe');
  expect(x).isStr();
  expect(x._cellType).is(Single);
});
