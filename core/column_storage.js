class ColumnStorage {
  constructor (...columns) {
    this.data = {};
    this.defaults = {};
    this.size = 0;
    this.maxId = 0;
    columns.forEach(c => addColumn(this, c));
  }

  iterate (f, q) {
    for(let i = 0; i < this.size; i++){
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

  getRow (i) {
    if(i >= this.maxId)
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

  getDefault (i) {
    const v = this.defaults[i];
    return typeof v === 'function' ? v() : v;
  }

  push (row) {
    const id = ++this.maxId;
    this.size++;
    _each(row, (v, k) => {
      this.data[k] === undefined && addColumn(db, k);
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
    if(i > this.maxId)
      throw 'No such id ', i;

    const old = this.data[k][i];

    if(old !== v){
      this.data[k][i] = v;
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
}

nice.create(nice.EventEmitter, ColumnStorage.prototype);


const blackList = ['update', 'push', 'insert', 'ready'];

function addColumn (storage, cfg) {
  if(typeof cfg === 'string'){
    cfg = { name: cfg };
  }
  const { name, defaultValue } = cfg;

  if(typeof cfg.name !== 'string')
    throw 'Bad column name: ' + name;

  if(blackList.includes(cfg.name))
    throw 'Forbiden column name: ' + name;

  if(storage.data.hasOwnProperty(name))
    throw name + ' busy.';

  storage.defaults[name] = defaultValue;
  storage.data[name] = {};
}

const db = new ColumnStorage();
def(nice, '_db', db);