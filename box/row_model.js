const { _eachEach, _pick } = nice;
//const api = {
//	change: {
//		add: () => {},
//		change: () => {},
//		transaction: () => {},
//	},
//	get: {
//		row: () => {},
//		filter: () =>	{}
//	},
//};

const proto = {
	add(o) {
		checkObject(o);
		const id = this.rows.length;
    o.id = id;
		this.lastId = id;
		this.rows.push(o);
		this.writeLog(id, o);
		if(id in this.rowBoxes)
			this.rowBoxes[id](this.rows[id]);
		this.notifyIndexes(id, o);
		return id;
	},

  assertIndex(field) {
		const ii = this.indexes;
    if(!(field in ii))
      ii[field] = nice.BoxIndex();
    return ii[field];
  },

  matchingFilters(field, value){
    const fs = [];
    _eachEach(this.filters[field], (filter, kk, op) => {
      ops[op].f(value, filter.value) && fs.push(filter);
    });
    return fs;
  },

	notifyIndexes(id, newValues, oldValues) {
		_each(oldValues, (v, field) => {
      this.notifyIndexOneValue(id, field, newValues[field], v);
    });
		_each(newValues, (v, field) => {
      !(oldValues && field in oldValues)
          && this.notifyIndexOneValue(id, field, v);
    });
	},

	notifyIndexOneValue(id, field, newValue, oldValue) {
		const ff = this.filters;
		if(newValue === oldValue)
			return;

		const index = this.assertIndex(field);
    oldValue !== undefined && index.delete(oldValue, id);
    newValue !== undefined && index.add(newValue, id);

    const outList = this.matchingFilters(field, oldValue);
    const inList = this.matchingFilters(field, newValue);

    outList.forEach(f => inList.includes(f) || f.delete(id));
    inList.forEach(f => outList.includes(f) || f.add(id));

    _each(this.sortResults[field], s => s.considerChange(id, newValue));
  },

	get(id) {
		return this.rows[id];
	},

	change(id, o){
		checkObject(o);
		//check id

    if(id in this.rows){
      const row = this.rows[id];
      const old = _pick(row, Object.keys(o));
      Object.assign(row, o);
      _each(o, (v, k) => this.notifyIndexOneValue(id, k, v, old[k]));
    } else {
  		this.notifyIndexes(id, o, this.rows[id]);
      this.rows[id] = o;
    }

		this.writeLog(id, o);
		if(id in this.rowBoxes)
			this.rowBoxes[id](this.rows[id]);
	},

	writeLog(id, o) {
		const templateId = this.findTemplate(o);
		const template = this.templates[templateId];

		this.version = this.log.length;
		const row = [templateId, id, ...template.map(field => o[field])];
		this.log.push(row);
		this.logSubscriptions.forEach(f => f(row));
	},

	findTemplate(a) {
		if(!Array.isArray(a))
			a = Object.keys(a);
		a.sort();
		const id = this.templates.findIndex(r => nice.deepEqual(r, a));
		if(id !== -1)
			return id;

		const newId = this.templates.length;
		this.templates.push(a);
		this.version = this.log.length;
		const row = [-1, newId, ...a];
		this.log.push(row);
		this.logSubscriptions.forEach(f => f(row));
		return newId;
	},

	rowBox(id) {
		if(!(id in this.rowBoxes)){
			this.rowBoxes[id] = nice.Box(this.rows[id]);
		}
		return	this.rowBoxes[id];
	},

	importLogRow(row) {
		const m = this;
		const templateId = row[0];
		const id = row[1];
		if(templateId === -1){ // row is a template
			m.templates[id] = row.slice(2);
		} else {
			if(!m.rows[id])
				m.rows[id] = {};
			const template = m.templates[templateId];
			row.slice(2).forEach((v, k) => {
				const field = template[k];
				this.notifyIndexOneValue(id, field, v, m.rows[id][field]);
				m.rows[id][field] = v;
			});
			if(id in this.rowBoxes)
				this.rowBoxes[id](this.rows[id]);
		}
		m.log.push(row.slice());
    this.version++;
	},

	subscribeLog(f) {
		if(this.logSubscriptions.includes(f))
			return;
		this.logSubscriptions.push(f);
	},

  addSortResult(field, sortResult) {
    (this.sortResults[field] ??= []).push(sortResult);
  },

  readOnly() {
    ['add', 'change'].forEach(a => this[a] = () => { throw "This model is readonly"; });
  }
};

