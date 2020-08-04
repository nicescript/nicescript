class Box{
  constructor(s){
    this.state = s;
  }

  setState(s){
   this.state = s;
   this.emit('state', s);
  }
}

def(Box.prototype, 'isBox', true);

nice.eventEmitter(Box.prototype);

def(nice, 'Box', s => new Box(s));


Test((Box, Spy) => {
  const b = Box(11);
  expect(b.state).is(11);

  const spy = Spy();
  b.on('state', spy);
  b.on('state', console.log);
  b.setState(22);
  expect(spy).calledWith(22);
});