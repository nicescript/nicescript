nice.Type({
  name: 'BoxSortedMap',
  extends: 'BoxArray',
  initBy (z, vs, f) {
    expect(vs).isBoxArray();

    const map = vs();

    if(f === 'value') {
      f = (k1, k2) => map[k1] > map[k2] ? 1 : -1;
    } else if ('key') {
      f = (k1, k2) => k1 > k2 ? 1 : -1;
    } else {
      f = (k1, k2) => f(k1, map[k1]) > f(k2, map[k2]) ? 1 : -1;
    };

    z.vs = vs;
    z.f = f;
  },

  customCall: (z, ...as) => {
    throw `Use access methods`;
  },

  proto: {
    coldCompute(){
      this._value = Object.keys(this.vs()).sort(this.f);
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
