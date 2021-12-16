//QUESTION: make rows of nice.Type
nice.Type({
  name: 'Model',

  extends: 'Something',

  initBy: z => {
    z._data = {};
    z._meta = { listeners: {}, children: {} };
  },

  proto: {
    set (...path) {
      const value = path.pop();
      let target = this._data;
      let meta = this._meta;
      const lastKey = path.pop();


      for(const key of path) {
        if(!(key in target)) {
          target[key] = {};
        }
        meta = meta?.children?.[key];
        target = target[key];
      }

      target[lastKey] = value;
      meta !== undefined && this.notifyDown(meta, lastKey, value);
      this.notifyTop(path);
    },

    notifyTop (path) {
      let meta = this._meta;
      let value = this._data;
      for(const key of path) {
        if(key in meta.listeners)
          meta.listeners[key](value[key]);

        if(!(key in meta.children)) {
          return;
        }
        meta = meta.children[key];
        value = value[key];
      }
    },

    notifyDown (meta, key, value) {
      if(meta.listeners[key])
        meta.listeners[key](value);

      if(typeof value !== 'object')
        return;

      const childMeta = meta.children[key];
      for(const k in value) {
        if(k in childMeta.listeners)
          this.notifyDown(childMeta, k, value[k]);
      }
    },


    get (...path) {
      let result = this._data;
//      const lastKey = path.pop();
      for(const key of path) {
        if(!(key in result)) {
          return undefined;
        }
        result = result[key];
      }
      return result;
    },

    assertMeta (...path) {
      let meta = this._meta;
      for(const key of path) {
        if(!(key in meta.children)) {
          meta.children[key] = { listeners: {}, children: {} };
        }
        meta = meta.children[key];
      }
      return meta;
    },

    getBox (...path) {
      const key = path.pop();
      const { listeners } = this.assertMeta(...path);
      if(!(key in listeners)) {
        listeners[key] = nice.Box(this.get(...path, key));
      }
      return listeners[key];
    }
  }
});


Test(Model => {
  const m = Model();
  m.set('tasks', 1, {text: 'Go'});
  expect(m.get('tasks', 1, 'text')).is('Go');
});


Test((Model, getBox) => {
  const m = Model();
  const b = m.getBox('tasks', 1, 'text');
  expect(b()).is(undefined);

  m.set('tasks', 1, 'text', 'Go');
  expect(b()).is('Go');

  m.set('tasks', 1, {text: 'Run'});
  expect(b()).is('Run');
});


Test('Notify up', (Model, getBox, Spy) => {
  const m = Model();
  let res;
  const spy = Spy(v => res = v);

  const b = m.getBox('tasks', 1);
  b.subscribe(spy);

  expect(b()).is(undefined);

  m.set('tasks', 1, 'text', 'Go');
  expect(spy).calledOnce();
  expect(res).deepEqual({text:'Go'});
});