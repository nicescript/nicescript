const { RowModel } = nice;

Test((Spy) => {
	const m = RowModel();
  const qHome = m.filter({address:'Home'});
  const qHome2 = m.filter({address:'Home2'});
  const optionsHome2age = qHome2.options('age');
  const sortHome2 = qHome2.sort('age');
  const sortHome2desc = qHome2.sort('age', -1);

  expect(qHome()).deepEqual([]);
  expect(qHome2()).deepEqual([]);
  expect(sortHome2()).deepEqual([]);
  expect(sortHome2desc()).deepEqual([]);
  expect(optionsHome2age()).deepEqual({});

  const o = { name: 'Joe', age: 34 };
  const joeId = m.add(o);
  const janeId = m.add({ name: "Jane", age: 23, address: "Home"});
  const jimId = m.add({ name: "Jim", address: "Home2", age: 45});

  const joeBox = m.rowBox(joeId);
  const joeSpy = Spy();
  joeBox.subscribe(joeSpy);


  Test(() => {
		expect(m.get(joeId)).deepEqual(o);
    expect([...qHome()]).deepEqual([janeId]);
    expect([...qHome2()]).deepEqual([jimId]);

    expect(sortHome2()).deepEqual([jimId]);
    expect(sortHome2desc()).deepEqual([jimId]);

    expect(optionsHome2age()).deepEqual({45:1});
    expect(joeBox).is(m.rowBox(joeId));
  });


  Test('assert', () => {
    expect(m.assert({ name: "Jane" })).is(janeId);
  });


  Test(() => {
		expect(joeBox()).deepEqual(o);
		expect(joeSpy).calledTimes(1);

		m.change(joeId, {age:33});
		expect(joeSpy).calledTimes(2);
		expect(joeSpy).calledWith(o);
	});


  Test(() => {
		expect(() => m.add({name:undefined})).throws();
		expect(() => m.change(joeId, {name:undefined})).throws();
	});


  Test('change home', () => {
    m.change(joeId, {address:"Home"});
    expect([...qHome()]).deepEqual([janeId, joeId]);
    expect([...qHome2()]).deepEqual([jimId]);
    expect(m.get(joeId).address).is("Home");
  });


  Test('change home2', () => {
    m.change(janeId, {address:"Home2"});
    expect([...qHome()]).deepEqual([joeId]);
    expect([...qHome2()]).deepEqual([jimId, janeId]);
    expect(optionsHome2age).deepEqual({23:1,45:1});
    expect(sortHome2()).deepEqual([janeId,jimId]);
    expect(sortHome2desc()).deepEqual([jimId,janeId]);
  });

  Test('change age', () => {
    m.change(janeId, {age:46});
    expect(optionsHome2age()).deepEqual({46:1,45:1});
    expect(sortHome2()).deepEqual([jimId,janeId]);
    expect(sortHome2desc()).deepEqual([janeId,jimId]);
  });


  Test((fromLog) => {
		const m2 = RowModel.fromLog(m.log);
    expect(m2.get(joeId)).deepEqual(o);
	});


  Test((shadow) => {
    const m2 = RowModel.shadow(m);

    expect(() => m2.add({q:1})).throws();

		const asc = m2.filter({ address: "Home2" }).sort('age');
    expect(asc()).deepEqual([jimId,janeId]);

    m.change(jimId, {address:'Home'});
    expect(asc()).deepEqual([janeId]);
	});


  Test('delete', () => {
    m.delete(joeId);
    expect(m.get(joeId)).is(undefined);
    expect(joeSpy).calledWith(undefined);
    expect([...qHome()]).deepEqual([jimId]);
    expect([...qHome2()]).deepEqual([janeId]);
    expect(sortHome2()).deepEqual([janeId]);
    expect(sortHome2desc()).deepEqual([janeId]);


    m.delete(jimId);
    expect([...qHome()]).deepEqual([]);
    expect([...qHome2()]).deepEqual([janeId]);
    expect(sortHome2()).deepEqual([janeId]);
    expect(sortHome2desc()).deepEqual([janeId]);
    expect(optionsHome2age()).deepEqual({46:1});
	});

  console.log(m);
});
