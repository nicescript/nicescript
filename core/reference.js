const db = nice._db;

//nice.Type({
//  name: 'Reference',
//  extends: 'Anything',
////  customCall: function(...as) {
////    return as.length === 0 ? this._ref() : this.setValue(...as);
////  },
//  itemArgs0: z => '#' + z._ref,
//  //TODO:0 remove _ref if type or value changes
//  initBy: (z, v) => {
//    db.update(z._id, '_value', v._id);
//    v._follow(z._id);
//  },
//  proto: {
//    _isRef: true,
//    get _ref() {
//      return db.getValue(this._id, '_value');
//    },
//    get _value(){
//      return db.getValue(this._ref, '_value');
//    },
//    get _type(){
//      return db.getValue(this._ref, '_type');
//    },
//    get _order(){
//      return db.getValue(this._ref, '_order');
//    },
//    get _size(){
//      return db.getValue(this._ref, '_size');
//    },
//  }
////  proto: new Proxy({}, {
////    get (o, k, receiver) {
////      if(k === '_cellType' || k === '_status' || k === '_by')
////        return nice._db.getValue(receiver._id, k);
////      if(k === '_isRef')
////        return true;
////      if(!('_ref' in receiver))
////        defGet(receiver, '_ref', () => nice._db.getValue(receiver._id, '_value'));
////      return receiver._ref[k];
////    }
////  })
//});
//Reference = nice.Reference;


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


Test('Reference().get', (Reference, Obj) => {
  const a = Obj();
  const b = Obj({q:1});
  a(b);
  expect(a.get('q') === b.get('q')).isFalse();
  expect(a.get('z') === b.get('z')).isFalse();
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
//Test('Reference type error', (Reference, Obj, Num) => {
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


Test('Follow Reference', (Reference, Single, Num, Spy) => {
  const a = Num(5);
  const b = Single(2);
  const spy = Spy();
  b(a);
  b.listen(spy);
  a(4);
  expect(spy).calledWith(4);
});


Test('Unfollow Reference', (Reference, Single, Num, Spy) => {
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
