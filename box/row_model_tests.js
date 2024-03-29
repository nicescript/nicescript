const { RowModel } = nice;

Test((Spy) => {
	const m = RowModel();
  const qHome = m.filter({address:'Home'});
  const qHome2 = m.filter({address:'Home2'});
  const qStartWith = m.filter({name: {startsWith: 'jane'}});
  const optionsHome2age = qHome2.options('age');
  const optionsHome = m.filter().options('address');
  const sortHome2 = qHome2.sort('age');
  const sortHome2desc = qHome2.sort('age', -1);

  expect(qHome()).deepEqual([]);
  expect(qHome2()).deepEqual([]);
  expect(sortHome2()).deepEqual([]);
  expect(sortHome2desc()).deepEqual([]);
  expect(optionsHome2age()).deepEqual({});
  expect(optionsHome()).deepEqual({});

  const o = { name: 'Joe', age: 34 };
  const joeId = m.add(o);
  const janeId = m.add({ name: "Jane", age: 23, address: "Home"});
  const jimId = m.add({ name: "Jim", address: "Home2", age: 45});

  const joeBox = m.rowBox(joeId);
  const joeSpy = Spy();
  joeBox.subscribe(joeSpy);


  Test(() => {
    expect([...m.filter()]).deepEqual([joeId, janeId, jimId]);
		expect(m.get(joeId)).deepEqual({ ...o, _id: joeId });
    expect([...qHome()]).deepEqual([janeId]);
    expect([...qStartWith()]).deepEqual([janeId]);
    expect([...qHome2()]).deepEqual([jimId]);

    expect([...m.filter([o])()]).deepEqual([joeId]);

    expect(sortHome2()).deepEqual([jimId]);
    expect(sortHome2desc()).deepEqual([jimId]);

    expect(optionsHome2age()).deepEqual({45:1});
    expect(optionsHome()).deepEqual({"Home":1,"Home2":1});
    expect(joeBox).is(m.rowBox(joeId));
  });

  Test('find', () => {
//    expect(m.find(o)).is(joeId);
  });



  Test('assert', () => {
    expect(m.assert({ name: "Jane" })).is(janeId);
  });


  Test(() => {
		expect(joeBox()).deepEqual({ ...o, _id: joeId });
		expect(joeSpy).calledTimes(1);

		m.change(joeId, {age:33});
		expect(joeSpy).calledTimes(2);
	});


  Test(() => {
		expect(() => m.add({name:undefined})).throws();
		expect(() => m.change(joeId, {name:null})).throws();
	});


  Test('change field', () => {
    m.change(joeId, {address:"Home"});
    expect([...qHome()]).deepEqual([janeId, joeId]);
    expect([...qHome2()]).deepEqual([jimId]);
    expect(m.get(joeId).address).is("Home");
    expect(optionsHome()).deepEqual({"Home":2,"Home2":1});
  });

  Test('delete field', () => {
    m.change(janeId, { address: undefined });
    expect([...qHome()]).deepEqual([joeId]);
    expect(m.get(janeId).address).is(undefined);
    expect(optionsHome()).deepEqual({"Home":1,"Home2":1});
  });


  Test('change home2', () => {
    m.change(janeId, {address:"Home2"});
    expect([...qHome()]).deepEqual([joeId]);
    expect([...qHome2()]).deepEqual([jimId, janeId]);
    expect(optionsHome2age).deepEqual({23:1,45:1});
    expect(sortHome2()).deepEqual([janeId,jimId]);
    expect(sortHome2desc()).deepEqual([jimId,janeId]);
    expect(optionsHome()).deepEqual({"Home":1,"Home2":2});
  });


  Test('change age', () => {
    m.change(janeId, {age:46});
    expect(optionsHome()).deepEqual({"Home":1,"Home2":2});
    expect(optionsHome2age()).deepEqual({46:1,45:1});
    expect(sortHome2()).deepEqual([jimId,janeId]);
    expect(sortHome2desc()).deepEqual([janeId,jimId]);
  });


  Test((fromLog) => {
		const m2 = RowModel.fromLog(m.log);
    expect(m2.get(joeId)).deepEqual(m.get(joeId));
    expect(m2.filter().options("address")()).deepEqual({"Home":1,"Home2":2});
//    expect(m2.get(joeId)).deepEqual(o);
//    console.log(m.rows);
//    console.log(m2.rows);
    expect(m2.find({name:'Joe',age:33})).is(joeId);
	});


  Test((shadow) => {
    const m2 = RowModel.shadow(m);

    expect(() => m2.add({q:1})).throws();

    expect(m2.filter().options("address")()).deepEqual({"Home":1,"Home2":2});

		const asc = m2.filter({ address: "Home2" }).sort('age');
    expect(asc()).deepEqual([jimId,janeId]);

    expect([...qHome()]).deepEqual([joeId]);
    m.change(jimId, {address:'Home'});
    expect(asc()).deepEqual([janeId]);
    expect([...qHome()]).deepEqual([joeId, jimId]);

    m.change(jimId, {address:'Home2'});
    expect([...qHome()]).deepEqual([joeId]);
    expect(asc()).deepEqual([jimId,janeId]);
	});


//TODO:
//  Test((RowModelProxy) => {
//    const p = RowModelProxy((a, cb) => {
//      let source = m;
//      a.forEach(({action, args}) => source = source[action](args));
//      source.subscribe(cb);
//    });
//
//    const filter = p.filter({address:'Home'});
//    const filter2 = p.filter({address:'Home2'});
//
//    expect([...filter()]).deepEqual([...qHome()]);
//    expect([...filter2()]).deepEqual([...qHome2()]);
//	});

//TODO: aseert tested options a) when filter change b) when options field change
  Test('delete', () => {
    m.delete(joeId);
    expect(m.get(joeId)).is(undefined);
    expect(joeSpy).calledWith(undefined);
    expect([...qHome()]).deepEqual([]);
    expect([...qHome2()].sort()).deepEqual([janeId, jimId]);
    expect(sortHome2()).deepEqual([jimId, janeId]);
    expect(sortHome2desc()).deepEqual([janeId, jimId]);


    m.delete(jimId);
    expect([...qHome()]).deepEqual([]);
    expect([...qHome2()]).deepEqual([janeId]);
    expect(sortHome2()).deepEqual([janeId]);
    expect(sortHome2desc()).deepEqual([janeId]);
    expect(optionsHome2age()).deepEqual({46:1});
//    expect(optionsHome()).deepEqual({46:1});
	});



  m.compressField('occupation');
//  console.log(m);
});


