const IS_READY = 1;
const IS_LOADING = 2;
const IS_HOT = 4;


nice.Type({
  name: 'Box',

  extends: 'Something',

  customCall: (z, ...as) => {
    return as.length === 0 ? z._value : z.setState(as[0]);
  },

  initBy: (z, v) => {
    if(v === undefined){
      z._status = 0;
      return z;
    }
    z.setState(v);
  },

  proto: {
    setState (v) {
      this._value = v;
      this._status = v === undefined ? 0 : IS_READY;
      this.emit('state', v);
    },

    uniq(){
      this.setState = function(v){
        v === this._value || this.__proto__.setState.call(this, v);
      }
      return this;
    },

    deepUniq(){
      this.setState = function(v){
        nice.diff(v, this._value) === false || this.__proto__.setState.call(this, v);
      }
      return this;
    },

    subscribe(f){
      this.on('state', f);
      if(this._value !== undefined)
        f(this._value);
    },

    unsubscribe(f){
      this.off('state', f);
      if(!this.countListeners('state')){
        this.emit('noMoreSubscribers', this);
      }
    },

    assertId(){
      if(!this._id)
        this._id = nice.genereteAutoId();
      return this._id;
    }
  }
});

const Box = nice.Box;
Box.IS_READY = IS_READY;
Box.IS_LOADING = IS_LOADING;
Box.IS_HOT = IS_HOT;

const boxTargetProto = {
  
}


Action.Box('assign', (z, o) => z({...z(), ...o}));

Test((Box, Spy) => {
  const b = Box();
  const spy = Spy();
  b.subscribe(spy);

  b(1);
  b(1);
  b(2);

  expect(spy).calledWith(1);
  expect(spy).calledWith(2);
  expect(spy).calledTimes(3);
});


Test('Behaviour with undefined', (Box) => {
  const b = Box();
  //TODO: write test
});


Test((Box, Spy, uniq) => {
  const b = Box().uniq();
  const spy = Spy();
  b.subscribe(spy);

  b(1);
  b(1);
  b(2);

  expect(spy).calledWith(1);
  expect(spy).calledWith(2);
  expect(spy).calledTimes(2);
});


Test((Box, Spy, deepUniq) => {
  const b = Box().deepUniq();
  const spy = Spy();
  b.subscribe(spy);

  b({qwe:1, asd:2});
  b({qwe:1, asd:2});
  b({qwe:1, asd:3});

  expect(spy).calledTimes(2);
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


nice.reflect.on('signature', ({type, name, signature}) => {
  if(type !== 'Action')
    return;
  const first = signature[0];
  if(name && (!first || first.type !== nice.Box) && (!(name in nice.Box.proto))){
    nice.Box.proto[name] = function(...as){
      this(nice[name](this._value, ...as));
      return this;
    }
  };
});

nice.eventEmitter(nice.Box.proto);


Test((Box, Spy) => {
  const b = Box(11);
  expect(b()).is(11);

  const spy = Spy();
  b.on('state', spy);
  b.on('state', console.log);
  b(22);
  expect(spy).calledWith(22);
});


Test('Box action', (Box, Spy) => {
  const b = Box(2);
  b.add(3);
  expect(b()).is(5);
});
