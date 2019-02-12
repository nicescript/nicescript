def(nice, 'expectPrototype', {
  toBe (value){
    if(!value) {
      if(!this.value)
        throw this.text || 'Value expected';
    } else {
      if(this.value != value)
        throw this.text || value + ' expected';
    }
  },

  notToBe (value){
    if(!value) {
      if(this.value)
        throw this.text || 'No value expected';
    } else {
      if(this.value == value)
        throw this.text || value + ' not expected';
    }
  },

  toMatch (f){
    if(!f(this.value))
      throw this.text || ('Value does not match function ' + f);
  }
});


reflect.on('Check', f => {
  f.name && def(nice.expectPrototype, f.name, function(...a){
    if(!f(this.value, ...a))
      throw this.text || ['Expected', this.value, 'to be', f.name, ...a].join(' ');
    return nice.Ok();
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