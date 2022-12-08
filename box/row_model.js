//TODO: cache derivatives
//TODO: gradual client updates


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
//		this.notifyFilters(id, o);
		this.notifyIndexes(id, o);
		return id;
	},

  assertIndex(field) {
		const ii = this.indexes;
    if(!(field in ii))
      ii[field] = nice.BoxIndex();
    return ii[field];
  },

	notifyIndexes(id, newValues, oldValues) {
		const ii = this.indexes;

		_each(oldValues, (v, k) => this.assertIndex(k).delete(v, id));
		_each(newValues, (v, k) => this.assertIndex(k).add(v, id));

//			_each(ff[k], (map, operation) => {
//				if(operation === 'eq'){
//					if(oldValues !== undefined){
//						if (v === oldValues[k])
//							return;
//						if(map.has(oldValues[k]))
//							map.get(oldValues[k]).removeValue(id);
//					}
//					if(map.has(v))
//						map.get(v).push(id);
//				} else {
//					throw 'Operation ' + operation + " not supported.";
//				}
//			});
//		});
	},

//	notifyFilters(id, newValues, oldValues) {
//		const ff = this.filters;
//		_each(newValues, (v, k) => {
//			if(!(k in ff))
//				return;
//			_each(ff[k], (map, operation) => {
//				if(operation === 'eq'){
//					if(oldValues !== undefined){
//						if (v === oldValues[k])
//							return;
//						if(map.has(oldValues[k]))
//							map.get(oldValues[k]).removeValue(id);
//					}
//					if(map.has(v))
//						map.get(v).push(id);
//				} else {
//					throw 'Operation ' + operation + " not supported.";
//				}
//			});
//		});
//	},
//
	notifyIndexOneValue(id, k, newValue, oldValue) {
		const ff = this.filters;
		if(newValue === oldValue)
			return;

		const index = this.assertIndex(k);
    oldValue !== undefined && index.delete(oldValue, id);
    newValue !== undefined && index.add(newValue, id);
  },

//	notifyFiltersOneValue(id, k, newValue, oldValue) {
//		const ff = this.filters;
//		if(newValue === oldValue)
//			return;
//
//		if(!(k in ff))
//			return;
//
//		_each(ff[k], (map, operation) => {
//			if(operation === 'eq'){
//				if(map.has(oldValue))
//					map.get(oldValue).removeValue(id);
//				if(map.has(newValue))
//					map.get(newValue).push(id);
//			} else {
//				throw 'Operation ' + operation + " not supported.";
//			}
//		});
//	},

	get(id) {
		return this.rows[id];
	},

	change(id, o){
		checkObject(o);
		//check id
		//check object
//		this.notifyFilters(id, o, this.rows[id]);
		this.notifyIndexes(id, o, this.rows[id]);
    
    id in this.rows
  		? Object.assign(this.rows[id], o)
      : (this.rows[id] = o);

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

	importRow(row) {
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
//				this.notifyFiltersOneValue(id, field, v, m.rows[id][field]);
				m.rows[id][field] = v;
			});
			if(id in this.rowBoxes)
				this.rowBoxes[id](this.rows[id]);
		}
		m.log.push(row.slice());
	},

	subscribeLog(f) {
		if(this.logSubscriptions.includes(f))
			return;
		this.logSubscriptions.push(f);
	}
};

function RowModel(){
  const res = create(proto, {
		lastId: -1,
		templates: [],
		rows: [],
		log: [],
		indexes: {},
		rowBoxes: {},
		filters: {},
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
	log.forEach(row => m.importRow(row));
	return m;
};


RowModel.readOnly = () => {
	const m = RowModel();
	['add', 'change'].forEach(a => m[a] = () => { throw "This model is readonly"; });
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
    z.query = query;
    z.field = field;
    z.direction = direction;
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
      const rows = this.query.model.rows;
//      console.log(rows);
      const f = (a, b) => this.direction > 0
        ? rows[a][this.field] > rows[b][this.field] ? 1 : -1
        : rows[a][this.field] > rows[b][this.field] ? -1 : 1;
      const ids = [...this.query()].sort(f);
      this._value = ids;
    }
  }
});


const ops = {
  eq: { arity: 2, f: (a, b) => a === b }
};

const newFilter = (model, { field, opName, value }) => {
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
	});

	Test(() => {
		const asc = m.filter({ address: "Home" }).sort('age');
    expect(asc()).deepEqual([1,0]);

    const desc = m.filter({ address: "Home" }).sort('age', -1);
    expect(desc()).deepEqual([0,1]);
	});

//	Test((Spy) => {
//		const spy = Spy();
//		const res = m.filterBox(['address','Home2']);
//		res.subscribe(spy);
//		expect(spy).calledWith(joeId);
//		const jimId = m.add({address:"Home2"});
//		expect(spy).calledWith(jimId);
//		m.change(jimId, {address:"Home3"});
//		expect(spy).calledWith(null, null, 2, 1);
//	});
});



