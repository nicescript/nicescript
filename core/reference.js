const db = nice._db;

/* reference child should:

- pull values by reference

- notify subscribers when reference child changes

- keep own subscription

- on any action throw error

 */


Test('Reference of subtype', (Single, Num) => {
  const a = Num(5);
  const b = Single(2);
  b(a);
  expect(b()).is(5);
  expect(b._type).is(Num);
  expect(b._cellType).is(Single);
  b(3);
  expect(b()).is(3);
  expect(a()).is(5);
  expect(b).isNum();
});


Test('Reference .get', (Obj) => {
  const a = Obj();
  const b = Obj({q:1});
  a(b);
  expect(a.get('q') === b.get('q')).isFalse();
  expect(a.get('z') === b.get('z')).isFalse();
});


Test('Reference jsValue', (Obj) => {
  const a = Obj();
  const b = Obj({q:1});
  a(b);
  expect(a.jsValue).deepEqual({q:1});
});


Test('Reference of the same type', (Num, Spy) => {
  const spy = Spy();
  const a = Num(1);
  const b = Num(2);
  a.listen(spy);

  a(b);
  expect(a).is(2);
  expect(spy).calledTwice();

  b(3);
  expect(spy).calledTimes(3).calledWith(3);
  expect(a).is(3);
});


//TODO:
//Test('Reference type error', (Obj, Num) => {
//  const a = Obj();
//  const b = Num(2);
//  b(a);
//  expect(b).isError();
////  expect(b._type).is(Num);
////  expect(b._cellType).is(Single);
////  b(3);
////  expect(b()).is(3);
////  expect(a()).is(5);
////  expect(b).isNum();
//});


Test('Follow reference', (Single, Num, Spy) => {
  const a = Num(5);
  const b = Single(2);
  const spy = Spy();
  b(a);
  b.listen(spy);
  a(4);
  expect(spy).calledWith(4);
});


Test('Unfollow reference', (Single, Num, Spy) => {
  const a = Num(5);
  const b = Single(2);
  const c = Num(3);
  const spy = Spy();
  b(a).listen(spy);
  b(c);
  expect(b()).is(3);
  a(7);
  expect(b()).is(3);
  c(4);
  expect(b()).is(4);
  expect(spy).calledWith(4);
  expect(spy).not.calledWith(7);
});
