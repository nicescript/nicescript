//TODO: spy should extend function

nice.Type({
  name: 'Spy',
  extends: 'Anything',
  defaultValueBy: () => [],
  customCall: call
//  itemArgs0: call,
//  itemArgs1: call,
//  itemArgsN: (z, as) => call(z, ...as),
//  initBy: (z, f) => {
//    z._status = 'hot';
//  }
});

function call(spy, ...a){
  spy._logCalls && console.log('Spy called with:', ...a);
  spy._value.push(a);
};

Action.Spy('logCalls', z => z._logCalls = true);

Check.Spy('called', s => s._value.length > 0);

Test((Spy, called) => {
  const spy = Spy();
  expect(spy.called()).is(false);
  spy();
  expect(spy.called()).is(true);
});


Test(function listen(Num, Spy){
  const n = Num();
  const spy = Spy();
  n.listen(spy);
  expect(spy).calledWith(0);
});

Check.Spy('calledOnce', s => s._value.length === 1);

Test((Spy, calledOnce) => {
  const spy = Spy();
  expect(spy.calledOnce()).is(false);
  spy();
  expect(spy.calledOnce()).is(true);
  spy();
  expect(spy.calledOnce()).is(false);
});


Check.Spy('calledTwice', s => s._value.length === 2);

Test((Spy, calledTwice) => {
  const spy = Spy();
  expect(spy.calledTwice()).is(false);
  spy();
  spy();
  expect(spy.calledTwice()).is(true);
  spy();
  expect(spy.calledTwice()).is(false);
});


Check.Spy('calledTimes', (s, n) => s._value.length === n);

Test((Spy, calledTimes) => {
  const spy = Spy();
  expect(spy.calledTimes(0)).is(true);
  spy();
  expect(spy.calledTimes(1)).is(true);
  spy();
  expect(spy.calledTimes(2)).is(true);
  expect(spy.calledTimes(3)).is(false);
});


//TODO: write actual arguments in error
Check.Spy('calledWith', (s, ...as) => s._value.some(a => {
  return as.every((v, k) => nice.is(a[k], v));
}));

Test((Spy, calledWith) => {
  const spy = Spy();
  expect(spy.calledWith(1)).is(false);
  spy(1);
  expect(spy.calledWith(1)).is(true);

  expect(spy.calledWith(1, 2)).is(false);
  spy(1, 2);
  expect(spy.calledWith(1, 2)).is(true);
});
