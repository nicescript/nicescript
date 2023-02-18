const { orderedStringify, memoize, Box, BoxArray } = nice;

nice.Type({
  name: 'RowModelProxy',
  extends: 'DataSource',
  initBy(z, subscribe){
    z.subscribe = subscribe;
    z.filters = {};
    z.filter = memoize(o => nice.RowModelFilterProxy(o, z), JSON.stringify);
    z.rowBox = memoize(id => {
      const res = Box();
      z.subscribe([{action: 'rowBox', args: id }], res);
      return res;
    });
  },
  proto: {
  }
});

nice.Type({
  name: 'RowModelFilterProxy',
  extends: 'BoxSet',
  initBy(z, args, model){
    z.super();
//    z.args = args;

    const q = [{action: 'filter', args }];
    model.subscribe(q, (v, oldV) => v === null ? z.delete(oldV) : z.add(v));

    z.sortAsc = memoize(field => nice.RowModelSortProxy(model, q, field, 1));
    z.sortDesc = memoize(field => nice.RowModelSortProxy(model, q, field, -1));
  }
});

nice.Type({
  name: 'RowModelSortProxy',
  extends: 'BoxArray',
  initBy(z, model, prefix, field, direction){
    z.super();
    const action = direction > 0 ? 'sortAsc' : 'sortDesc';
    const q = [...prefix, { action , args: field }];
    model.subscribe(q, BoxArray.subscribeFunction(z));
  }
});

nice.Type({
  name: 'RowModelOtptionsProxy',
  extends: 'DataSource',
});