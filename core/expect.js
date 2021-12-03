def(nice, 'expectPrototype', {});

const toString = v => {
  if(v === undefined) return "undefined";

  const s = (v && v.toString) ? v.toString() : JSON.stringify(v);

  return typeof s === 'string' ? s : '' + s;
}


reflect.on('Check', ({name}) => {
//  name && def(nice.expectPrototype, name, function(...a){
  name && (nice.expectPrototype[name] = function(...a){
    const res = this._preF ? this._preF(nice[name](this.value, ...a)) : nice[name](this.value, ...a);
    if(!res || (res && res._isAnything && res._type === nice.Err)){
      const e = new Error(this.text || ['Expected (', toString(this.value), ')',
        this._preMessage || '', 'to be (',
        name, ...a.map(toString), ')'].join(' '));
      e.shift = 1;
      throw e;
    }
    delete this._preF;
    delete this._preMessage;
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
  this._preF = v => !v;
  this._preMessage = 'not';
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

