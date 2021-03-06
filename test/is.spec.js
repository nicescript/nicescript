const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

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
    expect(is.null(null)).to.equal(true);
    expect(is.Null(null)).to.equal(false);
    expect(is.Nothing(null)).to.equal(false);
    expect(is.Nothing(0)).to.equal(false);
  });

  it("nice", function() {
    expect(is.nice(1)).to.equal(false);
    expect(is.nice(nice.Number())).to.equal(true);
  });

  it("js types", function() {
    expect(is.regExp(/.*/)).to.equal(true);
    expect(is.arrayBuffer(/.*/)).to.equal(false);
  });
});
