const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

describe("Range", function() {
  it("includes", function() {
    const r = nice.Range(1, 6);

    expect(r.is.includes(5)).to.equal(true);
    expect(r.is.includes(15)).to.equal(false);
  });


  it("within", function() {
    const r = nice.Range(1, 5);
    expect(nice.Num(5).within(r)).to.equal(true);
    expect(nice.Num(15).within(r)).to.equal(false);
  });

});
