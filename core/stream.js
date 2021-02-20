let autoId = 0;
const AUTO_PREFIX = '_nn_';


nice.Type({
  name: 'Stream',

  extends: 'Something',

  initBy: (z, cfg) => {
    z.messages = [];
  },

  customCall: (z) => {
    throw 'Use methods';
  },

  proto: {
    push (m){
      this.messages.push(m);
      this.emit('message', m);
    },

    subscribe(f){
      this.messages.forEach(m => f(m));
      this.on('message', f);
    },

    unsubscribe(f){
      this.off('message', f);
      if(!this.countListeners('message')){
        this.emit('noMoreSubscribers', this);
      }
    },

    assertId(){
      if(!this._id)
        this._id = nice.autoId();
      return this._id;
    },

    map(f){
      const res = nice.Stream();
      this.subscribe(m => res.push(f(m)));
      return res;
    },

    filter(f){
      const res = nice.Stream();
      this.subscribe(m => f(m) && res.push(m));
      return res;
    },

    reduce(...as){
      const box = nice.Box();
      let hasSeed = as.length > 1;
      const f = as[0];
      let value = as[1];

      this.subscribe(m => {
        if(!hasSeed){
          hasSeed = true;
          value = m;
        } else {
          value = f(value, m);
          box(value);
        }
      });

      return box;
    },

    collect(accumulator, f){
      const box = nice.Box();

      this.subscribe(m => {
        f(accumulator, m);
        box(accumulator);
      });

      return box;
    }
  }
});



Test((Box, assign, Spy) => {
  const a = {name:'Jo', balance:100};
  const b = Box(a);

  b.assign({balance:200});

  expect(b().name).is('Jo');
  expect(b().balance).is(200);
});


Action.Box('push', (z, v) => {
  var a = z().slice();
  a.push(v);
  z(a);
});

Test((Box, push, Spy) => {
  const a = [1];
  const b = Box(a);

  b.push(2);

  expect(b()).deepEqual([1,2]);
  expect(a).deepEqual([1]);
});


nice.eventEmitter(nice.Stream.proto);


Test((Stream, Spy) => {
  const stream = Stream();
  const spy = Spy();

  stream.subscribe(spy);

  stream.push(11);
  stream.push(22);
  expect(spy).calledWith(11);
  expect(spy).calledWith(22);
  expect(spy).calledTwice();
});


Test((Stream, Spy, map) => {
  const stream = Stream();
  const stream2 = stream.map(x => 2 * x);
  const spy = Spy();

  stream2.subscribe(spy);

  stream.push(12);
  stream.push(13);

  expect(spy).calledWith(24);
  expect(spy).calledWith(26);

  expect(spy).calledTwice();
});


Test((Stream, Spy, filter) => {
  const stream = Stream();
  const stream2 = stream.filter(x => x < 10);
  const spy = Spy();

  stream2.subscribe(spy);

  stream.push(7);
  stream.push(13);

  expect(spy).calledWith(7);
  expect(spy).calledOnce();
});


Test((Stream, Spy, reduce) => {
  const stream = Stream();
  const spy = Spy();

  stream.reduce((a,b) => a + b).subscribe(spy);

  stream.push(7);
  stream.push(13);

  expect(spy).calledWith(20);
  expect(spy).calledOnce();
});


Test((Stream, Spy, reduce) => {
  const stream = Stream();
  const spy = Spy();

  stream.reduce((a,b) => a + b, 4).subscribe(spy);

  stream.push(7);
  stream.push(13);

  expect(spy).calledWith(11);
  expect(spy).calledWith(24);
  expect(spy).calledTwice();
});


Test((Stream, Spy, collect) => {
  const stream = Stream();
  const spy = Spy();
  const array = [];

  stream.collect(array, (a, v) => a.push(v)).subscribe(spy);

  stream.push(7);
  stream.push(13);

  expect(spy).calledTwice();
  expect(array).deepEqual([7, 13]);
});