class ColumnStorage {
  constructor (...columns) {
    this.data = {};
    this.defaultBy = {};
    this.defaults = {};
    this.size = 0;
    this.lastId = 0;
    columns.forEach(c => this.addColumn(c));
  }

  addColumn (cfg) {
    if(typeof cfg === 'string'){
      cfg = { name: cfg };
    }
    const { name, defaultValue, defaultBy } = cfg;

    if(typeof cfg.name !== 'string')
      throw 'Bad column name: ' + name;

    if(blackList.includes(cfg.name))
      throw 'Forbiden column name: ' + name;

    if(this.data.hasOwnProperty(name))
      throw name + ' busy.';

    if(defaultBy !== undefined && defaultValue !== undefined)
      throw `Can't have defaultBy and defaultValue at the same time.`;

    this.defaultBy[name] = defaultBy;
    this.defaults[name] = defaultValue;
    this.data[name] = {};
    return this;
  }


  iterate (f, q) {
    for(let i = 0; i <= this.lastId; i++){
      if((!q || this.match(i, q)) && f(i) === null)
        return;
    }
    return null;
  }

  match (i, q){
    let res = true;
    const data = this.data;
    nice._each(q, (v, k) => {
      if(typeof v === 'function')
        res &= v(data[k][i]);
      if(Array.isArray(v))
        res &= v.includes(data[k][i]);
      else
        res &= data[k][i] === v;
    });
    return res;
  }

  findKey (q) {
    let res = null;
    this.iterate(i => { res = i; return null; }, q);
    return res;
  }

  findKeys (q) {
    const a = [];
    this.iterate(i => a.push(i), q);
    return a;
  }

  getValue (id, column) {
    let value = this.data[column][id];

    if(value === undefined){
      const by = this.defaultBy[column];
      if(by !== undefined){
        value = by(id);
        this.update(id, column, value);
      } else {
        value = this.defaults[column];
      }
    }

    return value;
  }

  hasValue (id, column) {
    return id in  this.data[column];
  }

  getRow (i) {
    if(i >= this.lastId)
      return null;
    const res = {};
    nice._each(this.data, (v, k) => {
      res[k] = v[i];
    });
    return res;
  }

  findRow (q) {
    throw 'TODO:';
  }

  findRows (q) {
    throw 'TODO:';
  }

  push (row) {
    const id = ++this.lastId;
    this.size++;
    _each(row, (v, k) => {
      this.data[k][id] = v;
      this.emit(k, id, v);
    });
    this.emit('insert', id, row);
    return this;
  }

//  assertRow (row) {
//    let key = this.findKey(row);
//
//    if(key !== null)
//      return key;
//
//    return this.push(row).size - 1;
//  }

  update (i, k, v) {
    if(typeof k === 'object'){
      _each((_v, _k) => this.update(_k, _v));
      return this;
    }

    if(i > this.lastId)
      throw 'No such id ', i;

    const old = this.data[k][i];

    if(old !== v){
      if(v === null){
        delete this.data[k][i];
      } else {
        this.data[k][i] = v;
      }
      this.emit(k, i, v, old);
      this.emit('update', i, k, v, old);
    }
    return this;
  }

  increment (i, k, v) {
    expect(v).isNumber();
    const old = this.data[k][i] || 0;
    expect(old).isNumber();
    this.update(i, k, old + v);
  }

  restore (data) {
    this.data = data;
    this.size = data[Object.keys(data)[0]].length;
  }

  delete (id) {
    const row = [];
    _each(this.data, (v, k) => {
      if(id in v){
        row.push(k);
        this.emit(k, id, null, v[id]);
      }
    });
    row.forEach(k => {
      delete this.data[k][id];
    });
    this.size--;
    this.emit('delete', id);
  }
}

nice.create(nice.EventEmitter, ColumnStorage.prototype);


const blackList = ['update', 'push', 'insert', 'ready'];

const db = new ColumnStorage(
  '_type',
  '_cellType',
  '_value',
  '_parent',
  '_name',
  '_listeners',
  '_itemsListeners',
  '_deepListeners',
  '_links',
  '_by',
  '_args',
  {name: '_status', defaultValue: 'cooking' },
  {name: '_size', defaultValue: 0 },
  {name: '_children', defaultBy: () => ({}) },
  {name: '_order', defaultBy: () => [] },
  {name: '_subscriptions', defaultBy: () => [] },
  {name: 'cache', defaultBy: nice._getItem }
);

def(nice, '_db', db);


db.on('_value', notifyItem);


function notifyItem(id, value, oldValue) {
  const z = db.getValue(id, 'cache');

  const ls = db.getValue(id, '_listeners');
  //TODO: oldValue
//  ls && ls.forEach(f => notifyItem(f, z));
  ls && ls.forEach(f => f(z));

  const links = db.getValue(id, '_links');
  links && links.forEach(notifyItem);

  const parentId = db.getValue(id, '_parent');
  if(parentId !== undefined){
    const ls = db.getValue(parentId, '_itemsListeners');
    const name = db.getValue(id, '_name');
    ls && ls.forEach(f => f(z, name));
  }

  let nextParentId = parentId;
  let path = [];
  //TODO: protection from loop
  while(nextParentId !== undefined){
    path.unshift(nextParentId);

    const ls = db.getValue(nextParentId, '_deepListeners');
    ls && ls.forEach(f => f(z, path));

    const links = db.getValue(nextParentId, '_links');
    //TODO: test
    links && links.forEach(link => notifyItem(db.getValue(link, 'cache').getDeep(...path)._id));

    nextParentId = db.getValue(nextParentId, '_parent');
  }
}


db.on('_type', (id, value, oldValue) => {
  if(!oldValue || oldValue === NotFound){
    const pId = db.getValue(id, '_parent');
    db.update(pId, '_size', db.getValue(pId, '_size') + 1);
  } else if (!value || value === NotFound){
    const pId = db.getValue(id, '_parent');
    db.update(pId, '_size', db.getValue(pId, '_size') - 1);
  }
});


db.on('_name', (id, value, oldValue) => {
  const parent = db.getValue(id, '_parent');
  const index = db.getValue(parent, '_children');
  if(oldValue !== null && oldValue !== undefined)
    delete index[oldValue];
  if(value !== null && value !== undefined)
    index[value] = id;
});
