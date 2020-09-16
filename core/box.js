let autoId = 0;
const AUTO_PREFIX = '_nn_';


nice.Type({
  name: 'Box',

  extends: 'Something',

  customCall: (z, ...as) => {
    return as.length === 0 ? z._value : z.setState(as[0]);
  },

  proto: {
    setState (v){
      if(v === this._value)
        return;
      this._value = v;
      this.emit('state', v);
    },

    subscribe(f){
      this.on('state', f);
      if(this._value !== undefined)
        f(this._value);
    },

    unsubscribe(f){
      this.off('state', f);
    },

    assertId(){
      if(!this._id)
        this._id = nice.autoId();
      return this._id;
    }
  }
});


Action.Box('assign', (z, o) => z({...z(), ...o}));

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



nice.reflect.on('Action', f => {
  const name = f.name;
  name && (!(name in nice.Box.proto)) && (
    nice.Box.proto[name] = function(...as){
      this(nice[name](this._value, ...as));
      return this;
    }
  );
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


