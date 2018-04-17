var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("is", function() {
  const is = nice.is;

  it("equal", function(){
    expect(is.equal(2, 2)).to.equal(true);
    expect(is.equal(2, 3)).to.equal(false);
    expect(is(2).equal(2)).to.equal(true);
    expect(is(2).equal(3)).to.equal(false);
  });


  it("number", function(){
    expect(is(2).number()).to.equal(true);
    expect(is.number(2)).to.equal(true);
    expect(is.number('')).to.equal(false);
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


//  it("or", function(){
//    expect(is.Number.or.String('5')).to.equal(true);
//    expect(is.Number.or.String(5)).to.equal(true);
//    expect(is.Number.or.String({})).to.equal(false);
//  });


  it("isEmpty", function() {
    expect(is.empty('')).to.equal(true);
    expect(is.empty(0)).to.equal(true);
    expect(is.empty([])).to.equal(true);
    expect(is.empty({})).to.equal(true);
    expect(is.empty('1')).to.equal(false);
    expect(is.empty(1)).to.equal(false);
    expect(is.empty([1])).to.equal(false);
    expect(is.empty({qwe:1})).to.equal(false);
  });

  it("primitive Nothing", function() {
    expect(nice.is.Null(null)).to.equal(true);
    expect(nice.is.Nothing(null)).to.equal(true);
    expect(nice.is.Nothing(0)).to.equal(false);
  });

  it("nice", function() {
    expect(nice.is.nice(1)).to.equal(false);
    expect(nice.is.nice(nice.Number())).to.equal(true);
  });


  it("js types", function() {
    expect(nice.is.regExp(/.*/)).to.equal(true);
    expect(nice.is.arrayBuffer(/.*/)).to.equal(false);
  });
});
