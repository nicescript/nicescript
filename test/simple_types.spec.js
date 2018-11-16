const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

describe("Simple types", function() {

  it("Nothing", () => {
    expect(nice.Nothing().isNothing()).to.equal(true);
  });


  it("Null", () => {
    expect(nice.Null()._isAnything).to.equal(true);
    expect(nice.Null().isNothing()).to.equal(true);
    expect(nice.Null().isNull()).to.equal(true);
    expect(nice.Null().isSomething()).to.equal(false);
    expect(nice.Null().jsValue).to.equal(null);
  });


  it("Undefined", () => {
    expect(nice.Undefined().isNothing()).to.equal(true);
    expect(nice.Undefined().isUndefined()).to.equal(true);
    expect(nice.Undefined().isSomething()).to.equal(false);
    expect(nice.Undefined().jsValue).to.equal(undefined);
  });


  it("Pending", () => {
    expect(nice.Pending().isNothing()).to.equal(true);
    expect(nice.Pending().isPending()).to.equal(true);
    expect(nice.Pending().isSomething()).to.equal(false);
  });


  it("Need computing", () => {
    expect(nice.NeedComputing().isNothing()).to.equal(true);
    expect(nice.NeedComputing().isNeedComputing()).to.equal(true);
    expect(nice.NeedComputing().isSomething()).to.equal(false);
  });


  it("Something", () => {
    expect(nice.Something().isNothing()).to.equal(false);
  });
});