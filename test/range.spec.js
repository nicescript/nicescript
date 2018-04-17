var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Array", function() {
  it("includes", function() {
    var r = nice.Range(1, 6);

    expect(r.is.includes(5)).to.equal(true);
    expect(r.is.includes(15)).to.equal(false);
  });


  it("within", function() {
    var r = nice.Range(1, 5);
    expect(nice.Number(5).within(r)).to.equal(true);
    expect(nice.Number(15).within(r)).to.equal(false);
  });

});
