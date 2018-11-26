const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;
const { Arr, Obj } = nice;

describe("Arr", function() {
  let x2 = x => x * 2;

  it("setter", function() {
    let a = Arr();

    a(2)(3, 4)(5);
    expect(a.get(1)).to.equal(3);
    expect(a.get(3)).to.equal(5);
  });

  it("nice child", function() {
    let a = Arr();
    let o = Obj();
    a(o);
    expect(a.get(0) === o).to.equal(true);
  });


  it("constructor", function() {
    let a = Arr(1, 5, 8);
    a(9);
    expect(a.get(1)).to.equal(5);
    expect(a.get(3)).to.equal(9);
    expect(a.get(4)).to.equal(undefined);
  });


  it("each", () => {
    let a = Arr(1, 2);
    let spy = chai.spy();
    a.each(v => spy(v));
    expect(spy).to.have.been.called.twice();
    expect(spy).to.have.been.called.with(1);
    expect(spy).to.have.been.called.with(2);
  });


  it("eachRight", () => {
    let a = Arr(1, 2);
    let b = [];
    a.eachRight(v => b.push(v));
    expect(b).to.deep.equal([2, 1]);
  });


  it("filter", () => {
    const res = Arr(1, 2, 3, 4, 5).filter(n => n % 2 === 0);
    expect(res.jsValue).to.deep.equal([2,4]);
    expect(res.size).to.equal(2);
  });


  it("sortBy", () => {
    let a = Arr(4, 3, 5);
    expect(a.sortBy().jsValue).to.deep.equal([3,4,5]);
    expect(a.sortBy(v => -v).jsValue).to.deep.equal([5,4,3]);
  });


  it("size", () => {
    expect(Arr(4, 3, 5).size).to.equal(3);
    expect(Arr().size).to.equal(0);
  });


  it("map", () => {
    expect(Arr(4, 3, 5).map(x2).jsValue).to.deep.equal([8,6,10]);
  });


  it("class property", () => {
    const Car = nice.Type().arr('wheels')();
    const c = Car();
    c.wheels(16, 17);

    expect(c.wheels.jsValue).to.deep.equal([16, 17]);
  });


  it("insertAt", () => {
    let a = Arr(1, 4);
    a.insertAt(1, 2);
    expect(a.jsValue).to.deep.equal([1, 2, 4]);
  });


  it("insertAt subscription", () => {
    let a = Arr();
    const onAdd = chai.spy();
    a.listen({ onAdd });
    a.insertAt(0, 2);
    expect(onAdd).to.have.been.called();
  });


  it("push", () => {
    let a = Arr(1, 4);
    a.push(2, 1);
    expect(a.jsValue).to.deep.equal([1, 4, 2, 1]);
  });

  it("pop", () => {
    const a = Arr(1, 2);
    const b = a.pop();
    const c = a.rMap(x2);
    expect(b).to.equal(2);
    expect(a.jsValue).to.deep.equal([1]);
    expect(c.jsValue).to.deep.equal([2]);
  });


  it("unshift", () => {
    let a = Arr(1, 4);
    a.unshift(2, 3);
    expect(a.jsValue).to.deep.equal([2, 3, 1, 4]);
  });

  it("shift", () => {
    let a = Arr(1, 4);
    let b = a.shift();
    expect(a.jsValue).to.deep.equal([4]);
    expect(b).to.equal(1);
  });


//  it("add", () => {
//    let a = Arr(1, 4);
//    a.add(2, 1);
//    a.add(2, 1);
//    expect(a.jsValue).to.deep.equal([1, 4, 2]);
//  });


  it("removeAll", () => {
    let a = Arr(1, 4);
    a.removeAll();
    expect(a.jsValue).to.deep.equal([]);
  });


  it("removeAt", () => {
    let a = Arr(1, 2, 3, 4);
    a.removeAt(1);
    a.removeAt(1);
    expect(a.jsValue).to.deep.equal([1, 4]);
  });


  it("fill", () => {
    expect(Arr(1, 2, 3).fill(6).jsValue).to.deep.equal([6, 6, 6]);
    expect(Arr(1, 2, 3).fill(6, 1, 2).jsValue).to.deep.equal([1, 6, 3]);
    expect(Arr(1, 2, 3).fill(6, 1, 1).jsValue).to.deep.equal([1, 2, 3]);
    expect(Arr(1, 2, 3).fill(6, -3, -2).jsValue).to.deep.equal([6, 2, 3]);
  });


  it("Symbol.iterator", () => {
    expect(() => [...Arr()]).not.to.throw();
  });


  it("concat", () => {
    expect(nice(1, 2).concat([{qwe:1}])).to.deep.equal([1,2,{"qwe":1}]);
  });


  it("sum", () => {
    expect(nice(1, 2).sum()).to.equal(3);
    expect(nice(1, 2).sum(v => v * 2)).to.equal(6);
  });

  it("intersperse", () => {
    expect(nice(1, 2).intersperse('-').jsValue).to.deep.equal([1, '-', 2]);
  });


  it("sortedIndex", () => {
    expect(nice(1, 2, 3).sortedIndex(0)).to.equal(0);
    expect(nice(1, 2, 3).sortedIndex(1)).to.equal(0);
    expect(nice(1, 2, 3).sortedIndex(1.5)).to.equal(1);
    expect(nice(1, 2, 3).sortedIndex(15)).to.equal(3);
  });


  it("sortedIndex by", () => {
    const f = (a, b) => a.length - b.length;
    expect(nice('qw', 'qwe', 'qwerty').sortedIndex('', f)).to.equal(0);
    expect(nice('qw', 'qwe', 'qwerty').sortedIndex('asd', f)).to.equal(1);
    expect(nice('qw', 'qwe', 'qwerty').sortedIndex('asdqweweq', f)).to.equal(3);
  });


  it("intersection", () => {
    const a = Arr(1, 4, 3);
    const ja = [1, 4, 3];
    const b = Arr(2, 4, 1);
    const jb = [2, 4, 1];
    expect(a.intersection([]).jsValue).to.deep.equal([]);
//    expect(a.intersection(b).jsValue).to.deep.equal([1,4]);
//    expect(nice.intersection(ja, b).jsValue).to.deep.equal([1,4]);
//    expect(nice.intersection(a, jb).jsValue).to.deep.equal([1,4]);
//    expect(nice.intersection(ja, jb).jsValue).to.deep.equal([1,4]);
  });


  it('insertAfter', () => {
    expect(nice.Arr(1).insertAfter(1,2).jsValue).to.deep.equal([1,2]);
    expect(nice.Arr(1,2,4).insertAfter(2,3).jsValue).to.deep.equal([1,2,3,4]);
    expect(nice.Arr(1,2,4).insertAfter(3,5).jsValue).to.deep.equal([1,2,4,5]);
  });


  it('lasr', () => {
    expect(nice.Arr(1,2,4).last()).to.equal(4);
  });
});
