function s(title, itemTitle, parent){
  nice.Type({
    title: title,
    extends: parent,
    creator: () => nice[itemTitle],
    proto: {
      _isSingleton: true,
    }
  });
  nice[itemTitle] = Object.seal(create(nice[title].proto, new String(itemTitle)));
}

s('Nothing', 'NOTHING', 'Anything');
s('Undefined', 'UNDEFINED', 'Nothing');
s('Null', 'NULL', 'Nothing');
s('NotFound', 'NOT_FOUND', 'Nothing');
s('Fail', 'FAIL', 'Nothing');
s('NeedComputing', 'NEED_COMPUTING', 'Nothing');
s('Pending', 'PENDING', 'Nothing');
s('Stop', 'STOP', 'Nothing');

s('Something', 'SOMETHING', 'Anything');
s('Ok', 'OK', 'Something');