function RowModel(){
  const res = create(proto, {
		lastId: -1,
    version: 0,
		templates: [],
		rows: [],
		log: [],
		indexes: {},
		rowBoxes: {},
		filters: {},
    sortResults: {},
		logSubscriptions: [],
    filterCounter: 0,
    compositQueries: {}
	});

//    filter({adress: 'home', gender: "male" });
//    filter({adress: 'home', age: { gt: 16 } });
//    filter([{adress: 'home'}, { age: { gt: 16 } }]);

  function extractOp(o, field) {
    const [opName, value] = Object.entries(o)[0];
    return { op, value, field };
  }

  res.filter = function(o) {
    const qs = Object.entries(o).map(([field, q]) => typeof q === 'string'
      ? {field, opName: 'eq', value: q }
      : extractOp(q, field));

    const filters = qs.map(q => newFilter(res, q))
        .sort((a, b) => a._sortKey - b._sortKey);

    while(filters.length > 1){
      const f = filters.shift();
      const f2 = filters[0];

      const key = f._sortKey + '+' + f2._sortKey;
      filters[0] = res.compositQueries[key] ||
        (res.compositQueries[key] = f.intersection(f2));      ;
    }

    return filters[0];
  };


	return res;
}
nice.RowModel = RowModel;

RowModel.fromLog = (log) => {
	const m = RowModel();
	log.forEach(row => m.importLogRow(row));
	return m;
};


RowModel.shadow = (source) => {
  const m = RowModel.fromLog(source.log);
  m.readOnly();
  source.subscribeLog(row => m.importLogRow(row));
  return m;
};


function matchFilter(ff, row) {
	let res = true;
	ff.forEach(f => {
		const [ field, value ] = f;
		if(row[field] !== value)
			res = false;
	});
	return res;
}


function isValidValue(v){
	const t = typeof v;
	return t === 'string' || t === 'number' || t === 'boolean';
}


function checkObject(o){
	_each(o, (v, k) => {
		if(!isValidValue(v))
			throw 'Invalid value ' + ('' + v) + ':' + typeof v;
	});
}


nice.Type({
  name: 'RowsFilter',
  extends: 'BoxSet',
  initBy: (z, model) => {
    z.super();
    z.model = model;
    z.sortsAsc = nice.memoize(field => nice.SortResult(z, field, 1));
    z.sortsDesc = nice.memoize(field => nice.SortResult(z, field, -1));
  }
});

nice.Mapping.RowsFilter.String('sort', (filter, field, direction = 1) => {//'asc'
//  console.log(filter.model.indexes);

  return filter[direction > 0 ? 'sortsAsc' : 'sortsDesc' ](field);
});


nice.Type({
  name: 'SortResult',
  extends: 'BoxArray',
  initBy (z, query, field, direction) {
    z.super();
    query.model.addSortResult(field, z);
    z.query = query;
    z.field = field;
    z.direction = direction;

    const rows = query.model.rows;
    z.sortFunction = direction > 0
      ? (a, b) => rows[a][field] > rows[b][field] ? 1 : -1
      : (a, b) => rows[a][field] > rows[b][field] ? -1 : 1;

    query.subscribe((v, oldV) => {
      oldV !== undefined && z.deleteId(oldV);
      v !== null && z.insertId(v);
    });
  },

  customCall: (z, ...as) => {
    if(as.length === 0) {
      z._isHot === true || z.coldCompute();
      return z._value;
    }

    throw `Can't set value for reactive box`;
  },

  proto: {
    coldCompute(){
//      console.log(rows);
      const ids = [...this.query()].sort(this.sortFunction);
      this._value = ids;
    },

    insertId(id) {
      this.insert(sortedPosition(this._value, id, this.sortFunction), id);
    },
    deleteId(id) {
      //TODO: replace with binary search
      this.removeValue(id);
    },
    considerChange(id, newValue) {
      //TODO: optimize
//      console.log(s.query.has(id));
      const oldPosition = this._value.indexOf(id);
      const position = sortedPosition(this._value, id, this.sortFunction);
      if(oldPosition === position) {
        return;
      }
      if(oldPosition > position) {
        this.remove(oldPosition);
        this.insert(position, id);
      } else {
        this.insert(position, id);
        oldPosition >= 0 && this.remove(oldPosition);
      }
    }
  }
});

function sortedPosition(a, v, f = (a, b) => a > b ? 1 : -1){
  //TODO: binary search
  let i;
  for(i in a){
    if(f(a[i], v) > 0){
      return +i;
    }
  }
  return a.length;
}

Test(() => {
  const a = [1,2,3,4,5,6];
  expect(sortedPosition(a, 0)).is(0);
  expect(sortedPosition(a, 2.5)).is(2);
  expect(sortedPosition(a, 10)).is(6);
});


const ops = {
  eq: { arity: 2, f: (a, b) => a === b }
};

