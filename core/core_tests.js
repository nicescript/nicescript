Test((autoId) => {
  expect(autoId()).isString();
  expect(autoId()).not.is(autoId());
});


Test("named type", (Type) => {
  Type('Cat').str('name');

  const cat = nice.Cat().name('Ball');
  expect(cat._type.name).is('Cat');
  expect(cat.name()).is('Ball');
});


Test('kill child', (Obj) => {
  const o = Obj({q:1});
  expect(o.get('q')).is(1);
  o({});
  expect(o.get('q')).isNotFound();

});

//TODO: restore and fix
//Test('create function', (Function) => {
//  const x = Function(() => 1);
//  expect(x).not.isErr();
//  expect(x).isFunction();
//  expect(x()).is(1);
//});

//TODO: restore and fix
//Test('storing function', (Func) => {
//  const x = nice();
//  x(() => 1);
//  expect(x).isFunction();
//  expect(x).not.isErr();
//  expect(x()).is(1);
//});


Test('isFunction', (Func) => {
  const x = nice(1);
  expect(x).not.isFunction();
});


Test('isError', (isError) => {
  const x = new Error('qwe');
  expect(x).isError();
  const x2 = new SyntaxError('qwe');
  expect(x2).isError();
  expect(x2).isSyntaxError();
});

