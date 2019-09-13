const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

describe("is", function() {
  it("equal", function(){
    expect(nice(2).is(2)).to.equal(true);
    expect(nice.is(2, 2)).to.equal(true);
    expect(nice.is(2, 3)).to.equal(false);
  });


  it("number", function(){
    expect(nice.isNumber(2)).to.equal(true);
    expect(nice.isNumber('')).to.equal(false);
  });


  it("isAnyOf", function(){
    expect(nice.isAnyOf(1, 2, 3, 4)).to.equal(false);
    expect(nice.isAnyOf(3, 2, 3, 4)).to.equal(true);
  });


  it("lt", function(){
    expect(nice(1).lt(2)).to.equal(true);
    expect(nice(5).lt(2)).to.equal(false);
    expect(nice.lt(1, 2)).to.equal(true);
    expect(nice.lt(5, 2)).to.equal(false);
  });


  it("gt", function(){
    expect(nice.gt(5, 2)).to.equal(true);
    expect(nice.gt(-5, 2)).to.equal(false);
    expect(nice.gte(5, 2)).to.equal(true);
    expect(nice.gte(2, 2)).to.equal(true);
  });


  it("isEmpty", function() {
    expect(nice.isEmpty(null)).to.equal(true);
    expect(nice.isEmpty('')).to.equal(false);
    expect(nice.isEmpty(0)).to.equal(false);
    expect(nice.isEmpty([])).to.equal(true);
    expect(nice.isEmpty({})).to.equal(true);
    expect(nice.isEmpty('1')).to.equal(false);
    expect(nice.isEmpty(1)).to.equal(false);
    expect(nice.isEmpty([1])).to.equal(false);
    expect(nice.isEmpty({qwe:1})).to.equal(false);
  });

  it("primitive Nothing", function() {
    expect(nice.isNull(null)).to.equal(false);
    expect(nice.isNothing(null)).to.equal(false);
    expect(nice.isNothing(0)).to.equal(false);
  });

  it("js types", function() {
    expect(nice.isRegExp(/.*/)).to.equal(true);
    expect(nice.isArrayBuffer(/.*/)).to.equal(false);
  });

  it("truly", function() {
    expect(nice.isTruly(null)).to.equal(false);
    expect(nice.isTruly(0)).to.equal(false);
    expect(nice.isTruly("")).to.equal(false);
    expect(nice.isTruly(nice(""))).to.equal(false);
    expect(nice.isTruly(nice.Err())).to.equal(false);
    expect(nice.isTruly(1)).to.equal(true);
    expect(nice.isTruly([])).to.equal(true);
    expect(nice.isTruly(nice('ww'))).to.equal(true);
  });


  it("falsy", function() {
    expect(nice.isFalsy(null)).to.equal(true);
    expect(nice.isFalsy(0)).to.equal(true);
    expect(nice.isFalsy("")).to.equal(true);
    expect(nice.isFalsy(nice(""))).to.equal(true);
    expect(nice.isFalsy(nice.Err())).to.equal(true);
    expect(nice.isFalsy(1)).to.equal(false);
    expect(nice.isFalsy([])).to.equal(false);
    expect(nice.isFalsy(nice('ww'))).to.equal(false);
  });
});
