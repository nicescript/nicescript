nice.define(nice, 'expectPrototype', {
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
    console.log(this.value);
    if(!f(this.value))
      throw this.message || ('Value does not match function ' + f);
  }
});


nice.each((checker, type) => {
  nice.expectPrototype['toBe' + type] = function(...a){
    if(!checker(this.value, ...a))
      throw this.message || (type + ' expected');
  };
}, nice.is);


nice.define(nice, function expect(value, message){
  return Object.setPrototypeOf(
    {value:value, message: message, item: this},
    nice.expectPrototype
  );
});