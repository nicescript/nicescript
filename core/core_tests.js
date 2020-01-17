Test('reactive mapping', (Num) => {
  var n = Num(2);
  nice.Mapping('x2', n => n * 2);
  var n2 = n.x2();
  expect(n2).is(4);

  n(3);
  expect(n2).is(6);
});