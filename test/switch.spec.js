const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;
const { Switch } = nice;

describe("Switch", function() {

  it("switch", function() {
    const spy1 = chai.spy();
    const spy2 = chai.spy();
    const spy3 = chai.spy();

    const s = Switch('qwe')
      .isNumber.use(spy1)
      .isString.use((...a) => {
        spy2(...a);
        return 13;
      })
      .is(3)(4)
      .default.use(spy3);

    expect(s).to.equal(13);
    expect(spy1).not.to.have.been.called();
    expect(spy2).to.have.been.called.with('qwe');
    expect(spy3).not.to.have.been.called();
  });


  it("switch equal", function() {
    const spy1 = chai.spy();
    const spy3 = chai.spy();

    const s = Switch('qwe')
      .isNumber.use(spy1)
      .is('qwe')(4)
      .default.use(spy3);

    expect(spy1).not.to.have.been.called();
    expect(spy3).not.to.have.been.called();
    expect(s).to.equal(4);
  });


  it("switch check", function() {
    const spy1 = chai.spy();
    const spy3 = chai.spy();

    const s = Switch('qwe')
      .isNumber.use(spy1)
      .check(s => s === 'qwe')(15)
      .default.use(spy3);

    expect(spy1).not.to.have.been.called();
    expect(spy3).not.to.have.been.called();
    expect(s).to.equal(15);
  });


  it("not", function() {
    const s = Switch(5)
      .isString(1)
      .not.isString(2)
      .default(3);

    expect(s).to.equal(2);
  });


  it("default", function() {
    const s = Switch(5).isString(1)();

    expect(s).to.equal(5);
  });


  it("between", function() {
    const s = Switch(4)
      .isString(1)
      .between(3, 6)('ok')
      .default('nok');

    expect(s).to.equal('ok');
  });


  it("switch default", function() {
    const spy1 = chai.spy();
    const spy2 = chai.spy();
    const spy3 = chai.spy();

    const s = Switch([])
      .isNumber.use(spy1)
      .isString.use(spy2)
      .default.use(spy3);

    expect(spy1).not.to.have.been.called();
    expect(spy2).not.to.have.been.called();
    expect(spy3).to.have.been.called.with([]);
  });


  it("switch value", function() {
    const s = Switch(5)
      .isNumber.use(n => n + 1)
      .isString.use(s => s + '!');

    expect(s()).to.equal(6);
  });


  it("lt", function() {
    const s = Switch(5)
      .lt(10)('OK')
      .default('');

    expect(s).to.equal('OK');
  });


  it("switch curry", function() {
    const s = Switch(5)
      .$2.gt(10)('OK')
      .default('');

    expect(s).to.equal('OK');
  });


  it("switch action & mapping", function() {
    expect(Switch(5).isNumber.sum(5).isArray.map(x => x * 2)()).equal(10);
    expect(Switch([1]).isNumber.sum(5).isArray.map(x => x * 2)()[0]).equal(2);
    expect(Switch('qwe').isNumber.sum(5).isArray.map(x => x * 2)()).equal('qwe');
  });


  it("delayed switch action & mapping", function() {
    const f = nice.Switch(nice.$1)
      .isNumber.sum(5)
      .isArray.map(x => x * 2);
    expect(f(5)).equal(10);
    expect(f(5, 3)).equal(10);
    expect(f([1])[0]).equal(2);
    expect(f('qwe')).equal('qwe');
  });


  it("item's Switch", function() {
    const n = nice.Num(1)
      .Switch()
        .lt(2).use(z => z.inc(1))
        .up;
    expect(n()).equal(2);
  });


  it("item's SwitchArg", function() {
    const n = nice.Num(1)
      .SwitchArg(5)
        .lt(10).use((z, a) => z.inc(a))
        .up;
    expect(n()).equal(6);
  });


  it("throw", function() {
    expect(() => Switch(5)
      .gt(10).use((z, a) => z.inc(a))
      .default.throw('q')).to.throw();

    const n = Switch
      .gt(10).use((z, a) => z.inc(a))
      .default.throw('q');

    expect(() => n(5)).to.throw();
    expect(n(51)).to.equal(52);
  });
});
