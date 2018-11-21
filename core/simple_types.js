function s(name, parent, description, ){
  const value = Object.freeze({ _type: name });
  nice.Type({
    name,
    extends: parent,
    onCreate: z => z._value = value,
    description,
    proto: {
    }
  })();
}

s('Nothing', 'Anything', 'Parent type for all falsy values.');
s('Undefined', 'Nothing', 'Wrapper for JS undefined.');
s('Null', 'Nothing', 'Wrapper for JS null.');
//s('NotFound', 'Nothing', 'Value returned by lookup functions in case nothing is found.');
s('Fail', 'Nothing', 'Empty negative signal.');
s('NeedComputing', 'Nothing', 'State of the Box in case it need some computing.');
s('Pending', 'Nothing', 'State of the Box when it awaits input.');
s('Stop', 'Nothing', 'Value used to stop iterationin .each() and similar functions.');
s('NumberError', 'Nothing', 'Wrapper for JS NaN.');

s('Something', 'Anything', 'Parent type for all non falsy values.');
s('Ok', 'Something', 'Empty positive signal.');

defGet(nice.Nothing.proto, function jsValue() {
  return {[nice.TYPE_KEY]: this._type.name};
});

defGet(nice.Null.proto, function jsValue() {
  return null;
});

defGet(nice.Undefined.proto, function jsValue() {
  return undefined;
});
