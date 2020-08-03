Test('kill child', (Obj) => {
  const o = Obj({q:1});
  expect(o.get('q')).is(1);
  o({});
  expect(o.get('q')).isNotFound();

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
  expect(x).isFunction();
  expect(x).not.isErr();
  expect(x()).is(1);
});


Test('isFunction', (Func) => {
  const x = nice(1);
  expect(x).not.isFunction();
});

