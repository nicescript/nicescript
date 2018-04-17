var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Single", function() {

  it("constructor", function(){
    var s = nice.Single(2);
    expect(s()).to.equal(2);
  });


  it("not an object", function(){
    expect(nice.is.Object(nice.Single(2))).to.equal(false);
  });


  it("might not have properties", function(){
    expect(() => nice.Single.extend().String('qwe')).to.throw();
  });
  

  it("does not have objects methods", function(){
    let s = nice.Single();
    expect(() => s.get('qwe')).to.throw();
    expect(() => s.set('qwe')).to.throw();
  });




//  it("_set", function(){
//    var s = nice.Single.by((a, b) => a * b);
//    s(2, 3);
//    expect(s()).to.equal(6);
//  });

});
