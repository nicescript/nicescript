def(nice, 'expectPrototype', {});

const toString = v => v.toString ? v.toString() : JSON.stringify(v);

reflect.on('Check', f => {
  f.name && def(nice.expectPrototype, f.name, function(...a){
    this.value && this.value._compute && this.value._compute();
    const res = this._preF ? this._preF(f(this.value, ...a)) : f(this.value, ...a);
    if(!res || (res && res._isAnything && res._type === nice.Err)){
      const e = new Error(this.text || ['Expected', toString(this.value),
        this._preMessage || '', 'to be', f.name, ...a.map(toString)].join(' '));
      e.shift = 1;
      throw e;
    }
    return true;
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