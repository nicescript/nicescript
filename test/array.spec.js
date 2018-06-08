let nice = require('../index.js')();
let chai = require('chai');
chai.use(require('chai-spies'));
let expect = chai.expect;

describe("Array", function() {
  let x2 = x => x * 2;

  it("setter", function() {
    let a = nice.Array();

    a(2)(3, 4)(5);
    expect(a.getResult()).to.deep.equal([2, 3, 4, 5]);
  });


  it("constructor", function() {
    let a = nice.Array(1, 5, 8);
    a(9);
    expect(a()).to.deep.equal([1, 5, 8, 9]);
  });


  it("each", () => {
    let a = nice.Array(1, 2);
    let spy = chai.spy();
    a.each(v => spy(v()));
    expect(spy).to.have.been.called.twice();
    expect(spy).to.have.been.called.with(1);
    expect(spy).to.have.been.called.with(2);
  });

  it("eachRight", () => {
    let a = nice.Array(1, 2);
    let b = [];
    a.eachRight(v => b.push(v()));
    expect(b).to.deep.equal([2, 1]);
  });



  it("filter", () => {
    let a = nice.Array(1, 2, 3, 4, 5);
    expect(a.filter(n => n % 2 === 0)()).to.deep.equal([2,4]);
  });


  it("sortBy", () => {
    let a = nice.Array(4, 3, 5);
    expect(a.sortBy()()).to.deep.equal([3,4,5]);
    expect(a.sortBy(v => -v)()).to.deep.equal([5,4,3]);
  });


  it("size", () => {
    expect(nice.Array(4, 3, 5).size).to.equal(3);
    expect(nice.Array().size).to.equal(0);
  });


  it("map", () => {
    expect(nice.Array(4, 3, 5).map(x2)()).to.deep.equal([8,6,10]);
  });





  it("class property", () => {
    let car = nice.Type().Array('wheels')();
    let c = car();
    c.wheels(16, 17);

    expect(c.wheels()).to.deep.equal([16, 17]);
  });


  it("insertAt", () => {
    let a = nice.Array(1, 4);
    a.insertAt(1, 2);
    expect(a.getResult()).to.deep.equal([1, 2, 4]);
  });


  it("push", () => {
    let a = nice.Array(1, 4);
    a.push(2, 1);
    expect(a.getResult()).to.deep.equal([1, 4, 2, 1]);
  });

  it("pop", () => {
    let a = nice.Array(1, 2);
    let b = a.pop();
    expect(b()).to.equal(2);
    expect(a()).to.deep.equal([1]);
  });


  it("unshift", () => {
    let a = nice.Array(1, 4);
    a.unshift(2, 3);
    expect(a()).to.deep.equal([2, 3, 1, 4]);
  });

  it("shift", () => {
    let a = nice.Array(1, 4);
    let b = a.shift();
    expect(a()).to.deep.equal([4]);
    expect(b()).to.equal(1);
  });


  it("add", () => {
    let a = nice.Array(1, 4);
    a.add(2, 1);
    a.add(2, 1);
    expect(a.getResult()).to.deep.equal([1, 4, 2]);
  });


  it("removeAll", () => {
    let a = nice.Array(1, 4);
    a.removeAll();
    expect(a.getResult()).to.deep.equal([]);
  });


  it("removeAt", () => {
    let a = nice.Array(1, 2, 3, 4);
    a.removeAt(1);
    a.removeAt(1);
    expect(a.getResult()).to.deep.equal([1, 4]);
  });


  it("fill", () => {
    expect(nice.Array(1, 2, 3).fill(6)()).to.deep.equal([6, 6, 6]);
    expect(nice.Array(1, 2, 3).fill(6, 1, 2)()).to.deep.equal([1, 6, 3]);
    expect(nice.Array(1, 2, 3).fill(6, 1, 1)()).to.deep.equal([1, 2, 3]);
    expect(nice.Array(1, 2, 3).fill(6, -3, -2)()).to.deep.equal([6, 2, 3]);
  });


  it("Symbol.iterator", () => {
    expect(() => [...nice.Array()]).not.to.throw();
  });


  it("concat", () => {
    expect(nice(1, 2).concat([{qwe:1}])()).to.deep.equal([1,2,{"qwe":1}]);
  });


  it("sum", () => {
    expect(nice(1, 2).sum()()).to.equal(3);
    expect(nice(1, 2).sum(v => v * 2)()).to.equal(6);
  });

  it("intersperse", () => {
    expect(nice(1, 2).intersperse('-')()).to.deep.equal([1, '-', 2]);
  });


  it("sortedIndex", () => {
    expect(nice(1, 2, 3).sortedIndex(0)()).to.equal(0);
    expect(nice(1, 2, 3).sortedIndex(1)()).to.equal(0);
    expect(nice(1, 2, 3).sortedIndex(1.5)()).to.equal(1);
    expect(nice(1, 2, 3).sortedIndex(15)()).to.equal(3);
  });


  it("sortedIndex by", () => {
    const f = (a, b) => a.length - b.length;
    expect(nice('qw', 'qwe', 'qwerty').sortedIndex('', f)()).to.equal(0);
    expect(nice('qw', 'qwe', 'qwerty').sortedIndex('asd', f)()).to.equal(1);
    expect(nice('qw', 'qwe', 'qwerty').sortedIndex('asdqweweq', f)()).to.equal(3);
  });



});
