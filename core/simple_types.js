function s(title, itemTitle, parent, description){
  nice.Type({
    title: title,
    extends: parent,
    creator: () => nice[itemTitle],
    description,
    proto: {
      _isSingleton: true,
    }
  });
  nice[itemTitle] = Object.seal(create(nice[title].proto, new String(itemTitle)));
}

s('Nothing', 'NOTHING', 'Anything', 'Parent type for all falsy values.');
s('Undefined', 'UNDEFINED', 'Nothing', 'Wrapper for JS undefined.');
s('Null', 'NULL', 'Nothing', 'Wrapper for JS null.');
s('NotFound', 'NOT_FOUND', 'Nothing', 'Value returned by lookup functions in case nothing is found.');
s('Fail', 'FAIL', 'Nothing', 'Empty negative signal.');
s('NeedComputing', 'NEED_COMPUTING', 'Nothing', 'State of the Box in case it need some computing.');
s('Pending', 'PENDING', 'Nothing', 'State of the Box when it awaits input.');
s('Stop', 'STOP', 'Nothing', 'Value used to stop iterationin .each() and similar functions.');

s('Something', 'SOMETHING', 'Anything', 'Parent type for all non falsy values.');
s('Ok', 'OK', 'Something', 'Empty positive signal.');

