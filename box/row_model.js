const api = {
	change: {
		add: () => {},
		change: () => {},
		transaction: () => {},
	},
	get: {
		row: () => {},
		filter: () =>	{}
	},
};

const proto = {
	add(o) {
		checkObject(o);
		const id = this.rows.length;
		this.lastId = id;
		this.rows.push(o);
		this.writeLog(id, o);
		if(id in this.rowBoxes)
			this.rowBoxes[id](this.rows[id]);
		this.notifyFilters(id, o);
		return id;
	},
	
	notifyFilters(id, newValues, oldValues) {
		const ff = this.filters;
		_each(newValues, (v, k) => {
			if(!(k in ff))
				return;
			_each(ff[k], (map, operation) => {
				if(operation === 'eq'){
					if(oldValues !== undefined){
						if (v === oldValues[v])
							return;
						if(map.has(oldValues[k]))
							map.get(oldValues[k]).removeValue(id);
					}
					if(map.has(v))
						map.get(v).push(id);
				} else {
					throw 'Operation ' + operation + " not supported.";
				}
			});
		});	
	},
	
	notifyFiltersOneValue(id, k, newValue, oldValue) {
		const ff = this.filters;
		if(newValue === oldValue)
			return;
		
		if(!(k in ff))
			return;
		
		_each(ff[k], (map, operation) => {
			if(operation === 'eq'){
				if(map.has(oldValue))
					map.get(oldValue).removeValue(id);
				if(map.has(newValue))
					map.get(newValue).push(id);
			} else {
				throw 'Operation ' + operation + " not supported.";
			}
		});
	},
	
	get(id) {
		return this.rows[id];
	},
	
	filter(...f) {
		const res = [];
		this.rows.forEach((row, id) => matchFilter(f, row) && res.push(id));
		return res;
	},
	
	change(id, o){
		checkObject(o);
		//check id
		//check object
		this.notifyFilters(id, o, this.rows[id]);
		Object.assign(this.rows[id], o);
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
	
	filterBox(...ff) {
		if(ff[1])
			throw 'TODO:';
		
		const f = ff[0];
		const [field, value, operation = 'eq'] = f;
		expect(field).isString();
		expect(operation).isString();
		
		if(!(field in this.filters))
			this.filters[field] = {};
		
		if(!(operation in this.filters[field]))
			this.filters[field][operation] = new Map();
		
		const opFilters = this.filters[field][operation];
		if(!opFilters.has(value))
			opFilters.set(value, nice.BoxArray(this.filter(f)));
		
		return opFilters.get(value);
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
				this.notifyFiltersOneValue(id, field, v, m.rows[id][field]);
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
	return create(proto, {
		lastId: -1,
		templates: [],
		rows: [],
		log: [],
		rowBoxes: {},
		filters: {},
		logSubscriptions: []
	});
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


function matchFilter(ff, row){
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


Test(() => {
	const m = RowModel();
	const o = {name:'Joe'};
	const joeId = m.add(o);
	const janeId = m.add({name:"Jane"});
		
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
		expect(m.get(joeId)).deepEqual({name:'Joe',address:"Home"});
//		console.log(m.log);
//		console.log(m.templates);
	});

	Test(() => {
		const res = m.filter(["address","Home"]);
//		expect(res).deepEqual({0:{name:'Joe',address:"Home"}});
		expect(res).deepEqual([0]);
		expect(m.filter(["address",'Street'])).deepEqual([]);
	});

	Test(() => {
		const m2 = RowModel.fromLog(m.log);
		expect(m2.get(joeId)).deepEqual({name:'Joe',address:"Home"});
//		console.log(m2.log);
//		console.log(m2.rows);
//		console.log(m2.templates);
	});
	
	Test((Spy) => {
		const b = m.rowBox(joeId);
		expect(b()).deepEqual(m.get(joeId));
		
		const spy = Spy();
		b.subscribe(spy);
		m.change(joeId, {address:'Home2'});
		expect(spy).calledTwice();
	});

	Test((Spy) => {
		const spy = Spy();
		const res = m.filterBox(['address','Home2']);
		res.subscribe(spy);
		expect(spy).calledWith(joeId);
		const jimId = m.add({address:"Home2"});
		expect(spy).calledWith(jimId);
		m.change(jimId, {address:"Home3"});
		expect(spy).calledWith(null, null, 2, 1);
	});
});



