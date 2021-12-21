//QUESTION: make rows of nice.Type
//TODO: use Model in todo example

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
          this.addKey(meta, key);
        }
        meta = meta?.children?.[key];
        target = target[key];
      }

      target[lastKey] = value;
      if(meta !== undefined) {
        this.notifyDown(meta, lastKey, value);
        this.addKeysDown(meta, lastKey, value);
      }
      this.notifyTop(path);
    },

    addKey (meta, key) {
      meta !== undefined && meta.keyListener !== undefined
          && meta.keyListener.set(key, 1);
    },

    addKeysDown (meta, key, value) {
      if(meta.keyListener !== undefined){
        meta.keyListener.set(key, 1);
      }

      const childMeta = meta?.children?.[key];
      if(meta === undefined  && typeof value !== 'object')
        return;

//      for(const k in value) {
//        if(k in childMeta.listeners)
//          ;
//      }
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

    getMeta (...path) {
      let meta = this._meta;
      for(const key of path) {
        if(!(key in meta.children)) {
          return;
        }
        meta = meta.children[key];
      }
      return meta;
    },

    assertMeta (...path) {
      let meta = this._meta;
      for(const key of path) {
        if(!(key in meta.children)) {
          meta.children[key] = { listeners: {}, keyListener: undefined, children: {} };
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
    },

    keyBox(...path){
      const meta = this.assertMeta(...path);
      if(!meta.keyListener){
        meta.keyListener = nice.BoxSet();
        const data = this.get(...path);
        if(typeof data === 'object')
          for(let i in data)
            meta.keyListener.set(i, 1);
      }
      return meta.keyListener;
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


Test((Model, keyBox, Spy) => {
  const m = Model();
  m.set('tasks', 7, 'text', 'Wash');

  const spy = Spy();
  const keys = m.keyBox('tasks');
  keys.subscribe(spy);
  expect(spy).calledWith(1, '7');

  m.set('tasks', 11, 'text', 'Go');
//  expect(spy).calledOnce();
  expect(spy).calledWith(1, '11');

  m.set('tasks', 11, 'text', 'Go');

});