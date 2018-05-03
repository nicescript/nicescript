NiceScript
=========

[![Build Status](https://travis-ci.org/nicescript/nicescript.svg?branch=master)](https://travis-ci.org/nicescript/nicescript)

A naive attempt to simplify life of a fellow JavaScript programmer.

Example ( [JS Bin](https://jsbin.com/kenedihasi/edit?html,output) )

```javascript
const { Box, Div, B, Switch } = nice;

const tasks = Box(['Feed the fish', 'Buy milk']);

const decorate = Switch
  .equal('Watch tv')('Read book')
  .match(/buy/i).use(s => [s, B(' $').color('#3A3')]);

const taskView = t => Div(t)
  .margin('1em 0')
  .padding('.5em')
  .borderRadius('.5em')
  .backgroundColor('#DEF');

Box.by(tasks, ts => Div(ts.map(decorate).map(taskView))).show();

tasks.push('Walk the dog', 'Watch tv');
```

More examples:

* [Ball game](./examples/ball.html) ( [JS Bin](https://jsbin.com/wimayanovu/1/edit?html,output) )
* [Todo list](./examples/todo.html) ( [JS Bin](https://jsbin.com/yetufekopi/1/edit?html,output) )
* [Tic Tac Toe](./examples/tictactoe.html) ( [JS Bin](https://jsbin.com/yozupufaci/edit?html,output) )

## Install
`npm install nicescript`

Then in node.js script:

`const nice = require('nicescript')();`


Browser:

`<script src="https://unpkg.com/nicescript/nice.js"></script>`

or

`<script src="https://cdn.jsdelivr.net/npm/nicescript/nice.js"></script>`

## Tests

  `npm test`


## Basic features

* [Types](#types)
* [Functions](#functions) - adds couple features to regular JS functions.
* [Switch](#switch) - finally convenient.
* [Boxes](#boxes) - to handle state changes.
* [Tag](#tag) - use all above to to create html UI.

### Nice values

#### Single values
```javascript
const n = nice(5);

//read value
n();      // 5

//write value
n(6);     // n
n();      // 6
```

#### Object values
```javascript
const o = nice.Object({ a: 1 });

//get value
o('a');         // 1
o('b');         // nice.NOT_FOUND

//set value
o('b', 5);      // o
o('b');         // 5
```

### Types

Each value in NiceScript has a type. Here is a root of types hierarchy:  

+ Anything
  + Something
    + Value
      + Object
        + Array
        + [Tag](#tag)
      + Single
        + String
        + Number
        + Boolean
    + [Function](#functions)
    + [Box](#boxes)
    + Ok
  + Nothing
    + Error
    + Undefined
    + Null
    + NotFound
    + Fail
    + ...


#### Wrapping values
Call nice with js value to wrap it with most appropriate type.
```javascript
const nice = require('nicescript')();
nice(4);        // nice.Number;
nice("");       // nice.String;
nice(true);     // nice.Boolean;
nice({});       // nice.Object;
nice([]);       // nice.Array;
nice(1, 2, 3);  // nice.Array;
nice(null);     // nice.Null;
```


#### User types
```javascript
nice.Type('Dog')
  .String('title')
  .Number('weight')
  .by((z, title) => z.title(title));

let d = nice.Dog('Jim').weight(5);
d.name();       // Jim 
d.weight();     // 5

// by default created type extends nice.Object
d.is.Object()   // true

```
Type name should start with capital letter.


### Functions

```javascript
// Creating anonymous function
const f = nice.Function(n => n + 1);
f(1);               // 2

// Named functions will be added to nice
const plusTwo = nice.Function('plusTwo', n => n + 2);
//or nice.Function(function plusTwo(n) { return n + 2; });
plusTwo(1);         // 3
nice.plusTwo(1);    // 3

// Check argument type
const x2 = nice.Function.number('x2', n => n * 2);
x2(21);             // 42
nice.x2(21);        // 42
nice.Number(1).x2();// 42
x2('q');            // throws "Function  can't handle (String)"

// now let's overload x2 for strings
x2.string(s => s + '!');
x2(21);             // 42
x2('q');            // q!

```
Function name should start with lowercase letter. 

#### Function types

##### Mapping
Clean function that do not changes it's arguments. 
NiceScript will always [wrap](#wrapping-values) result of Mapping. 

```javascript
nice.Mapping.Number.Number('times', (a, b) => a * b);
const n = nice(5);
const n2 = n.times(3).times(2); // nice.Number(30)
n()                             // 5
n2()                            // 30;
```
 
##### Check
Returns boolean. Never changes it's arguments. 
After definition named Check can be used in [Switch](#switch) and 'is' statements. 

##### Action
Changes first argument. Action always returns it's first argument so you can 
call multiple actions in a row.

```javascript
nice.Action.Number.Number('times', (a, b) => a * b);
const n = nice(5);
n.times(3).times(2);            // n
n();                            // 30;
```


### Switch
Delayed argumet
```javascript
const f = nice.Switch
  .equal(1)(11)
  .number(22)
  .string.use(s => s + '!')
  .Nothing(':(')
  .default(42);
f(1);           // 11
f(3);           // 22
f('qwe');       // "qwe!"
f([]);          // 42
f(0);           // 42
f(undefined);   // :(
f(null);        // :(
```
Instant argument
```javascript
nice.Check('meat', v => ['pork', 'beef'].includes(v));
const tiger = { say: console.log };
function feedTiger(tiger, food){
  tiger.hungry = nice.Switch(food)
    .meat(false)
    .default.use(name => tiger.say('I do not like ' + name) || true);
}

feedTiger(tiger, 'apple');   // tiger.hungry === true
// > I do not like apple

feedTiger(tiger, 'beef');    // tiger.hungry === false
```
#### Switch vs Function overload
Overloaded Function will search for best match while Switch will use first match.
```javascript
nice.Function.Nothing(() => 1).Null(() => 2)(null);         // 2
nice.Switch.Nothing.use(() => 1).Null.use(() => 2)(null);   // 1
```
Besides current implementation of Switch use only first argument.

 
### Boxes
Stateful observable components. 

```javascript
const { Box } = nice;
let b = Box(1);       // create box with 1 in it
b.listen(console.log) // listen for updates
b(2);                 // write value
b();                  // read value

// create Box that follows changes in b
let b2 = Box.use(b).by(n => n * 2);
// short version Box.by(b, n => n * 2);
b(3);                 // b2() === 6

// Named inputs
let square = Box()
  .Number('x', 5)
  .Number('y', 5)
  .by((x, y) => x * y);

square();                  // 25
square.x(10).y(b)();       // 30
```

Calling [mapping](#mapping) on box will create new box that follows changes in the original.
```javascript
const a = nice.Box('qwe');
const b = a.concat('!').listen(console.log);
// qwe!
a('asd');
// asd!
```

Calling [action](#action) on box will change its content.
```javascript
const a = nice.Box([1, 2]).listen(console.log);
// [1, 2];
a.push(3);
// [1, 2, 3];
```

### Tag
```javascript
const div = nice.Div('Normal ', 'text ')
  .I('italic ').up
  .add('normal ')
  .B('red bold').color('red').up
  .margin('10px')
  .fontSize('20px');

// browser and server
div.html
// <div style="margin:10px;font-size:20px">Normal text <i>italic </i>normal <b style="color:red">red bold</b></div>

// browser only
div.show(); // attach dom node to document.body or provided node 
```

Add some [Boxes](#boxes) to handle asynchronous cases.
```javascript
const { Box, Div, Switch, Nothing } = nice;

const data = Box(Nothing);

const div = Box.by(data, Switch
      .string.use(s => Div('Data: ', s))
      .default(Div('Loading...')));

div.listen(d => console.log(d.html));
// <div>Loading...</div>



data('Some data');
// <div>Data: Some data</div>


div.show(); // will create and attach dome node and update it's state according to boxes states
```
