const data = {
  userInfo: {
    words: {
      the: {status:1, date: 2},
      in: {status:3, date: 5}
    }
  }
};


const listeners = {
  userInfo: {
    '@listeners': [],
    words: {
      '@listeners': [],
      the: {
        '@listeners': [v => someRef.updateView(v)]
      }
    }
  }
};

const app = App();

app.Action('changeStatus', (word, status) => {
  app.set('userInfo', 'words', word, 'status', status);
  app.set('userInfo', 'words', word, 'date', Date.now());
});

app.Action('changeStatus', (word, status) => {
  const set = app.set.userInfo.words[word];
  set('status', status)
  set('date', Date.now())
});


app.Action('changeStatus', (word, status) => {
  const lens = app.userInfo.words[word];
  lens.set('status', status)
  lens.set('date', Date.now())
});


patch({userInfo:{words:{the:{status:2}}}});