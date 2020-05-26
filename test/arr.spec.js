const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;
const { Arr, Obj } = nice;

describe("Arr", function() {


  Test("filter", () => {
    const res = Arr(1, 2, 3, 4, 5).filter(n => n % 2 === 0);
    expect(res.jsValue).deepEqual([2,4]);
    expect(res.size).is(2);
  });


  Test("sortBy", () => {
    let a = Arr(4, 3, 5);
    expect(a.sortBy().jsValue).deepEqual([3,4,5]);
    expect(a.sortBy(v => -v).jsValue).deepEqual([5,4,3]);
  });


  Test("size", () => {
    expect(Arr(4, 3, 5).size).is(3);
    expect(Arr().size).is(0);
  });


  Test("class property", () => {
    const Car = nice.Type().arr('wheels')();
    const c = Car();
    c.wheels(16, 17);

    expect(c.wheels.jsValue).deepEqual([16, 17]);
  });


  Test("insertAt", () => {
    let a = Arr(1, 4);
    a.insertAt(1, 2);
    expect(a.jsValue).deepEqual([1, 2, 4]);
  });


  Test("insertAt subscription", (Spy) => {
    let a = Arr();
    const onAdd = Spy();
    a.listen({ onAdd });
    a.insertAt(0, 2);
    expect(onAdd).to.have.been.called();
  });


  Test("pop", () => {
    const a = Arr(1, 2);
    const b = a.pop();
    expect(b).is(2);
    expect(a.jsValue).deepEqual([1]);
  });


  Test("unshift", () => {
    let a = Arr(1, 4);
    a.unshift(2, 3);
    expect(a.jsValue).deepEqual([2, 3, 1, 4]);
  });


  Test("shift", () => {
    let a = Arr(1, 4);
    let b = a.shift();
    expect(a.jsValue).deepEqual([4]);
    expect(b).is(1);
  });


//  Test("add", () => {
//    let a = Arr(1, 4);
//    a.add(2, 1);
//    a.add(2, 1);
//    expect(a.jsValue).deepEqual([1, 4, 2]);
//  });


  Test("fill", () => {
    expect(Arr(1, 2, 3).fill(6).jsValue).deepEqual([6, 6, 6]);
    expect(Arr(1, 2, 3).fill(6, 1, 2).jsValue).deepEqual([1, 6, 3]);
    expect(Arr(1, 2, 3).fill(6, 1, 1).jsValue).deepEqual([1, 2, 3]);
    expect(Arr(1, 2, 3).fill(6, -3, -2).jsValue).deepEqual([6, 2, 3]);
  });


  Test("Symbol.iterator", () => {
    expect(() => [...Arr()]).not.to.throw();
  });


  Test("concat", () => {
    expect(nice(1, 2).concat([{qwe:1}])).deepEqual([1,2,{"qwe":1}]);
  });


  Test("sum", () => {
    expect(nice(1, 2).sum()).is(3);
    expect(nice(1, 2).sum(v => v * 2)).is(6);
  });

  Test("intersperse", () => {
    expect(nice(1, 2).intersperse('-').jsValue).deepEqual([1, '-', 2]);
  });


  Test("sortedIndex", () => {
    expect(nice(1, 2, 3).sortedIndex(0)).is(0);
    expect(nice(1, 2, 3).sortedIndex(1)).is(0);
    expect(nice(1, 2, 3).sortedIndex(1.5)).is(1);
    expect(nice(1, 2, 3).sortedIndex(15)).is(3);
  });


  Test("sortedIndex by", () => {
    const f = (a, b) => a.length - b.length;
    expect(nice('qw', 'qwe', 'qwerty').sortedIndex('', f)).is(0);
    expect(nice('qw', 'qwe', 'qwerty').sortedIndex('asd', f)).is(1);
    expect(nice('qw', 'qwe', 'qwerty').sortedIndex('asdqweweq', f)).is(3);
  });


  Test("intersection", () => {
    const a = Arr(1, 4, 3);
    const ja = [1, 4, 3];
    const b = Arr(2, 4, 1);
    const jb = [2, 4, 1];
    expect(a.intersection([]).jsValue).deepEqual([]);
//    expect(a.intersection(b).jsValue).deepEqual([1,4]);
//    expect(nice.intersection(ja, b).jsValue).deepEqual([1,4]);
//    expect(nice.intersection(a, jb).jsValue).deepEqual([1,4]);
//    expect(nice.intersection(ja, jb).jsValue).deepEqual([1,4]);
  });


  it('insertAfter', () => {
    expect(nice.Arr(1).insertAfter(1,2).jsValue).deepEqual([1,2]);
    expect(nice.Arr(1,2,4).insertAfter(2,3).jsValue).deepEqual([1,2,3,4]);
    expect(nice.Arr(1,2,4).insertAfter(3,5).jsValue).deepEqual([1,2,4,5]);
  });

//  it('rFilter', () => {
//    var a = Arr(1,2);
//    var b = a.rFilter(x => x % 2);
//
//    expect(b()).deepEqual([1]);
//    a.push(3);
//    expect(b()).deepEqual([1,3]);
//    a.removeAt(0);
//    expect(b()).deepEqual([3]);
//    a.push(4);
//    expect(b()).deepEqual([3]);
//    a.push(5);
//    expect(b()).deepEqual([3,5]);
//    a.push(1);
//    expect(b()).deepEqual([3,5,1]);
//  });
});
