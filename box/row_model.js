const { _eachEach, _pick, once, memoize, sortedPosition } = nice;

const TEMPLATE = -1;
const DELETE = -2;
const COMPRESS = -3;
const VALUE = -4;

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
  //TODO:
  /*
//TODO: id is not necessary
[ -1, 0, 'age', 'id', 'name' ],

//TODO: 2nd argument is not necessery
[ 0, 0, 34, 0, 'Joe' ],
*/
	add(o) {
		checkObject(o);
		const id = this.rows.length;
		this.lastId = id;
		this.rows.push(o);
		this.writeLog(id, o);
    o._id = id;
		this.notifyIndexes(id, o);
		if(id in this.rowBoxes)
			this.rowBoxes[id](this.rows[id]);
		return id;
	},

  find(o) {
    let res = null;
    const ii = [];

    for(let k in o) {
      if(!this.indexes[k])
        return null;

      const ids = this.indexes[k].getKeys(o[k]);
      if(ids === null || ids.length === 0)
        return null;

      res = res === null
        ? ids
        : res.filter(id => ids.includes(id));
    }
//    console.log(res[0]);
    return res[0];
  },

  assert(o) {
//    this.find(o);
//    for(let i in this.rows)
//      if(match(o, this.rows[i]))
//        return +i;

    return this.find(o) || this.add(o);
  },

  compressField(f){
    expect(f).isString();
    if(f in this.compressedFields)
      return;

    this.compressedFields[f] = true;
    this._pushLog([COMPRESS, f]);
  },

  _pushLog(row){
    this.log.push(row);
		this.logSubscriptions.forEach(f => f(row));
    this.version = this.log.length;
  },

  delete(id) {
    this._pushLog([DELETE, id]);
    const data = this.rows[id];
    delete this.rows[id];

    _each(data, (v, k) => this.notifyIndexOneValue(id, k, undefined, v));

		if(id in this.rowBoxes)
			this.rowBoxes[id](undefined);
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
  },

	notifyAllSorts(id, newValues, oldValues) {
		_each(oldValues, (v, field) => {
      this.notifySorts(id, field, newValues[field], v);
    });
		_each(newValues, (v, field) => {
      !(oldValues && field in oldValues)
          && this.notifySorts(id, field, v);
    });
	},

  notifySorts(id, field, newValue, oldValue){
    _each(this.sortResults[field], s => s.considerChange(id, newValue, oldValue));
  },

	notifyAllOptions(id, newValues, oldValues) {
		_each(oldValues, (v, field) => {
      this.notifyOptions(id, field, newValues[field], v);
    });
		_each(newValues, (v, field) => {
      !(oldValues && field in oldValues)
          && this.notifyOptions(id, field, v);
    });
	},

  notifyOptions(id, field, newValue, oldValue){
    _each(this.options[field], s => s.considerChange(id, newValue, oldValue));
  },

	get(id) {
		return this.rows[id];
	},

	change(id, o){
		checkObject(o);
		//check id

		this.writeLog(id, o);
    let old;

    if(id in this.rows){
      const row = this.rows[id];
      old = _pick(row, Object.keys(o));
      Object.assign(row, o);
      _each(o, (v, k) => this.notifyIndexOneValue(id, k, v, old[k]));
    } else {
      this.rows[id] = o;
  		this.notifyIndexes(id, o);
    }

    this.notifyAllOptions(id, o, old);
    this.notifyAllSorts(id, o, old);

		if(id in this.rowBoxes)
			this.rowBoxes[id](this.rows[id]);
	},

	writeLog(id, o) {
		const templateId = this.findTemplate(o);
		const template = this.templates[templateId];
    const data = [templateId, id];
    for(let field of template)
      typeof field === 'string' && data.push(o[field]);
    this._pushLog(data);
//    this._pushLog([templateId, id, ...template.map(field => o[field])]);
	},

  _assertValue(k, v){
    let id = this.values[k]?.[v];
    if(id !== undefined)
      return id;

    id = this.lastValueId++;
    this.values[k] = this.values[k] || Object.create(null);
    this.values[k][v] = id;
    this.valuesIndex[id] = [k, v];
    this._pushLog([VALUE, id, k, v]);
    return id;
  },

	findTemplate(o) {
    const template = [];
    for(let i in o)
      template.push(i in this.compressedFields ? this._assertValue(i, o[i]) : i);

		template.sort();

		const id = this.templates.findIndex(r => nice.deepEqual(r, template));
		if(id !== -1)
			return id;

		const newId = this.templates.length;
		this.templates.push(template);
    this._pushLog([TEMPLATE, newId, ...template]);
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
    const rows = m.rows;

		if(templateId === TEMPLATE){
			m.templates[id] = row.slice(2);
		} else if(templateId === DELETE){
      const oldData = rows[id];
      delete rows[id];
      _each(oldData, (v, k) => m.notifyIndexOneValue(id, k, undefined, v));
		} else if(templateId === COMPRESS){
      this.compressedFields[row[1]] = true;
		} else if(templateId === VALUE){
      const [,id, k, value] = row;
      this.values[k] = this.values[k] || Object.create(null);
      this.values[k][value] = id;
      this.valuesIndex[id] = [k, value];
		} else if(templateId >= 0){
      const create = id in rows ? false : true;
			if(create)
				rows[id] = { _id:id };
			const template = m.templates[templateId];

      let i = 2;
      const oldData = rows[id];
      for(const f of template){
        let field, value;
        if(typeof f === 'string'){
          field = f;
          value = row[i++];
        } else {
          [field, value] = this.valuesIndex[f];
        }
        const oldValue = oldData[field];
        oldData[field] = value;
				this.notifyIndexOneValue(id, field, value, oldValue);
        create || this.notifyOptions(id, field, value, oldValue);
        create || this.notifySorts(id, field, value, oldValue);
      }
//			row.slice(2).forEach((v, k) => {
//				const field = template[k];
//        const data = rows[id];
//        const oldValue = data[field];
//        data[field] = v;
//				this.notifyIndexOneValue(id, field, v, oldValue);
//        create || this.notifyOptions(id, field, v, oldValue);
//        create || this.notifySorts(id, field, v, oldValue);
//			});
			if(id in this.rowBoxes)
				this.rowBoxes[id](rows[id]);
		} else {
      throw 'Incorect row id';
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

  addOptions(field, options) {
    (this.options[field] ??= []).push(options);
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
		compressedFields: Object.create(null),
		values: Object.create(null),
		valuesIndex: [],
		lastValueId: 0,
		rows: [],
		log: [],
		indexes: {},
		rowBoxes: {},
		filters: {},
    sortResults: {},
    options: {},
		logSubscriptions: [],
    filterCounter: 0,
    compositQueries: {},
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


function match(q, row) {
  for(let k in q)
		if(row[k] !== q[k])
			return false;
	return true;
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


function createOptions(filter, field){
  const res = nice.BoxMap();
  const model = filter.model;
  model.addOptions(field, res);

//  res.sortByValue = once(() => {
//    return ;
//  });
//  res.sortByCount = once(() => );

  const add = value => {
    if(value !== undefined){
      const count = res.get(value) || 0;
      res.set(value, count + 1);
    }
  };

  const remove = value => {
    if(value !== undefined){
      const count = res.get(value) || 0;
      const newCount = count - 1;
      newCount ? res.set(value, count - 1) : res.delete(value);
    }
  };

  res.considerChange = (id, newValue, oldValue) => {
    if(filter.has(id)){
      remove(oldValue);
      add(newValue);
    }
  };

  filter.subscribe((id, oldId) =>
    id ? add(model.get(id)?.[field]) : remove(model.get(oldId)?.[field]));

  return res;
};


nice.Type({
  name: 'RowsFilter',
  extends: 'BoxSet',
  initBy: (z, model) => {
    z.super();
    z.model = model;
    z.sortsAsc = memoize(field => nice.SortResult(z, field, 1));
    z.sortsDesc = memoize(field => nice.SortResult(z, field, -1));
    z.options = memoize(field => createOptions(z, field));
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

    z.sortValueFunction = direction > 0
      ? (a, bv) => rows[a][field] > bv ? 1 : -1
      : (a, bv) => rows[a][field] > bv ? -1 : 1;

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
    considerChange(id, newValue, oldValue) {
      //TODO: optimize
//      console.log(s.query.has(id));
      const oldPosition = this._value.indexOf(id);
      if(oldPosition === -1 && (newValue === undefined || newValue !== null))
        return;

//      const position = sortedPosition(this._value, id, this.sortFunction);
      const position = sortedPosition(this._value, newValue, this.sortValueFunction);
      if(oldPosition === position)
        return;

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


const ops = {
  eq: { arity: 2, f: (a, b) => a === b }
};

const newFilter = (model, q) => {
  const { field, opName, value } = q;
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

const ffff = () => {
//  const record = { type: 'translation', word: 8453, translation: 'went' };
//
//  const oldTemplate = ['type', 'word', 'translation'];
//  const oldRow = ['translation', 8453, 'went'];
//
//  db.compressField('type');
//  const newTemplate = [{type: 'translation'}, 'word', 'translation'];
//  const newRow = [8453, 'went'];
//  // or
//  const newTemplate = ['word', 'translation'];
//  const newValue = [type, 'translation'];
//  const newTemplateWithValue = [newTemplate, newTemplateValue];
//
//  ///or
//  db.compressField('type');
//  const valueLog = [1, {type: 'translation'}];
//
//  const newTemplate = ['word', 'translation'];
//  const newRow = [8453, 'went', 1];
//
//  const newTemplate = [1, 'word', 'translation'];
//  const newRow = [8453, 'went'];
};