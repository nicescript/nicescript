const { orderedStringify, memoize, Box, BoxArray } = nice;

nice.Type({
  name: 'RowModelProxy',
  extends: 'DataSource',
  initBy(z, subscribe){
    z.subscribe = subscribe;
    z.filters = {};

    let error;
    z.errorBox = () => {
      if(!error){
        error = Box();
        z.subscribe([{action: 'errorBox', args: []}], r => error(r));
      }
      return error;
    };

    z.filter = memoize(o => nice.RowModelFilterProxy(o, z), JSON.stringify);
    z.rowBox = memoize(id => {
      const res = Box();
      z.subscribe([{action: 'rowBox', args: [id] }], (aa) => res(aa[0]));
      return res;
    });
    z.history = memoize(id => {
      const res = BoxArray();
      const f = BoxArray.subscribeFunction(res);
      z.subscribe([{action: 'history', args: [id] }], r => f(...r));
      return res;
    });
  },
  proto: {
  }
});

nice.Type({
  name: 'RowModelFilterProxy',
  extends: 'BoxSet',
  initBy(z, query, model){
    z.super();
    const q = [{action: 'filter', args: [ query ] }];

    z.warmUp = () => {
      model.subscribe(q, ([v, oldV]) => v === null ? z.delete(oldV) : z.add(v));
    };

    z.sortAsc = memoize(field => nice.RowModelSortProxy(model, q, field, 1));
    z.sortDesc = memoize(field => nice.RowModelSortProxy(model, q, field, -1));
    z.options = memoize(field => {
      const res = BoxMap();
      res.warmUp = () => {
        model.subscribe([...q, {action: 'options', args: [field] }],
          ([v,k,oldV]) => res.set(k,v));
//          ([v,k,oldV]) => v === null ? res.delete(k) : res.set());
      };
      return res;
    });

  }
});

nice.Type({
  name: 'RowModelSortProxy',
  extends: 'BoxArray',
  initBy(z, model, prefix, field, direction){
    z.super();
    const action = direction > 0 ? 'sortAsc' : 'sortDesc';
    const q = [...prefix, { action , args: [field] }];

    z.warmUp = () => {
      const f = BoxArray.subscribeFunction(z);
      model.subscribe(q, r => f(...r));
    };

    z.take = memoize((a, b) => {
      const res = BoxArray();
      const q2 = [...q, {action: 'take', args: [a, b] }];
      const f = BoxArray.subscribeFunction(res);
      model.subscribe(q2, r => f(...r));
      return res;
    }, (a, b) => a + '_' + b);
  }
});

nice.Type({
  name: 'RowModelOtptionsProxy',
  extends: 'DataSource',
});