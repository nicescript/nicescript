def(nice, 'expectPrototype', {});


function isFail (v) {
  return !v || (v && v._isAnything && v._type === nice.Err);
};


function composeCallName(name, a) {
  return name + '(' + a.map(showValue).join(', ') + ')';
};


function showValue(v) {
  if(v === undefined)
    return "undefined:undefined";

  if(v === null)
    return "null:null";

  const type = typeof v;

  let s = '' + (v && v.toString) ? v.toString() : JSON.stringify(v);

  if(type === 'string')
    s = '"' + s + '"';

  if(type === 'object'){
    s += ':' + (v._type ? 'nice:' + v._type.name : 'object:' + v.constructor.name);
  } else {
    s += ':' + type
  }

  return s;
};


reflect.on('Check', ({name}) => {
  name && (nice.expectPrototype[name] = function(...a){
    const res = this._preF ? this._preF(nice[name](this.value, ...a)) : nice[name](this.value, ...a);
    if(isFail(res)){
      const s = this.text ||
          `Expected (${showValue(this.value)}) ${this._preMessage|| ''}${composeCallName(name, a)}`;
      const e = new Error(s);
      e.shift = ('' + s).split('\n').length;
      throw e;
    }
    if(this._postCall !== undefined){
      this._postCall(this, name, a);
    }
    return this;
  });
});


def(nice, function expect(value, ...texts){
  return create(nice.expectPrototype, { value, texts, item: this});
});

defGet(nice.expectPrototype, function text(){
  return nice.format(...this.texts);
});

defGet(nice.expectPrototype, function not(){
  this._preF = v => isFail(v);
  this._preMessage = 'not';
  this._postCall = z => {
    delete z._preF;
    delete z._preMessage;
    delete z._postCall;
  }
  return this;
});


defGet(nice.expectPrototype, function either(){
  this._either = this._either || [];
  this._preF = res => { this._either.push(res); return true };
  this._postCall = (z, name, a) => {
    this._preMessage = this._preMessage || '';
    this._preMessage += composeCallName(name, a) + ' or ';
  };

  return this;
});


defGet(nice.expectPrototype, function or(){
  this._either = this._either || [];
  this._preF = res => {
    var b = this._either.some(v => !isFail(v)) || !isFail(res);

    return b;
  };
  delete this._postCall;
  return this;
});


def(nice.expectPrototype, function message(...a){
  this.texts = a;
  return this;
});

expect = nice.expect;

Test('Not expect followed by expect.', () => {
  expect(1).not.is(3).is(1);
  expect(1).is(1).not.is(3);
});


Test('either or', () => {
  expect(1).either.is(2).is(4).or.is(nice.Div());
  expect(1).either.is(1).is(2).or.is(nice.Div());
  expect(1).either.is(5).is(2).or.is(1);
  expect('qwe').either.isNumber(2).or.isString();
  expect(1).either.is(2).or.not.is(5);

  expect(() => {
    expect(4).either.is(2).is(1).or.is(5);
  }).throws();

  expect(() => {
    expect(1).either.is(2).or.not.is(1);
  }).throws();
});

