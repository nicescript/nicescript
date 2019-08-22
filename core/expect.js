def(nice, 'expectPrototype', {});


reflect.on('Check', f => {
  f.name && def(nice.expectPrototype, f.name, function(...a){
    const res = f(this.value, ...a);
    if(!res || (res && res._isAnything && res._type === nice.Err)){
      const position = nice.parseTraceString(Error().stack.split('\n')[2]);
      throw {
        ...position,
        message: this.text || ['Expected', this.value, 'to be', f.name, ...a].join(' ')
      };
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