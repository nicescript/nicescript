Creating HTML and CSS
===========

```javascript
const { Div, A, B, I, Img, Input } = nice;

const div = Div('Hello world!');

div.show()  // insert dom node at document.body or provided target

div.html    // returns '<div>Hello world!</div>'
```

## Styling
```javascript
Div('Hello world!').color('red').font('2rem Arial')

```


## Adding children
```javascript
// option 1
Div().add('Hello ', B('World'));  

// maybe shorter
Div('Hello ', B('Hello'));  

// i realy don't like those 2 closing brackets
Div('Hello ').b('World');  

// what if i want to add style to a child
Div('Hello ')
  .B('World').color('red').up

// use arrays
const a = ['Hello ', 'World'];
Div(a).html
// <div>Hello World</div>

// and objects (be carefull order is not garantied in Objects )
const o = { greeting: 'Hello ', name: 'World' };
Div(o).html
// <div>Hello World</div>

// you can write Div(a, f) instead of Div(a.map(f)) 
Div(a, s => s.toUpperCase()).html
// <div>HELLO WORLD</div>
```

Some tags have special constructors for convenience.
```javascript
A('/', 'Home').html;
// <a href="/">Home</a>

// use function for first argument to assign onclick handler
A(() => console.log('Click'), 'Click');

Img('logo.png').html
//'<img src="logo.png"></img>'

```

