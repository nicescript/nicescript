nice.Type({
  name: 'IntervalBox',

  extends: 'Box',

  initBy: (z, ms, f) => {
    if(typeof ms !== 'number')
      throw `1st argument must be number`;
    if(typeof f !== 'function')
      throw `2nd argument must be functions`;
    let interval = null;
    z.warmUp = () => {
      interval = setInterval(() => z(f(z())), ms);
      z._value === undefined && z.setState(f());
    };
    z.coolDown = () => {
      if(interval !== null){
        clearInterval(interval);
        interval = null;
      }
    };
  },
});

Action.Box('changeAfter', (z, ms, f) => setTimeout(() => z(f(z())), ms));


Test((IntervalBox, RBox, Spy) => {
  const n = IntervalBox(450, (old = 0) => old + 1);
  const x2 = RBox(n, n => n * 2);
  const spy = Spy();

  Test(() => {
    expect(n._value).is(undefined);
    expect(spy).calledTimes(0);
    x2.subscribe(spy);
    expect(n._value).is(1);
    expect(spy).calledTimes(1);
  });

  Test(() => {
    x2.unsubscribe(spy);
    expect(n._isHot).is(false);
    expect(spy).calledTimes(1);
  });
});
