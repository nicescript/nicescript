Tests
===========


### Expect
```javascript
const { expect } = nice;

expect('qwe').isString();         //nothing happens
expect('qwe').not.isNumber();     //nothing happens
expect(() => ''.qwe()).throws();  //nothing happens

expect(42).isString();            //throws exception

```

### Custom checks
Every `Check` function registered with `nice` instance can be used with `expect`.

```javascript
const { expect, Check } = nice;

Check('isBig', n => n > 10);

expect(42).isBig();               //nothing happens
expect(2).isBig();                //throws exception

```

### Test set

```javascript
const { expect, TestSet } = nice;
const app = {};

// Create test set
const test = nice.TestSet(app);

app.x2 = x => x*2;

// Create test
test("Double value", (x2) => {    // x2 found in app 
  expect(x2(3)).is(6);
  
  // nested tests are ok
  test("Double mapping", (Spy) => { // no app.Spy found so nice.Spy provided
    const f = Spy(x2);
    expect([1,2].map(f)).deepEqual([2,4]);
    expect(f).calledTwice();
  })
});

test((intersperce) => {           //intersperce not found in app, but found in nice
  expect(intersperse([1,2], ';')).deepEqual([1,';',2]);
});

// Run tests
test.run();
//Tests done. OK: 3, Error: 0 (1ms)

```