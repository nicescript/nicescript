nice.Check('isType', v => Anything.isPrototypeOf(v) || v === Anything);

nice.ReadOnly.Anything(function jsValue(z) { return z._value; });


function s(name, parent, description, ){
  const value = Object.freeze({ _type: name });
  nice.Type({
    name,
    extends: parent,
    description,
    proto: {
    }
  })();
}

s('Nothing', 'Anything', 'Parent type for all falsy values.');
s('Undefined', 'Nothing', 'Wrapper for JS undefined.');
s('Null', 'Nothing', 'Wrapper for JS null.');
s('NotFound', 'Nothing', 'Value returned by lookup functions in case nothing is found.');
NotFound = nice.NotFound;
s('Fail', 'Nothing', 'Empty negative signal.');
s('Pending', 'Nothing', 'State when item awaits input.');
s('Stop', 'Nothing', 'Value used to stop iterationin .each() and similar functions.');
s('NumberError', 'Nothing', 'Wrapper for JS NaN.');
s('AssignmentError', 'Nothing', `Can't assign`);

s('Something', 'Anything', 'Parent type for all non falsy values.');
s('Ok', 'Something', 'Empty positive signal.');

nice.Nothing.defaultValueBy = () => null;

nice.ReadOnly.Nothing(function jsValue(z) {
  return {[nice.TYPE_KEY]: z._type.name};
});


defGet(nice.Null.proto, function jsValue() {
  return null;
});

defGet(nice.Undefined.proto, function jsValue() {
  return undefined;
});

//TODO: cast compatible


['string', 'boolean', 'number', 'object', 'function'].forEach(typeName => {
  nice.Anything.configProto[typeName] = function (name, defaultValue) {
    Object.defineProperty(this.target.proto, name, {
      get: function(){
        let v = this._value[name];
        if(v === undefined)
          v = this._value[name] = defaultValue;
        return v;
      },
      set: function(value){
        if(typeof value !== typeName)
          throw `Can't set ${name}[${typeName}] to ${value}[${typeof value}]`;
        this._value[name] = value;
      },
      enumerable: true
    });
    return this;
  };
});


//Array
nice.Anything.configProto.array = function (name, defaultValue = []) {
  Object.defineProperty(this.target.proto, name, {
    get: function(){
      let value = this._value[name];
      if(value === undefined)
        value = this._value[name] = defaultValue;
      return value;
    },
    set: function(value){
      if(!Array.isArray(value))
        throw `Can't set ${name}[${typeName}] to ${value}[${typeof value}]`;
      this._value[name] = value;
    },
    enumerable: true
  });
  return;
};
