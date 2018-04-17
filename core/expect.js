def(nice, 'expectPrototype', {
  toBe: function(value){
    if(!value) {
      if(!this.value)
        throw this.message || 'Value expected';
    } else {
      if(this.value != value)
        throw this.message || value + ' expected';
    }
  },

  notToBe: function(value){
    if(!value) {
      if(this.value)
        throw this.message || 'No value expected';
    } else {
      if(this.value == value)
        throw this.message || value + ' not expected';
    }
  },

  toMatch: function(f){
    if(!f(this.value))
      throw this.message || ('Value does not match function ' + f);
  }
});


nice._on('Check', f => {
  f.name && def(nice.expectPrototype, f.name, function(...a){
    if(!f(this.value, ...a))
      throw this.message || (f.name + ' expected');
  });
});


def(nice, function expect(value, message){
  return create(nice.expectPrototype, { value, message, item: this});
});

expect = nice.expect;