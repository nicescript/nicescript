const { _eachEach, _pick, once, memoize, sortedPosition } = nice;

const TEMPLATE = -1;
const DELETE = -2;
const COMPRESS = -3;
const VALUE = -4;

//const api = {
//	change: {
//		add: () => {},
//		assert: () => {},
//		find: () => {},
//		change: () => {},
//		transaction: () => {},
//	},
//	get: {
//		row: () => {},
//		filter: () =>	{}
//	},
//};

const proto = {
//TODO: ?? dont store itemId|templateId in log

	add(o) {
		checkObject(o);
		const id = this.rows.length;
		this.lastId = id;
		this.rows.push(o);
		this.writeLog(id, o);
    o._id = id;
    this.ids && this.ids.add(id);
		this.notifyIndexes(id, o);
		if(id in this.rowBoxes)
			this.rowBoxes[id](this.rows[id]);
		return id;
	},

  find(o) {
    let res = null;

    for(let k in o) {
      const v = o[k];
      if(!this.indexes[k])
        return null;

      const map = this.indexes[k]._value;
      if(!map.has(v))
        return null;

      const kk = map.get(v);
      if(res === null){
        res = kk;
      } else {
        if(kk instanceof Set) {
          if(res instanceof Set){
            res = intersectSets(kk, res);
          } else {
            if(!kk.has(res))
              return null;
          }
        } else {
          if(res instanceof Set){
            if(!res.has(kk))
              res = kk;
          } else {
            if(kk !== res)
              return null;
          }
        }
      }
    }
    return res instanceof Set ? firstOfSet(res) : res;
  },

  assert(o) {
    const id = this.find(o);
    return id === null ? this.add(o) : id;
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
    expect(this.version).isNumber();
		this.logSubscriptions.forEach(f => f(row, this.version));
    this.version = this.log.length;
  },

  delete(id) {
    this._pushLog([DELETE, id]);
    const data = this.rows[id];
    delete this.rows[id];

    this.ids && this.ids.delete(id);
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
    let old;

    if(!(id in this.rows))
      throw 'Row ' + id + " not found";

    _each(o, (v, k) => {
      if(!(isValidValue(v) || v === undefined))
        throw 'Invalid value ' + ('' + v) + ':' + typeof v;
    });
    this.writeLog(id, o);
    const row = this.rows[id];
    old = _pick(row, Object.keys(o));
    _each(o, (v, k) => v === undefined ? delete row[k] : row[k] = v);
    _each(o, (v, k) => this.notifyIndexOneValue(id, k, v, old[k]));

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
		const z = this;
		const templateId = row[0];
		const id = row[1];
    const rows = z.rows;

		if(templateId === TEMPLATE){
			z.templates[id] = row.slice(2);
		} else if(templateId === DELETE){
      const oldData = rows[id];
      delete rows[id];
      z.ids && z.ids.delete(id);
      _each(oldData, (v, k) => z.notifyIndexOneValue(id, k, undefined, v));
		} else if(templateId === COMPRESS){
      z.compressedFields[row[1]] = true;
		} else if(templateId === VALUE){
      const [,id, k, value] = row;
      z.values[k] = z.values[k] || Object.create(null);
      z.values[k][value] = id;
      z.valuesIndex[id] = [k, value];
		} else if(templateId >= 0){
      const create = id in rows ? false : true;
      const oldData = rows[id];
			if(create){
				rows[id] = { _id: id };
        z.ids && z.ids.add(id);
        z.notifyIndexOneValue(id, '_id', id);
      }
			const template = z.templates[templateId];

      let i = 2;
      for(const f of template){
        let field, value;
        if(typeof f === 'string'){
          field = f;
          value = row[i++];
        } else {
          [field, value] = z.valuesIndex[f];
        }
        const oldValue = create ? undefined : oldData[field];
        rows[id][field] = value;
				z.notifyIndexOneValue(id, field, value, oldValue);
        create || z.notifyOptions(id, field, value, oldValue);
        create || z.notifySorts(id, field, value, oldValue);
      }
			if(id in z.rowBoxes)
				z.rowBoxes[id](rows[id]);
		} else {
      throw 'Incorect row id';
    }
		z.log.push(row.slice());
    z.version++;
	},

	subscribeLog(f) {
//		if(this.logSubscriptions.includes(f))
//			return;
		this.logSubscriptions.add(f);
	},

	unsubscribeLog(f) {
//		if(this.logSubscriptions.includes(f))
//			return;
		this.logSubscriptions.delete(f);
	},

  addSortResult(field, sortResult) {
    (this.sortResults[field] ??= []).push(sortResult);
  },

  addOptions(field, options) {
    (this.options[field] ??= []).push(options);
  },

  readOnly() {
    ['add', 'change'].forEach(a => this[a] = () => { throw "This model is readonly"; });
  },

  assertIds(){
    if(!this.ids){
      this.ids = nice.BoxSet();
      this.rows.forEach((_, id) => this.ids.add(id));
    }
    return this.ids;
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
		logSubscriptions: new Set(),
    filterCounter: 0,
    compositQueries: {},
	});

  function extractOp(o, field) {
    if(o === null)
      return { field, opName: 'null' };

    const [opName, value] = Object.entries(o)[0];
    return { opName, value, field };
  }


//    filter({adress: 'home', gender: "male" });
//    filter({adress: 'home', age: { gt: 16 } });
//    filter([{adress: 'home'}, { age: { gt: 16 } }]);
//TODO:    filter({ jane }); //full-text
//TODO: filter() | filter({})
  res.filter = function(o = {}) {
    const entities = Object.entries(o);
    if(!entities.length)
      return this.assertIds();

    const f = ([field, q]) => typeof q === 'object'
      ? extractOp(q, field)
      : { field, opName: 'eq', value: q };
    const qs = Array.isArray(o)
      ? o.map(v => f(Object.entries(v)[0]))
      : entities.map(f);

    const filters = qs.map(q => newFilter(res, q))
        .sort((a, b) => a._sortKey - b._sortKey);

    while(filters.length > 1){
      const f = filters.shift();
      const f2 = filters[0];

      const key = f._sortKey + '+' + f2._sortKey;
      filters[0] = res.compositQueries[key] ||
        (res.compositQueries[key] = f.intersection(f2));
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
    z.sortAsc = memoize(field => nice.SortResult(z, field, 1));
    z.sortDesc = memoize(field => nice.SortResult(z, field, -1));
    z.options = memoize(field => createOptions(z, field));
  }
});

nice.Mapping.RowsFilter.String('sort', (filter, field, direction = 1) => {//'asc'
  return filter[direction > 0 ? 'sortAsc' : 'sortDesc' ](field);
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

    z.take = memoize((a, b) => z.window(a, b), (a, b) => a + '_' + b);

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
  'null': { arity: 1, f: a => a === undefined },
  eq: { arity: 2, f: (a, b) => a === b },
  startsWith: { arity: 2, f: (a, b) => {
    if(a === undefined || a === null)
      return false;
    return ('' + a).toLowerCase().startsWith(b);
  }}
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


function intersectSets(a , b){
  const res = new Set();
  for (const item of a) {
    b.has(item) && res.add(item);
  }
  return res;
}


function firstOfSet(set){
  for (const item of set) {
    return item;
  }
  return null;
}