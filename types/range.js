//TODO: consumable Range: sequence or consumer(Range/iterable)??
//TODO: lookup js/other iterable -> move map/filter to iterable

nice.Type('Range')
  .about('Represent range of numbers.')
  .by((z, start, end, step = 1) => {
    expect(start).isNumber();
    expect(end).isNumber();
    expect(step).isNumber();
    z._value = { start, end, step };
  })
  .Method(function each(z, f) {
    const { start, end, step } =  z._value;
    let i = start;
    while(i <= end) {
      f(i);
      i += step;
    }
  })
  .Mapping(function map(z, f) {
    const { start, end, step } =  z._value;
    let i = start, n = 0;
    const a = nice.Arr();
    while(i <= end){
      a.push(f(i, n++));
      i += step;
    }
    return a;
  })
  .Mapping(function filter(z, f) {
    const a = nice.Arr();
    z.each(v => f(v) && a.push(v));
    return a;
  })
  .Mapping(function toArray(z) {
    const a = [];
    z.each(v => a.push(v));
    return a;
  })
  .Check(function includes(z, n) {
    const { start, end } =  z._value;
    return n >= start && n <= end;
  });


Func.Number.Range(function within(v, r) {
  const { start, end } =  r._value;
  return v >= start && v <= end;
});


Test((Range, each, Spy) => {
  const spy = Spy();
  Range(1,3).each(spy);
  expect(spy).calledTimes(3);
  expect(spy).calledWith(1);
  expect(spy).calledWith(2);
  expect(spy).calledWith(3);
});


Test('Test Range with step', (Range, each, Spy) => {
  const spy = Spy();
  Range(1, 3, 2).each(spy);
  expect(spy).calledTimes(2);
  expect(spy).calledWith(1);
  expect(spy).calledWith(3);
});


Test((Range, includes) => {
  const r = Range(1, 6);

  expect(r.includes(5)).is(true);
  expect(r.includes(15)).is(false);
});


Test((Range, within, Num) => {
  const r = Range(1, 5);
  expect(within(5, r)).is(true);
  expect(within(15, r)).is(false);
});


Test((Range, map) => {
  const r = Range(2, 4);
  expect(r.map(x => x * 2).jsValue).deepEqual([4, 6, 8]);
});


Test((Range, filter) => {
  const r = Range(2, 7);
  expect(r.filter(x => x % 2).jsValue).deepEqual([3, 5, 7]);
});


Test((Range, toArray) => {
  const r = Range(2, 7);
  expect(r.toArray()).deepEqual([2, 3, 4, 5, 6, 7]);
});
