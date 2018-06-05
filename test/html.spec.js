let nice = require('../index.js')();
let Html = nice.Html;
let chai = require('chai');
let expect = chai.expect;

describe("Html", function() {

  it("html", function() {
    expect(Html().add('qwe').html).to.equal('<div>qwe</div>');
  });


  it("async html", function(done) {
    const b = nice.Box().async(z => setTimeout(z('zxc'), 1));
    const tag = nice.Div('qwe', b);
    nice.resolveChildren(tag, t => {
      expect(t.html).to.equal('<div>qwezxc</div>');
      done();
    });
  });


  it("sync Html", function() {
    const div = Html('li').add('qwe');
    expect(div.html).to.equal('<li>qwe</li>');
  });


  it("class", function() {
    const div = Html('li').class('qwe');
    expect(div.html).to.equal('<li class="qwe"></li>');
  });


  it("children array", function() {
    const div = nice.Div(['qwe', 'asd']);
    expect(div.html).to.equal('<div>qweasd</div>');

    const div2 = nice.Div(nice('qwe', 'asd'));
    expect(div2.html).to.equal('<div>qweasd</div>');
  });


  it("item child", function() {
    const n = nice.Number(5);
    const n2 = nice.Number(7);
    const div = Html('ol').add(n, n2);
    expect(div.html).to.equal('<ol>57</ol>');
  });


  it("insert Html", function() {
    const div = Html('li');
    const div2 = nice.B('qwe');
    div.add(div2);
    expect(div.html).to.equal('<li><b>qwe</b></li>');
  });


  it("insert in one line", function() {
    const div = Html('li').add('asd').B('qwe').up;
    expect(div.html).to.equal('<li>asd<b>qwe</b></li>');
  });


  it("style", function() {
    const div = Html().margin('6px').borderColor('#DEF');
    expect(div.html).to.equal('<div style="margin:6px;border-color:#DEF"></div>');
   });


  it("style object", function() {
    const div = nice.Html().border({Width: '1px', color:'red'});
    expect(div.html).to.equal('<div style="border-width:1px;border-color:red"></div>');
  });


  it("text", function() {
    const div = Html().add('asd')
     .B(' zxc2').up;

    expect(div.text).to.equal('asd zxc2');
  });


  it("extend", function() {
    Html.extend('User').by((z, name) => z.add('User: ', name));

    expect(nice.B().User('Jon').up.html).to.equal('<b><div>User: Jon</div></b>');
  });
});