const { _eachEach, _pick, once, clone, memoize, sortedPosition, Box } = nice;

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
  startTransaction(){
    if(this.transaction)
      throw 'Already in transaction';
    this.transaction = { rows: {} };
  },

  endTransaction(){
    if(!this.transaction)
      throw 'No transaction to end';
    const tr = this.transaction;
    delete this.transaction;
    _each(tr.rows, (vs, id) => {
      const newVs = nice._pick(this.rows[id], Object.keys(vs));
      this._updateMeta(+ id, newVs, vs);
    });
  },

	add(o) {
		checkObject(o);
		const id = this.rows.length;
		this.lastId = id;
    const row = clone(o);
		this.rows.push(row);
		this.writeLog(id, row);
    this._newRow(id, row);
		return id;
	},

  _newRow(id, row){
    row._id = id;
    this.ids && this.ids.add(id);
    this._updateMeta(id, row);
  },

  _find(o) {
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
    return res;// instanceof Set ? firstOfSet(res) : res;
  },

  find(o){
    const res = this._find(o);
    return res instanceof Set ? firstOfSet(res) : res;
  },

  findAll(o){
    const res = this._find(o);
    if(res === null)
      return new Set();
    return res instanceof Set ? res : new Set([res]);
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
    if(this.loading)
      throw `Can't write while loading`;
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

    const o = {};
    _each(data, (v, k) => o[k] = undefined);
    this._updateMeta(id, o, data);
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

  _changeOptions(filter, newData, oldData){
    _each(filter.options.cache, (ops, field) => {
      if(field in newData && newData[field] !== oldData?.[field]){
        ops.remove(oldData?.[field]);
        ops.add(newData[field]);
      }
    });
  },

  _updateMeta(id, newData, oldData){
    if(typeof id !== 'number')
      throw new Error(`Wrong block id type: ` + typeof id);

    const tr = this.transaction;
    if(tr){
      if(!(id in tr.rows)){
        tr.rows[id] = tr.rows[id] || {};
        _each(newData, (v, k) => {
          tr.rows[id][k] = oldData?.[k];
        });
      }
      return;
    }
    const rowData = this.rows[id];
    this.ids && this._changeOptions(this.ids, newData, oldData);

    _each(newData, (v, k) => {
      const oldV = oldData?.[k];
      this.notifyIndexOneValue(id, k, v, oldV);

      const outFilters = this.matchingFilters(k, oldV);
      const inFilters = this.matchingFilters(k, v);

      outFilters.forEach(f => {
        if(inFilters.includes(f)) {//still match filter
          this._changeOptions(f, newData, oldData);
        } else {
          f.delete(id);
          _each(f.options.cache, (ops, field) => ops.remove(oldData?.[field]));
        }
      });
      inFilters.forEach(f => {
        if(!outFilters.includes(f)){
          f.add(id);
          _each(f.options.cache, (ops, field) => ops.add(rowData[field]));
        }
      });

    });

    //fields that not changed by update but their options might
    _each(rowData, (v, k) => {
      if(k in newData) return;
      const ff = this.matchingFilters(k, v);
      ff.forEach(f => this._changeOptions(f, newData, oldData));
    });

    this.notifyAllSorts(id, newData, oldData);
    if(id in this.rowBoxes)
			this.rowBoxes[id](rowData);
  },

	notifyIndexOneValue(id, field, newValue, oldValue) {
		const ff = this.filters;
		if(newValue === oldValue)
			return;

		const index = this.assertIndex(field);
    oldValue !== undefined && index.delete(oldValue, id);
    newValue !== undefined && index.add(newValue, id);
  },

	notifyAllSorts(id, newValues, oldValues) {
		_each(newValues, (v, field) => {
      this.notifySorts(id, field, v, oldValues?.[field]);
    });
	},

  notifySorts(id, field, newValue, oldValue){
    _each(this.sortResults[field], s => s.considerChange(id, newValue, oldValue));
  },

	get(id) {
		return this.rows[id];
	},

	change(id, o){
    if(!(id in this.rows))
      throw 'Row ' + id + " not found";

    _each(o, (v, k) => {
      if(!(isValidValue(v) || v === undefined))
        throw 'Invalid value ' + ('' + v) + ':' + typeof v;
    });
    this.writeLog(id, o);
    const oldRow = this.rows[id];
    const newRow = this.rows[id] = {};
    _each(oldRow, (v, k) => k in o || (newRow[k] = v));
    _each(o, (v, k) => v === undefined || (newRow[k] = v));
    this._updateMeta(id, o, oldRow);
	},

	writeLog(id, o) {
		const templateId = this.findTemplate(o);
		const template = this.templates[templateId];
    const data = [templateId, id];
    for(let field of template)
      typeof field === 'string' && data.push(o[field]);
    this._pushLog(data);
	},

  _assertValue(k, v){
    let id = this.values[k]?.[v];
    if(id !== undefined)
      return id;

    id = this.valuesIndex.length;
    this.valuesIndex[id] = [k, v];

    this.values[k] = this.values[k] || Object.create(null);
    this.values[k][v] = id;
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
			this.rowBoxes[id] = Box(this.rows[id]);
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
      const newData = z._decodeTemplate(row);

      if(create) {
        rows[id] = newData;
        z._newRow(id, newData);
        z.lastId = id;
      } else {
        const newRow = rows[id] = {};
        _each(oldData, (v, k) => k in newData || (newRow[k] = v));
        _each(newData, (v, k) => v === undefined || (newRow[k] = v));
      }
      z._updateMeta(id, newData, oldData);
		} else {
      throw 'Incorect row id';
    }
		z.log.push(row.slice());
    this.logSubscriptions.forEach(f => f(row, this.version));
    z.version++;
	},

  _decodeTemplate(row){
    const templateId = row[0];
    const template = this.templates[templateId];
    const data = {};
    let i = 2;
    for(const f of template){
      let field, value;
      if(typeof f === 'string'){
        field = f;
        value = row[i++];
      } else {
        [field, value] = this.valuesIndex[f];
      }
      data[field] = value;
    };
    return data;
  },

	subscribeLog(f) {
		this.logSubscriptions.add(f);
	},

	unsubscribeLog(f) {
		this.logSubscriptions.delete(f);
	},

  addSortResult(field, sortResult) {
    (this.sortResults[field] ??= []).push(sortResult);
  },

  addOptions(field, options) {
    (this.options[field] ??= []).push(options);
  },

  readOnly() {
    ['add', 'change', 'delete'].forEach(a => this[a] = () => { throw "This model is readonly"; });
  },

  assertIds(){
    if(!this.ids){
      this.ids = nice.BoxSet();
      this.rows.forEach((_, id) => this.ids.add(id));
      this.ids.options = memoize(field => nice.FilterOptions(this, this.ids, field));
    }
    return this.ids;
  },

  errorBox(){
    return this.error;
  }
};

