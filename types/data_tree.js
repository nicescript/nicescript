nice.Type({
  name: 'DataTree',

  extends: 'Something',

  initBy: (z) => {
    z.values = {};
    z.meta = {};
  },

  proto: {
    set ( path, value ) {
      // check restrictions
      let meta = this.meta;
      let values = this.values;
      const length = path.length - 1;

      for(let i = 0; i < length; i++) {
        const key = path[i];
        if(!(key in values))
          values[key] = {};
        values = values[key];
      }

      values[path[length]] = value;
    },

    get ( path ) {
      let result = this.values;

      for(let key of path) {
        result = result[key];
      }

      return result;
    },

    setRestriction ( path, restriction ) {
      //
    },

    subscribe ( path, listener ) {

    }

  }
});


Test(DataTree => {
  const tree = DataTree();
  tree.set(['qwe', 'asd'], 1);
  expect(tree.get(['qwe', 'asd'])).is(1);
});


Test((DataTree, Spy) => {
//    unsubscribe???
  const db = DataTree();
  const userInfo = { name: 'Jim', access: ["room1", "room3"] };

  db.set( 'users', {} );
  db.set( 'users', 'id1', userInfo );


  Test('listenKey', () => {
    const keySpy = Spy();
    db.listenKey("users", keySpy);
    expect(keySpy).calledWith("id1", userInfo);
  });

  Test('listenValue', () => {
    const valueSpy = Spy();
    db.listenValue("users", valueSpy);
    expect(valueSpy).calledWith(userInfo, "id1");
  });


  Test('listenAll', () => {
    const allSpy = Spy();
    db.listenAll("users", "*", allSpy);
    expect(allSpy).calledWith(userInfo);
  });


  Test('listenEach', () => {
    const eachSpy = Spy();
    db.listenEach("users", "*", "access", eachSpy);

    expect(eachSpy).calledTwice();
    expect(eachSpy).calledWith("id1", "room1");
    expect(eachSpy).calledWith("id1", "room3");
  });

});