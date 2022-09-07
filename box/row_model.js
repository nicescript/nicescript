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
	add() {
		
	}
}

function RowModel(){
	return create(proto, {
		log: []
	});
}

function loadFromFile(file, cb) {
	
};

Test(() => {
	const m = RowModel();
});