function RowModel(){
  const res = create(proto, {
    loading: false,
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
    error: Box(),
	});

  function extractOp(o, field) {
    if(o === null)
      return { field, opName: 'null' };

    const [opName, value] = Object.entries(o)[0];
    return { opName, value, field };
  }


  res.history = memoize(id => {
    const check = r => r[1] === id && r[0] > 0;
    const map = r => res._decodeTemplate(r);
    const h = BoxArray(res.log.filter(check).map(map));
    res.subscribeLog(r => check(r) && h.push(map(r)));
    return h;
  });


//    filter({adress: 'home', gender: "male" });
//    filter({adress: 'home', age: { gt: 16 } });
//    filter([{adress: 'home'}, { age: { gt: 16 } }]);
//TODO:    filter( jane ); //full-text
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


nice.Type({
  name: 'FilterOptions',
  extends: 'BoxMap',
  initBy: (z, model, filter, field) => {
    z.super();
    z.filter = filter;
    model.addOptions(field, z);
    //TODO: use indexes in case of empty filter
    filter().forEach(id => z.add(model.rows[id]?.[field]));
  },
  proto: {
    coldCompute(){

    },
    warmUp(){
//      const { model, field } = this;
//      this.filter.subscribe((id, oldId) =>
//        id !== null
//          ? this.add(model.get(id)?.[field])
//          : this.remove(model.get(oldId)?.[field]));
    },
    add(value){
      if(value !== undefined){
        const count = this.get(value) || 0;
        this.set(value, count + 1);
      }
    },

    remove(value){
      if(value !== undefined){
        const count = this.get(value) || 0;
        const newCount = count - 1;
        newCount ? this.set(value, count - 1) : this.delete(value);
      }
    },

    considerChange(id, newValue, oldValue) {
      if(this.filter.has(id)){
        this.remove(oldValue);
        this.add(newValue);
      }
    }
  }
});



//function createOptions(model, filter, field){
//  const res = nice.FilterOptions(model, filter, field);
//
//  return res;
//};


nice.Type({
  name: 'RowsFilter',
  extends: 'BoxSet',
  initBy: (z, model) => {
    z.super();
    z.model = model;
    z.sortAsc = memoize(field => nice.SortResult(z, field, 1));
    z.sortDesc = memoize(field => nice.SortResult(z, field, -1));
    z.options = memoize(field => nice.FilterOptions(model, z, field));
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
      //TODO: replace with binary search (need access to old value for that)
//      const i = sortedPosition(this._value, id, this.sortFunction);
//      this.remove(i);
      this.removeValue(id);
    },

    considerChange(id, newValue, oldValue) {
      //TODO: optimize
      const oldPosition = this._value.indexOf(id);
      if(oldPosition === -1 && (newValue === undefined || newValue !== null))
        return;

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