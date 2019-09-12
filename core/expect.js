def(nice, 'expectPrototype', {});

const toString = v => JSON.stringify(v);

reflect.on('Check', f => {
  f.name && def(nice.expectPrototype, f.name, function(...a){
    this.value && this.value._compute && this.value._compute();
    const res = f(this.value, ...a);
    if(!res || (res && res._isAnything && res._type === nice.Err)){
      const e = new Error(this.text || ['Expected', toString(this.value),
            'to be', f.name, ...a.map(toString)].join(' '));
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

def(nice.expectPrototype, function message(...a){
  this.texts = a;
  return this;
});

expect = nice.expect;