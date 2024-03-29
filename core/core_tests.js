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

  expect(cat.name()).is('a cat');
  cat.name('Ball');
  expect(cat.name()).is('Ball');
});


Test("primitive type check", (Type) => {
  Type('Cat3').string('name');

  const cat = nice.Cat2();

//  expect(() => cat.name(2)).throws();

  cat.name(2);
  expect(cat.name()).is('2');

//  cat.name('Cat #%d', 2);
//  expect(cat.name()).is('Cat #2');
});


Test("js object property", (Type) => {
  Type('Cat41').object('friends');

  const cat = nice.Cat41();
  expect(cat.friends()).deepEqual({});
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


Test((sortedPosition) => {
  const a = [1,2,3,4,5,6];
  expect(sortedPosition(a, 0)).is(0);
  expect(sortedPosition(a, 2.5)).is(2);
  expect(sortedPosition(a, 10)).is(6);
});


Test((orderedStringify) => {
  const o1 = {qwe:1,asd:2};
  const o2 = {asd:2,qwe:1};
  const s1 = orderedStringify(o1);
  const s2 = orderedStringify(o2);
  expect(s1).is('{"asd":2,"qwe":1}');
  expect(s1).is(s2);
});




