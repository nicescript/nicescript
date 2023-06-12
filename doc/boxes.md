State management with boxes
===========

Boxes are stateful observable components. 

#### Box
Simple container for single value.

```javascript
const { Box, Spy } = nice;
const b = Box(1);     // create box with 1 in it
const spy = Spy();
b.subscribe(spy);
expect(spy).calledWith(1);

b(2);                 // write value
expect(spy).calledWith(2);

const v = b();        // read value
expect(v).is(2);     
```

#### RBox
Reactive container that follows states of one or more boxes.

```javascript
const { Box, RBox, Spy } = nice;
const b1 = Box(1);
const b2 = Box(2);
const spy = Spy();

const sum = RBox(b1, b2, (a, b) => a + b);
expect(sum()).is(3);

sum.subscribe(spy);
expect(spy).calledWith(3);

b1(11);
expect(spy).calledWith(13);

//you can use RBox as a source
const mul = RBox(sum, x => x * 2);
expect(mul()).is(26);

b1(111);
expect(mul()).is(226);
```


#### BoxSet
Observable set of unique values.

```javascript
const { BoxSet, Spy, expect } = nice;

const b = nice.BoxSet([1]);
const spy = Spy();

b.subscribe(spy);
expect(spy).calledWith(1);

expect(spy).calledOnce();
b.add(1);
expect(spy).calledOnce();

expect(b.has(1)).is(true);
expect(b.has('1')).is(false);

b.delete(1);
expect(b.has(1)).is(false);
expect(spy).calledWith(null, 1);

```


#### BoxMap
Observable map of values.
```javascript
const { BoxMap, Spy, expect } = nice;

const m = BoxMap();
const spy = Spy();
m.set('a', 1);
m.subscribe(spy);
expect(spy).calledWith(1, 'a');

m.set('z', 3);
expect(spy).calledWith(3, 'z');

m.set('a', null);
expect(spy).calledWith(null, 'a');
expect(m()).deepEqual({z:3});
```


#### BoxArray
Observable array of values.
```javascript
const { BoxArray, Spy, expect } = nice;
const a = BoxArray([1,2]);
const spy = Spy();

a.subscribe(spy);
expect(spy).calledWith(1, 0, null, null);
expect(spy).calledWith(2, 1, null, null);

a.set(0, 3);
expect(spy).calledWith(3, 0, 1, 0);
expect(a()).deepEqual([3,2]);

a.insert(1, 4);
expect(spy).calledWith(4, 1, null, null);
expect(a()).deepEqual([3,4,2]);

a.push(5);
expect(spy).calledWith(5, 3, null, null);
expect(a()).deepEqual([3,4,2,5]);
```
