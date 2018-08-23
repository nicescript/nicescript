function s(name, parent, description, ){
  const value = Object.freeze({ _type: name });
  nice.Type({
    name,
    extends: parent,
    defaultValue: () => value,
//    creator: () => nice[itemTitle],
    description,
    proto: {
      _isSingleton: true,
    }
  })();
//  nice[itemTitle] = Object.seal(create(nice[name].proto, new String(itemTitle)));
}

s('Nothing', 'Anything', 'Parent type for all falsy values.');
s('Undefined', 'Nothing', 'Wrapper for JS undefined.');
s('Null', 'Nothing', 'Wrapper for JS null.');
s('NotFound', 'Nothing', 'Value returned by lookup functions in case nothing is found.');
s('Fail', 'Nothing', 'Empty negative signal.');
s('NeedComputing', 'Nothing', 'State of the Box in case it need some computing.');
s('Pending', 'Nothing', 'State of the Box when it awaits input.');
s('Stop', 'Nothing', 'Value used to stop iterationin .each() and similar functions.');

s('Something', 'Anything', 'Parent type for all non falsy values.');
s('Ok', 'Something', 'Empty positive signal.');

