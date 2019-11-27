nice.Type({
  name: 'Reference',
  extends: 'Anything',
  itemArgs0: z => z._ref(),
  //TODO:0 remove _ref if type or value changes
  initBy: (z, v) => {
    nice._db.update(z._id, '_value', v);
  },
  proto: new Proxy({}, {
    get (o, k, receiver) {
      if(k === '_cellType' || k === '_status' || k === '_by')
        return nice._db.getValue(receiver._id, k);
      if(k === '_isRef')
        return true;
      if(!('_ref' in receiver))
        def(receiver, '_ref', nice._db.getValue(receiver._id, '_value'));
      return receiver._ref[k];
    }
  })
});


Test('Reference of subtype', (Reference, Single, Num) => {
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


Test('Reference of the same type', (Num, Spy) => {
  const spy = Spy();
  const a = Num(1);
  const b = Num(2);
  a.listen(spy);

  a(b);
//  expect(a).is(2);
//  b(3);
//  expect(spy).calledWith(3);
//  expect(a).is(3);
});


Test('Reference type error', (Reference, Obj, Num) => {
  const a = Obj();
  const b = Single(2);
  b(a);
  expect(b).isError();
//  expect(b._type).is(Num);
//  expect(b._cellType).is(Single);
//  b(3);
//  expect(b()).is(3);
//  expect(a()).is(5);
//  expect(b).isNum();
});


Test('Unfollow Reference', (Reference, Single, Num) => {
  const a = Num(5);
  const b = Single(2);
  const c = Num(3);
  b(a);
  expect(b()).is(5);

  b(c);
  expect(b()).is(3);
  a(7);
  expect(b()).is(3);
  c(4);
  expect(b()).is(3);
});