Test((Spy) => {
	const m = RowModel();
  m.compressField('type');

  const janeId = m.add({ name: "Jane", type:'person', age: 23});
  const bimId = m.add({ name: "Bim", type:'dog'});
//  console.log(m);

  const m2 = RowModel.fromLog(m.log);
  expect(m2.get(janeId)).deepEqual(m.get(janeId));
  expect(m.get(bimId)).deepEqual(m2.get(bimId));
//  console.log(m2);
});


Test((Spy) => {
	const m = RowModel();
  m.compressField('type');

  m.assert({ translation: 'nice', type: 'translation', word: 86 });
  m.assert({ translation: 'well', type: 'translation', word: 86 });
  m.assert({ translation: 'properly', type: 'translation', word: 86 });
  m.assert({ translation: 'nicely', type: 'translation', word: 86 });
  m.assert({ translation: 'good', type: 'translation', word: 86 });
  m.assert({ translation: 'right', type: 'translation', word: 86 });

  const m2 = RowModel.fromLog(m.log);
  m2.assert({ translation: 'nice', type: 'translation', word: 86 });
  m2.assert({ translation: 'well', type: 'translation', word: 86 });
  m2.assert({ translation: 'properly', type: 'translation', word: 86 });
  m2.assert({ translation: 'nicely', type: 'translation', word: 86 });
  m2.assert({ translation: 'good', type: 'translation', word: 86 });
  m2.assert({ translation: 'right', type: 'translation', word: 86 });

  expect(m2.find({ translation: 'nice', type: 'translation', word: 86 }))
          .deepEqual(0);
//  console.log(m2);
});
