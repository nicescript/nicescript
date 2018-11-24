const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

describe("Single", function() {

  it("constructor", function(){
    const s = nice.Single(2);
    expect(s()).to.equal(2);
  });


  it("not an object", function(){
    expect(nice.isObj(nice.Single(2))).to.equal(false);
  });


  it("might not have properties", function(){
    expect(() => nice.Single.extend().str('qwe')).to.throw();
  });
});
