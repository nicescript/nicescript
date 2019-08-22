const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

describe("expect", function() {

  it("function", function(){
    expect(() => nice.expect(1).isFunction()).to.throw();
    expect(() => nice.expect(() => {}).isFunction()).not.to.throw();
  });


  it("check type", function(){
    nice.Type('Cat').str('name');
    nice.Type('Dog').str('name');

    const cat = nice.Cat().name('Ball');
    const dog = nice.Dog();
    expect(() => nice.expect(cat).isCar()).to.throw();
    expect(() => nice.expect(cat).isCat()).not.to.throw();
    expect(() => nice.expect(cat).isDog()).to.throw();
    expect(() => nice.expect(dog).isCat()).to.throw();
  });

});
