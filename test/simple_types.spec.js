const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

describe("Simple types", function() {

//  it("Anything", () => {
//    expect(nice.Anything().is.Anything()).to.equal(true);
//  });


  it("Nothing", () => {
    expect(nice.Nothing().is.Anything()).to.equal(true);
    expect(nice.Nothing().is.Nothing()).to.equal(true);
  });


  it("Null", () => {
    expect(nice.Null().is.Anything()).to.equal(true);
    expect(nice.Null().is.Nothing()).to.equal(true);
    expect(nice.Null().is.Null()).to.equal(true);
    expect(nice.Null().is.Something()).to.equal(false);
    expect(nice.Null().jsValue).to.equal(null);
  });


  it("Undefined", () => {
    expect(nice.Undefined().is.Anything()).to.equal(true);
    expect(nice.Undefined().is.Nothing()).to.equal(true);
    expect(nice.Undefined().is.Undefined()).to.equal(true);
    expect(nice.Undefined().is.Something()).to.equal(false);
    expect(nice.Undefined().jsValue).to.equal(undefined);
  });


  it("Pending", () => {
    expect(nice.Pending().is.Anything()).to.equal(true);
    expect(nice.Pending().is.Nothing()).to.equal(true);
    expect(nice.Pending().is.Pending()).to.equal(true);
    expect(nice.Pending().is.Something()).to.equal(false);
  });


  it("Need computing", () => {
    expect(nice.NeedComputing().is.Anything()).to.equal(true);
    expect(nice.NeedComputing().is.Nothing()).to.equal(true);
    expect(nice.NeedComputing().is.NeedComputing()).to.equal(true);
    expect(nice.NeedComputing().is.Something()).to.equal(false);
  });


  it("Something", () => {
    expect(nice.Something().is.Anything()).to.equal(true);
    expect(nice.is(nice.Something()).Anything()).to.equal(true);
    expect(nice.Something().is.Nothing()).to.equal(false);
  });

});