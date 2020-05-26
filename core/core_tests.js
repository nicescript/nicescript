Test('reactive mapping', (Num) => {
  const n = Num(2);
  nice.Mapping('x2', n => n * 2);
  const n2 = n.x2();
  expect(n2).is(4);

  n(3);
  expect(n2).is(6);
});


Test('listenItems', (listenItems, Spy, Obj) => {
  const a = Obj({q:1});
  const spy = Spy();
  a.listenItems(spy);
  expect(spy).calledOnce().calledWith(1, 'q');
  a.set('z', 3);
  expect(spy).calledTimes(2).calledWith(3, 2);
});


Test('notify links children', (listenItems, Spy, Arr) => {
  const a = Arr(1,2);
  const b = nice();
  b(a);
  const spy = Spy();
  b.listenItems(spy);
  expect(spy).calledTwice().calledWith(1, 0).calledWith(2, 1);
  a.push(3);
  expect(spy).calledTimes(3).calledWith(3, 2);
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

