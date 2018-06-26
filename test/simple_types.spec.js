const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

describe("Simple types", function() {

  it("Anything", () => {
    expect(nice.ANYTHING.is.Anything()).to.equal(true);
  });


  it("Nothing", () => {
    expect(nice.NOTHING.is.Anything()).to.equal(true);
    expect(nice.NOTHING.is.Nothing()).to.equal(true);
    expect(nice.Nothing() === nice.NOTHING).to.equal(true);
  });


  it("Null", () => {
    expect(nice.NULL.is.Anything()).to.equal(true);
    expect(nice.NULL.is.Nothing()).to.equal(true);
    expect(nice.NULL.is.Null()).to.equal(true);
    expect(nice.NULL.is.Something()).to.equal(false);
    expect(nice.Null() === nice.NULL).to.equal(true);
    expect(nice(null) === nice.NULL).to.equal(true);
  });


  it("Undefined", () => {
    expect(nice.UNDEFINED.is.Anything()).to.equal(true);
    expect(nice.UNDEFINED.is.Nothing()).to.equal(true);
    expect(nice.UNDEFINED.is.Undefined()).to.equal(true);
    expect(nice.UNDEFINED.is.Something()).to.equal(false);
    expect(nice.Undefined() === nice.UNDEFINED).to.equal(true);
    expect(nice(undefined) === nice.UNDEFINED).to.equal(true);
  });


  it("Pending", () => {
    expect(nice.PENDING.is.Anything()).to.equal(true);
    expect(nice.PENDING.is.Nothing()).to.equal(true);
    expect(nice.PENDING.is.Pending()).to.equal(true);
    expect(nice.PENDING.is.Something()).to.equal(false);
    expect(nice.Pending() === nice.PENDING).to.equal(true);
  });


  it("Need computing", () => {
    expect(nice.NEED_COMPUTING.is.Anything()).to.equal(true);
    expect(nice.NEED_COMPUTING.is.Nothing()).to.equal(true);
    expect(nice.NEED_COMPUTING.is.NeedComputing()).to.equal(true);
    expect(nice.NEED_COMPUTING.is.Something()).to.equal(false);
    expect(nice.NeedComputing() === nice.NEED_COMPUTING).to.equal(true);
  });


  it("Something", () => {
    expect(nice.SOMETHING.is.Anything()).to.equal(true);
    expect(nice.is(nice.SOMETHING).Anything()).to.equal(true);
//    expect(nice.Something.is.Nothing()).to.equal(false);
    expect(nice.Something() === nice.SOMETHING).to.equal(true);
  });


  it("is", function(){
    const a = nice.Single(0);
//    expect(a.is()).to.equal(false);
    a(1);
    expect(a.is(1)).to.equal(true);
    expect(a.is([])).to.equal(false);
    expect(a.is(a)).to.equal(true);
    expect(a.is.lt(5)).to.equal(true);
  });


  it("clone", function() {
    let a = nice.Arr(1,2);
    let b = nice.clone(a);

    expect(b()).to.deep.equal([1,2]);
    a.push(3);

    expect(b()).to.deep.equal([1,2]);
  });


  it("cloneDeep", function() {
    let a = nice.Arr(1,2);
    let b = nice.cloneDeep(a);

    expect(b()).to.deep.equal([1,2]);
    a.push(3);

    expect(b()).to.deep.equal([1,2]);
  });
});