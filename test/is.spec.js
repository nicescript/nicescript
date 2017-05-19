var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Number", function() {

  it("is", function(){
    expect(nice.is.Number(2)).to.equal(true);
  });


  it("is Item", function(){
    expect(nice.is.Item(nice.Item())).to.equal(true);
    expect(nice.is.Item(nice.Array())).to.equal(true);
    expect(nice.is.Item(nice.Object())).to.equal(true);
    expect(nice.is.Item(function(){})).to.equal(false);
  });


  it("or", function(){
    expect(nice.is.Number.or.String('5')).to.equal(true);
    expect(nice.is.Number.or.String(5)).to.equal(true);
    expect(nice.is.Number.or.String({})).to.equal(false);
  });


  it("isEmpty", function() {
    expect(nice.is.Empty('')).to.equal(true);
    expect(nice.is.Empty(0)).to.equal(true);
    expect(nice.is.Empty([])).to.equal(true);
    expect(nice.is.Empty({})).to.equal(true);
    expect(nice.is.Empty('1')).to.equal(false);
    expect(nice.is.Empty(1)).to.equal(false);
    expect(nice.is.Empty([1])).to.equal(false);
    expect(nice.is.Empty({qwe:1})).to.equal(false);
  });
});
