def(nice, 'expectPrototype', {
  toBe (value){
    if(!value) {
      if(!this.value)
        throw this.message || 'Value expected';
    } else {
      if(this.value != value)
        throw this.message || value + ' expected';
    }
  },

  notToBe (value){
    if(!value) {
      if(this.value)
        throw this.message || 'No value expected';
    } else {
      if(this.value == value)
        throw this.message || value + ' not expected';
    }
  },

  toMatch (f){
    if(!f(this.value))
      throw this.message || ('Value does not match function ' + f);
  }
});


reflect.on('Check', f => {
  f.name && def(nice.expectPrototype, f.name, function(...a){
    if(!f(this.value, ...a))
      throw this.message || (f.name + ' expected');
    return nice.Ok();
  });
});


def(nice, function expect(value, message){
  return create(nice.expectPrototype, { value, message, item: this});
});

expect = nice.expect;