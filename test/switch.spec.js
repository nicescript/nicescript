const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;
const { Switch } = nice;

describe("Switch", function() {

  it("switch", function() {
    var spy1 = chai.spy();
    var spy2 = chai.spy();
    var spy3 = chai.spy();

    var s = Switch('qwe')
      .number.use(spy1)
      .string.use((...a) => {
        spy2(...a);
        return 13;
      })
      .equal(3)(4)
      .default.use(spy3);

    expect(s).to.equal(13);
    expect(spy1).not.to.have.been.called();
    expect(spy2).to.have.been.called.with('qwe');
    expect(spy3).not.to.have.been.called();
  });


  it("switch equal", function() {
    var spy1 = chai.spy();
    var spy3 = chai.spy();

    var s = Switch('qwe')
      .number.use(spy1)
      .equal('qwe')(4)
      .default.use(spy3);

    expect(spy1).not.to.have.been.called();
    expect(spy3).not.to.have.been.called();
    expect(s).to.equal(4);
  });


  it("delayed equal", function() {
    var s = Switch
      .equal('qwe')(4)

    expect(s('qwe')).to.equal(4);
    expect(s('asd')).to.equal('asd');
  });


  it("delayed equal with default", function() {
    let s = Switch
      .equal(true)(2)
      .default(nice.NOTHING);

    expect(s(true)).to.equal(2);
//    expect(s('asd')).to.equal(nice.NOTHING);
  });



  it("switch check", function() {
    var spy1 = chai.spy();
    var spy3 = chai.spy();

    var s = Switch('qwe')
      .number.use(spy1)
      .check(s => s === 'qwe')(15)
      .default.use(spy3);

    expect(spy1).not.to.have.been.called();
    expect(spy3).not.to.have.been.called();
    expect(s).to.equal(15);
  });


  it("delayed check", function() {
    var s = Switch
      .check(s => s === 'qwe')(4);

    expect(s('qwe')).to.equal(4);
    expect(s('asd')).to.equal('asd');
  });


  it("not", function() {
    var s = Switch(5)
      .string(1)
      .not.string(2)
      .default(3);

    expect(s).to.equal(2);
  });


  it("not delayed", function() {
    var s = Switch
      .not.string(1)
      .default(2);

    expect(s('qwe')).to.equal(2);
    expect(s(0)).to.equal(1);
  });


  it("not delayed 2", function() {
    var s = Switch
      .string(1)
      .not.string(2)
      .default(3);

    expect(s('qwe')).to.equal(1);
    expect(s(0)).to.equal(2);
  });


  it("delayed default", function() {
    var s = Switch.string(1);

    expect(s('qwe')).to.equal(1);
    expect(s(12)).to.equal(12);
  });


  it("default", function() {
    var s = Switch(5).string(1)();

    expect(s).to.equal(5);
  });


  it("between", function() {
    var s = Switch(4)
      .string(1)
      .between(3, 6)('ok')
      .default('nok');

    expect(s).to.equal('ok');
  });


  it("between delayed", function() {
    var s = Switch
      .string(1)
      .between(3, 6)('ok')
      .default('nok');

    expect(s(5)).to.equal('ok');
    expect(s(0)).to.equal('nok');
  });


  it("between delayed 2", function() {
    var s = Switch
      .between(3, 6)('ok')
      .default('nok');

    expect(s(5)).to.equal('ok');
    expect(s(0)).to.equal('nok');
  });


  it("switch default", function() {
    var spy1 = chai.spy();
    var spy2 = chai.spy();
    var spy3 = chai.spy();

    var s = Switch([])
      .number.use(spy1)
      .string.use(spy2)
      .default.use(spy3);

    expect(spy1).not.to.have.been.called();
    expect(spy2).not.to.have.been.called();
    expect(spy3).to.have.been.called.with([]);
  });


  it("switch value", function() {
    var s = Switch(5)
      .number.use(n => n + 1)
      .string.use(s => s + '!');

    expect(s()).to.equal(6);
  });


  it("lt", function() {
    var s = Switch(5)
      .lt(10)('OK')
      .default('');

    expect(s).to.equal('OK');
  });


  it("switch delayed", function() {
    var s = Switch
      .equal(7).use(() => 77)
      .number.use(n => n + 1)
      .equal('boo')('foo')
      .string.use(s => s + '!')
      .default.use(() => 'Yo!');

    expect(s()).to.equal('Yo!');
    expect(s([])).to.equal('Yo!');
    expect(s(5)).to.equal(6);
    expect(s(7)).to.equal(77);
    expect(s('boo')).to.equal('foo');
    expect(s('qwe')).to.equal('qwe!');
  });


});
