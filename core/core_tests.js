Test((genereteAutoId) => {
  expect(genereteAutoId()).isString();
  expect(genereteAutoId()).not.is(genereteAutoId());
});


Test("named type", (Type) => {
  Type('Cat').str('name');

  const cat = nice.Cat().name('Ball');
  expect(cat._type.name).is('Cat');
  expect(cat.name()).is('Ball');
});


Test("primitive property", (Type) => {
  Type('Cat2').string('name', 'a cat');

  const cat = nice.Cat2();

  expect(cat.name).is('a cat');
  cat.name = 'Ball';
  expect(cat.name === 'Ball').is(true);
});


Test("primitive type check", (Type) => {
  Type('Cat3').string('name');

  const cat = nice.Cat2();

  expect(() => cat.name(2)).throws();

  cat.name = 2;
  expect(cat.name).is('2');

  cat.name = ['Cat #%d', 2];
  expect(cat.name).is('Cat #2');
});


Test("js object property", (Type) => {
  Type('Cat41').object('friends');

  const cat = nice.Cat41();
  expect(cat.friends).deepEqual({});
  cat.friends['Ball'] = 1;
  expect(cat.friends.Ball).is(1);
  expect(() => cat.friends = 2).throws();
});


Test("js array property", (Type) => {
  Type('Cat4').array('friends');

  const cat = nice.Cat4();
  expect(cat.friends).deepEqual([]);
  cat.friends.push('Ball');
  expect(cat.friends).deepEqual(['Ball']);
  expect(() => cat.friends = 2).throws();
});


Test('isFunction', (isFunction) => {
  const x = nice(1);
  expect(x).not.isFunction();
  expect(() => 1).isFunction();
});


Test('isError', (isError) => {
  const x = new Error('qwe');
  expect(x).isError();
  const x2 = new SyntaxError('qwe');
  expect(x2).isError();
  expect(x2).isSyntaxError();
});


Test((times) => {
  const x = times(2, (n, a) => n, []);
  expect(x).deepEqual([0,1]);
});


Test((Pipe) => {
  const x2 = a => a * 2;
  const plusOne = a => a + 1;
  const plus = (a, b) => a + b;
  const f = Pipe('count', plusOne, x2, Math.cbrt, [plus, 3]);

  expect(f({count: 3})).is(5);
});

