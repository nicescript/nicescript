nice.Type({
  name: 'Box',

  extends: 'DataSource',

  customCall: (z, ...as) => {
    if(as.length === 0) {
      z.coldCompute && !z._isHot && z.coldCompute();
      return z._value;
    } else {
      return z.setState(as[0]);
    }
  },

  initBy: (z, v) => {
    z._version = 0;
    if(v === undefined){
      return z;
    }
    z.setState(v);
  },

  proto: {
    setState (v) {
//      if(this._value !== v){
//        this._version++;
//        this._value = v;
//        this.notify(v);
//      }
      this._value !== v && this._version++;
      this._value = v;
      this.notify(v);
    },

    notify(v){
      if(this.subscribers)
        for (const f of this.subscribers) {
          f.notify
            ? f.notify(v)
            : f(v);
//            : Function.prototype.call.call(f, this, v);
        }
    },

    uniq(){
      this.setState = function(v){
        v === this._value || this.__proto__.setState.call(this, v);
      };
      return this;
    },

    deepUniq(){
      this.setState = function(v){
        nice.diff(v, this._value) === false || this.__proto__.setState.call(this, v);
      }
      return this;
    },

    assertId(){
      if(!this._id)
        this._id = nice.genereteAutoId();
      return this._id;
    }
  }
});

const Box = nice.Box;

Action.Box('assign', (z, o) => z({...z(), ...o}));

Test((Box, Spy) => {
  const b = Box();
  const spy = Spy();
  b.subscribe(spy);

  b(1);
  b(1);
  b(2);

//  expect(spy).calledWith(undefined);
  expect(spy).calledWith(1);
  expect(spy).calledWith(2);
  //TODO: expect(spy).calledTimes(4);
});


Test((Box) => {
  const b = Box();
  let version = b.version;

  b(1);
  expect(b.version).gt(version);
  version = b.version;

  b(1);
  expect(b.version).is(version);

  b(2);
  expect(b.version).gt(version);
});


Test((Box, Spy) => {
  const b = Box();
  const spy = Spy();
  b.subscribe(spy, -1);

  b(1);
  b(1);
  b(2);

  expect(spy).calledWith(1);
  expect(spy).calledWith(2);
  expect(spy).calledTimes(3);
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
//TODO:  expect(spy).calledTimes(3);
});


Test((Box, Spy, deepUniq) => {
  const b = Box({qwe:1, asd:2}).deepUniq();
  const spy = Spy();
  b.subscribe(spy);

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


Action.Box('removeValue', (z, v) => {
  z(z().filter(r => r !== v));
});


// does not work because actions coerse to niceValues
//nice.reflect.on('signature', ({type, name, signature}) => {
//  if(type !== 'Action')
//    return;
//  const first = signature[0];
//  if(name && (!first || first.type !== nice.Box) && (!(name in nice.Box.proto))){
//    nice.Box.proto[name] = function(...as){
//      this(nice[name](this._value, ...as));
//      return this;
//    }
//  };
//});

Action.Box('add', (z, n = 1) => z(z() + n));

Test('Box action', (Box, Spy) => {
  const b = Box(2);
  b.add(3);
  expect(b()).is(5);
});

Test((Box, Spy) => {
  const b = Box(1);
  const spy1 = Spy();
  const spy2 = Spy();
  b.subscribe({ 1: spy1, 2: spy2 });
  expect(spy1).calledWith();
});


