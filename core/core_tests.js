Test('reactive mapping', (Num) => {
  const n = Num(2);
  nice.Mapping('x2', n => n * 2);
  const n2 = n.x2();
  expect(n2).is(4);

  n(3);
  expect(n2).is(6);
});


Test('kill child', (Obj) => {
  const o = Obj({q:1});
  const q = o.get('q');
  expect(q).is(1);
  o({});
  expect(q).isNotFound();
  expect(o.get('q')).isExactly(q);

});


Test('crete function', (Function) => {
  const x = Function(() => 1);
  expect(x).not.isErr();
  expect(x).isFunction();
  expect(x()).is(1);
});


Test('storing function', (Func) => {
  const x = nice();
  x(() => 1);
  expect(x).not.isErr();
  expect(x).isFunction();
  expect(x()()).is(1);
});

