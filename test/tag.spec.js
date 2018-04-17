let nice = require('../index.js')();
let Tag = nice.Tag;
let chai = require('chai');
let expect = chai.expect;

describe("Tag", function() {

  it("html", function() {
    expect(Tag().add('qwe').html).to.equal('<div>qwe</div>');
  });


  it("async html", function(done) {
    const b = nice.Box().async(z => setTimeout(z('zxc'), 1));
    const tag = nice.Div('qwe', b);
    nice.resolveChildren(tag, t => {
      expect(t.html).to.equal('<div>qwezxc</div>');
      done();
    });
  });


  it("sync Tag", function() {
    let div = Tag('li').add('qwe');
    expect(div.html).to.equal('<li>qwe</li>');
  });


  it("item child", function() {
    let n = nice.Number(5);
    let n2 = nice.Number(7);
    let div = Tag('ol').add(n, n2);
    expect(div.html).to.equal('<ol>57</ol>');
  });


  it("insert Tag", function() {
    let div = Tag('li');
    let div2 = nice.B('qwe');
    div.add(div2);
    expect(div.html).to.equal('<li><b>qwe</b></li>');
  });


  it("insert in one line", function() {
    let div = Tag('li').add('asd').B('qwe').up;
    expect(div.html).to.equal('<li>asd<b>qwe</b></li>');
  });


  it("style", function() {
    let div = Tag().margin('6px').borderColor('#DEF');
    expect(div.html).to.equal('<div style="margin:6px;border-color:#DEF"></div>');
   });


  it("style object", function() {
    let div = nice.Tag().border({Width: '1px', color:'red'});
    expect(div.html).to.equal('<div style="border-width:1px;border-color:red"></div>');
  });


//  it("Style by", function() {
//    let n = nice.Number();
//    let div = Tag().topBy(z => z(z.use(n)() + 'px')).add('qwe');
//    n(6);
//    expect(div.html).to.equal('<div style="top:6px">qwe</div>');
//  });


  it("text", function() {
    let div = Tag().add('asd')
     .B(' zxc2').up;

    expect(div.text).to.equal('asd zxc2');
  });


//  it("error", function(done) {
//    Tag().childrenBy(z => [qwe.asd])
//     .html.listen(function (z) {
//       expect(z()).to.contain('ReferenceError: qwe is not defined');
//       done();
//     });
//  });

});