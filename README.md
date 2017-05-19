NiceScript
=========

Reactive JavaScript library designed to reduce amount of boilerplate code on client and server.

```javascript
var nice = require('nicescript')();

nice.class('Book').String('title').String('author').Number('price');

nice.block('BookView', (z, book) => z.tag('li').add(book.title())
  .I(' ', book.price(), '$').fontSize('1.2em'));

var books = nice.Array(
  nice.Book().title('Interface').author('Jef').price(15),
  nice.Book().title('Pearls').author('Jon').price(25),
);

books.reduceTo.Number((sum, book) => sum.inc(book.price()))
  .listenBy(v => console.log('total:', v()));
//total: 40

var div = books.filter(book => book.author.is('Jon'))
  .reduceTo.OL((div, book) => div.BookView(book));

div.show();//only in browser - attach dom node to document.body
div.dom();
//[object HTMLDivElement]

div.html.listenBy(v => console.log('html:', v()));
//html: <ol><li>Pearls<i style="font-size:1.2em"> 25$</i></li></ol>

books(nice.Book().title('More Pearls').author('Jon').price(20));
//total: 60
//child appended to shown dom node
//html: <ol><li>Pearls<i style="font-size:1.2em"> 25$</i></li><li>More Pearls<i style="font-size:1.2em"> 20$</i></li></ol>

books(nice.Book().title('Code').author('Piter').price(20));
//total: 80
```

## Examples

* [Ball game](https://rawgit.com/nicescript/nicescript/master/examples/ball.html)
* [Todo list](https://rawgit.com/nicescript/nicescript/master/examples/todo.html)

## Tests

  `npm test`
