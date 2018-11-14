const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

describe("is", function() {
  const is = nice.is;


  it("is", function(){
    const a = nice.Single(0);
//    expect(a.is()).to.equal(false);
    a(1);
    expect(a.is(1)).to.equal(true);
    expect(a.is([])).to.equal(false);
    expect(a.is(a)).to.equal(true);
    expect(a.is.lt(5)).to.equal(true);
  });


  it("equal", function(){
    expect(is.equal(2, 2)).to.equal(true);
    expect(is.equal(2, 3)).to.equal(false);
    expect(is(2).equal(2)).to.equal(true);
    expect(is(2).equal(3)).to.equal(false);
  });


  it("number", function(){
    expect(is(2).Number()).to.equal(true);
    expect(is.Number(2)).to.equal(true);
    expect(is.Number('')).to.equal(false);
  });


  it("is Box", function(){
    expect(is.Box(nice.Box())).to.equal(true);
    expect(is(nice.Box()).Box()).to.equal(true);
  });


  it("any", function(){
    expect(is.any(1, 2, 3, 4)).to.equal(false);
    expect(is.any(3, 2, 3, 4)).to.equal(true);
  });


  it("lt", function(){
    expect(is(1).lt(2)).to.equal(true);
    expect(is(5).lt(2)).to.equal(false);
    expect(is.lt(1, 2)).to.equal(true);
    expect(is.lt(5, 2)).to.equal(false);
  });


  it("gt", function(){
    expect(is.gt(5, 2)).to.equal(true);
    expect(is.gt(-5, 2)).to.equal(false);
    expect(is.gte(5, 2)).to.equal(true);
    expect(is.gte(2, 2)).to.equal(true);
  });


  it("isEmpty", function() {
    expect(is.empty(null)).to.equal(true);
    expect(is.empty('')).to.equal(false);
    expect(is.empty(0)).to.equal(false);
    expect(is.empty([])).to.equal(true);
    expect(is.empty({})).to.equal(true);
    expect(is.empty('1')).to.equal(false);
    expect(is.empty(1)).to.equal(false);
    expect(is.empty([1])).to.equal(false);
    expect(is.empty({qwe:1})).to.equal(false);
  });

  it("primitive Nothing", function() {
    expect(is.null(null)).to.equal(true);
    expect(is.Null(null)).to.equal(false);
    expect(is.Nothing(null)).to.equal(false);
    expect(is.Nothing(0)).to.equal(false);
  });

  it("nice", function() {
    expect(is.nice(1)).to.equal(false);
    expect(is.nice(nice.Num())).to.equal(true);
  });

  it("js types", function() {
    expect(is.RegExp(/.*/)).to.equal(true);
    expect(is.ArrayBuffer(/.*/)).to.equal(false);
  });

  it("truly", function() {
    expect(is.truly(null)).to.equal(false);
    expect(is.truly(0)).to.equal(false);
    expect(is.truly("")).to.equal(false);
    expect(is.truly(nice(""))).to.equal(false);
    expect(is.truly(nice.Err())).to.equal(false);
    expect(is.truly(1)).to.equal(true);
    expect(is.truly([])).to.equal(true);
    expect(is.truly(nice('ww'))).to.equal(true);
  });


  it("falsy", function() {
    expect(is.falsy(null)).to.equal(true);
    expect(is.falsy(0)).to.equal(true);
    expect(is.falsy("")).to.equal(true);
    expect(is.falsy(nice(""))).to.equal(true);
    expect(is.falsy(nice.Err())).to.equal(true);
    expect(is.falsy(1)).to.equal(false);
    expect(is.falsy([])).to.equal(false);
    expect(is.falsy(nice('ww'))).to.equal(false);
  });


});