const newFilter = (model, q) => {
  const { field, opName, value } = q
  expect(field).isString();
  const filters = model.filters;

  if(!(field in filters))
    filters[field] = Object.create(null);

  if(!(opName in filters[field]))
    filters[field][opName] = Object.create(null);

  const opFilters = filters[field][opName];
  const key = JSON.stringify(value);

  if(!(opName in ops))
    throw `Unknown operation: ${opName}`;

  const op = ops[opName].f;
  if(!(key in opFilters)) {
    const filter = opFilters[key] = nice.RowsFilter(model);
    Object.assign(filter, q);
    model.rows.forEach((row, id) => op(row[field], value) && filter.add(id));
    filter._version = model.version;
    filter._sortKey = model.filterCounter++;
  }
  return opFilters[key];
};


function createFilter(model) {
  const filter = (field, value) => newFilter({field, opName: 'eq', value});
  filter.model = model;

  _each(ops, (f, opName) =>
      filter[opName] = (field, value) => newFilter({field, opName, value}));

  return filter;
}


Test(() => {
	const m = RowModel();
	const o = { name: 'Joe', age: 34 };
	const joeId = m.add(o);
	const janeId = m.add({ name: "Jane", age: 23, address: "Home"});
	const jimId = m.add({ name: "Jim", address: "Home2", age: 45});

	Test(() => {
		expect(m.get(joeId)).deepEqual(o);
	});

	Test(() => {
		expect(() => m.add({name:undefined})).throws();
		expect(() => m.change(joeId, {name:undefined})).throws();
		expect(m.get(joeId)).deepEqual(o);
	});

	Test(() => {
		m.change(joeId, {address:"Home"});
		expect(m.get(joeId).address).is("Home");
	});

	Test(() => {
		const res = m.filter({"address": "Home"});
		expect(res.has(janeId)).is(true);
		expect(res.has(joeId)).is(true);
		expect(res.size).is(2);
	});

  Test(() => {
		const res = m.filter({address: "Home", name: "Joe"});
		expect(res.has(joeId)).is(true);
		expect(res.size).is(1);
    expect(res).is(m.filter({name: "Joe", address: "Home"}));
	});

	Test(() => {
		const res = m.filter({"address": "Home"});
		expect(res.has(joeId)).is(true);
		expect(res.has(janeId)).is(true);
		expect(res.size).is(2);
		expect(res).is(m.filter({"address": "Home"}));
	});

	Test(() => {
		const m2 = RowModel.fromLog(m.log);
		expect(m2.get(joeId).age).is(34);
	});

	Test((Spy) => {
		const b = m.rowBox(joeId);
		expect(b()).deepEqual(m.get(joeId));

		const spy = Spy();
		b.subscribe(spy);
		m.change(joeId, {address:'Home2'});
		expect(spy).calledTwice();


    expect([...m.filter({ address: "Home" })()]).deepEqual([janeId]);
    expect([...m.filter({ address: "Home2" })()]).deepEqual([joeId,jimId]);
    m.change(joeId, { age: 33 });
    expect([...m.filter({ address: "Home2" })()]).deepEqual([joeId,jimId]);
	});

	Test(() => {
		const asc = m.filter({ address: "Home2" }).sort('age');
    expect(asc()).deepEqual([0,2]);

    const desc = m.filter({ address: "Home2" }).sort('age', -1);
    expect(desc()).deepEqual([2,0]);
	});


  Test((Spy) => {
    const spy = Spy(console.log);
    const m3 = RowModel();
    const joeId = m3.add({ name: 'Joe', age: 34, address: "Home" });
    const janeId = m3.add({ name: "Jane", age: 23, address: "Home"});

		const asc = m3.filter({ address: "Home" }).sort('age');
    expect(asc).is(m3.filter({ address: "Home" }).sort('age'));
    expect(asc()).deepEqual([1,0]);

    asc.subscribe(spy);
    expect(spy).calledTwice();
    expect(spy).calledWith(1,0);
    expect(spy).calledWith(0,1);
    console.log('CHANGE');

    const a = asc.map(x => x);
    expect(a()).deepEqual([1,0]);
    m3.change(joeId, { age: 18 });
    expect(a()).deepEqual([0,1]);
    expect(asc()).deepEqual([0,1]);
	});



  Test(() => {
    const m2 = RowModel.shadow(m);

    expect(() => m2.add({q:1})).throws();

		const asc = m2.filter({ address: "Home2" }).sort('age');
    expect(asc()).deepEqual([0,2]);

    m.change(joeId, {address:'Home'});
    expect(asc()).deepEqual([2]);
	});
});



