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
      if(k === '_cellType')
        return nice._db.getValue(receiver._id, '_cellType');
      if(k === '_isRef')
        return true;
      //TODO:
//      if(k === 'transaction')
//        throw 'Link is read only';
      if(!('_ref' in receiver))
        def(receiver, '_ref', nice._db.getValue(receiver._id, '_value'));
      return receiver._ref[k];
    }
  })
});


Test((Reference, Single, Num) => {
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