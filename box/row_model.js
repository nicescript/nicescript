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
		const templateId = this.findTemplate(o);
		
		const id = this.rows.length;
		this.lastId = id;
		this.rows.push(o);
		this.writeLog(id, o);
		return id;
	},
	get(id) {
		return this.rows[id];
	},
	change(id, o){
		//check id
		//check object
		Object.assign(this.rows[id], o);
		this.writeLog(id, o);
	},
	writeLog(id, o) {
		this.version = this.log.length;
		this.log.push([this.findTemplate(o), id, ...Object.values(o)]);
	},
	findTemplate(a) {
		if(!Array.isArray(a))
			a = Object.keys(a);
		a.sort();
		const id = this.templates.findIndex(r => nice.deepEqual(r, a));
		if(id !== -1)
			return id;
			this.templates.push(a);
		return this.templates.length - 1;
	},
};

function RowModel(){
	return create(proto, {
		lastId: -1,
		templates: [],
		templateMap: {},
		rows: [],
		log: []
	});
}

function loadFromFile(file, cb) {
	
};

Test(() => {
	const m = RowModel();
	const o = {name:'Joe'};
	const joeId = m.add(o);
		
	Test(() => {
		expect(m.get(joeId)).deepEqual(o);
		console.log(m.log);
		console.log(m.templates);
	});
	
	Test(() => {
		m.change(joeId, {addres:"Home"});
		expect(m.get(joeId)).deepEqual({name:'Joe',addres:"Home"});
		console.log(m.log);
		console.log(m.templates);
	});

});



