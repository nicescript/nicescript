const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;
const { is, Pointer } = nice;

describe("Pointer", function() {

  it("create", function(){
    const o = nice.Obj({qwe:1});
    const p = nice.Pointer(o);
    expect(p._type.name).to.equal('Pointer');
    expect(p.is.Pointer()).to.equal(true);
    expect(p().is.Null()).to.equal(true);
    expect(p('qwe')).to.equal(p);
    expect(p()()).to.equal(1);
  });


  it("set value", function(){
    const o = nice.Obj({qwe:1});
    const p = nice.Pointer(o);
    expect(p().is.Null()).to.equal(true);
    expect(p(o.get('qwe'))).to.equal(p);
    expect(p()()).to.equal(1);
  });


  it("pointer property of an object", () => {
    const users = nice({1: {name: 'Qwe'}});
    const T = nice.Type()
      .pointer('user', users)
      ();
    const t = T();

    expect(t.user(1)).to.equal(t);
    expect(t.user().get('name')()).to.equal('Qwe');
  });
});

