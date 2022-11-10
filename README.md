NiceScript
=========

Set of JavaScript functions that provide following features without compilation 
or configuration:

* [Reactive data flow](#boxes)
* [Type System](#types)
* [Reactive HTML and CSS](#html)
* [Unit tests](#tests) 
* Utility functions and control structues



You can use any of them independently or as a whole in any JS project. 


## Rationale
Create web applications with 
* less code overall
* much less imperative code
* only JS syntax (less build code)

NiceScript encourage use of component approach, functional programming, and unit tests.
But doesn't force you to do so. 

## Example application: To Do list

Here you can search, add, and remove tasks. 
Notice how little imperative code does it have.


```javascript
const { Box, RBox, Div, Input, wrapMatches } = nice;

const tasks = Box(['Feed the fish', 'Buy milk', 'Walk the dog']);

const taskView = t => Div()
  .A(() => tasks.removeValue(t), 'x').float('right').textDecoration('none').up
  .add(wrapMatches(t, input.boxValue()))
  .margin('1em 0').padding('.5em').borderRadius('.3em').backgroundColor('#DEF');

const input = Input().padding('.5em').width('100%').boxSizing('border-box')
  .on('keyup', e => e.key === 'Enter' 
      && (tasks.push(e.target.value), e.target.value = ''));
  
const list = RBox(tasks, input.boxValue, (tt, s) => 
  Div(tt.filter(t => t.toLowerCase().includes(s.toLowerCase())), taskView));
  
Div(input, list).font('1.2rem Arial').show();
```
[JS Bin](https://jsbin.com/setizekuqu/edit?html,output) TODO: update source

Let's look at it step by step:
```javascript
const { Box, RBox, Div, Input, wrapMatches } = nice;
```
Import some functions from NiceScript. 
Functions that starts with capital letter are constructors.

`Box` is simple observable component. 
`RBox` (reactive box) keeps track of other states and updates it's state with given function when inputs do.

`Div` and `Input` for creating Dom elements.

`wrapMatches` takes a string and a patern, and then... // TODO: use ebbedded help to explain

```javascript
const tasks = Box(['Feed the fish', 'Buy milk']);
```
Initial task list.

```javascript
const taskView = t => Div()
  .A(() => tasks.removeValue(t), 'x').float('right').textDecoration('none').up
  .add(wrapMatches(t, input.boxValue()))
  .margin('1em 0').padding('.5em').borderRadius('.3em').backgroundColor('#DEF');
```

Function that takes string and return single task representaion. 
Here we create div element, attach link that deletes task,
add task text with search input highlighted, and give styling.

Adding elements with capital letter will shift focus to that element. 
We need to use `.up` to go back to `Div` defenition.
If we don't need styling for link, we can go with `Div().a(link, text)`.
Focus will stay on the `Div`.


```javascript
const input = Input().padding('.5em').width('100%').boxSizing('border-box')
  .on('keyup', e => e.key === 'Enter' 
      && (tasks.push(e.target.value), e.target.value = ''));
```
Input element for search and create tasks.


```javascript
const list = RBox(tasks, input.boxValue, (tt, s) => 
  Div(tt.filter(t => t.toLowerCase().includes(s.toLowerCase())), taskView));
```
Reactive box for task list view. It updates every time `tasks` or input value changes.


`Div` takes children as arguments. 
You can also call it with array to add all elements. 
`Div[]` is short for `Div(...[])`.
`Div([], function)` is short for `Div(...[].map(function))`.


```javascript
Div(input, list).font('1.2rem Arial').show();
```
Final step. 
Create element with `input` and `list`, give it some styling, and show it.
`.show()` will create DOM node and attach it `document.body` or another provided node.

You can also use `Div().html` to render on server.







More examples:

* [Ball game](./examples/ball.html) ( [JS Bin](https://jsbin.com/wimayanovu/1/edit?html,output) )
* [Todo list](./examples/todo.html) ( [JS Bin](https://jsbin.com/yetufekopi/1/edit?html,output) )
* [Tic Tac Toe](./examples/tictactoe.html) 
  ( [JS Bin](https://jsbin.com/yozupufaci/edit?html,output) )
  ( [Tutorial](https://medium.com/@sergey.kashulin/creating-web-applications-with-nicescript-338184d18331) )

## Install
Node.js:

`npm install nicescript`

use:

`const nice = require('nicescript')();`

&nbsp;

Browser:

`<script src="https://unpkg.com/nicescript/nice.js"></script>`

or

`<script src="https://cdn.jsdelivr.net/npm/nicescript/nice.js"></script>`

<!--
## Basic features



### Nice values

### Types

Each value in NiceScript has a type. Here is a root of types hierarchy:  

+ Anything
  + Something
    + Value
      + Obj
        + Arr
        + [Html](#html)
      + Single
        + Str
        + Num
        + Bool
    + [Function](#functions)
    + [Box](#boxes)
    + Ok
  + Nothing
    + Error
    + Undefined
    + Null
    + Fail
    + ...


#### Wrapping values
Call nice with js value to wrap it with most appropriate type.
```javascript
const nice = require('nicescript')();
nice(4);        // nice.Num;
nice("");       // nice.Str;
nice(true);     // nice.Bool;
nice({});       // nice.Obj;
nice([]);       // nice.Arr;
nice(1, 2, 3);  // nice.Arr;
nice(null);     // nice.Null;
```


#### User types
```javascript
nice.Type('Dog')
  .str('title')
  .num('weight')
  .by((z, title) => z.title(title));

const d = nice.Dog('Jim').weight(5);
d.name();       // Jim 
d.weight();     // 5

// by default created type extends nice.Obj
d.isObj()   // true

```
Type name should start with capital letter.


### Functions

```javascript
// Creating anonymous function
const f = nice.Func(n => n + 1);
f(1);               // 2

// Named functions will be added to nice
const plusTwo = nice.Func('plusTwo', n => n + 2);
//or nice.Func(function plusTwo(n) { return n + 2; });
plusTwo(1);         // 3
nice.plusTwo(1);    // 3

// Check argument type
const x2 = nice.Func.Number('x2', n => n * 2);
x2(21);             // 42
nice.x2(21);        // 42
nice.Num(1).x2();// 42
x2('q');            // throws "Function  can't handle (Str)"

// now let's overload x2 for strings
x2.String(s => s + '!');
x2(21);             // 42
x2('q');            // q!

```
Function name should start with lowercase letter. 

#### Function types

##### Mapping
Clean function that do not changes it's arguments. 
NiceScript will always [wrap](#wrapping-values) result of Mapping. 

```javascript
nice.Mapping.Num.Num('times', (a, b) => a * b);
const n = nice(5);
const n2 = n.times(3).times(2); // nice.Num(30)
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
nice.Action.Num.Num('times', (a, b) => a * b);
const n = nice(5);
n.times(3).times(2);            // n
n();                            // 30;
```


### Switch
Delayed argumet
```javascript
const f = nice.Switch
  .equal(1)(11)
  .isNumber(22)
  .isString.use(s => s + '!')
  .isNothing(':(')
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
nice.Check('isMeat', v => ['pork', 'beef'].includes(v));
const tiger = { say: console.log };
function feedTiger(tiger, food){
  tiger.hungry = nice.Switch(food)
    .isMeat(false)
    .default.use(name => tiger.say('I do not like ' + name) || true);
}

feedTiger(tiger, 'apple');   // tiger.hungry === true
// > I do not like apple

feedTiger(tiger, 'beef');    // tiger.hungry === false
```
#### Switch vs Function overload
Overloaded Function will search for best match while Switch will use first match.
```javascript
nice.Func.Nothing(() => 1).Null(() => 2)(null);                 // 2
nice.Switch(null).isNothing.use(() => 1).isNull.use(() => 2);   // 1
```
Besides current implementation of Switch use only first argument.

 
### Boxes
Stateful observable components. 

```javascript
const { Box, RBox } = nice;
const b = Box(1);     // create box with 1 in it
b.subscribe(v => console.log('b:', v));
//b: 1

b(2);                 // write value
//b: 2
b();                  // read value
//2

// create reactive Box that follows changes in b
const b2 = RBox(b, n => n * 2);
b(3);                 // b2() === 6
```

#### BoxSet



### Html
```javascript
const div = nice.Div('Normal ', 'text ')
  .i('italic ')
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

const div = RBox(data, Switch
      .isString.use(s => Div('Data: ', s))
      .default(Div('Loading...')));

div.listen(d => console.log(d.html));
// <div>Loading...</div>



data('Some data');
// <div>Data: Some data</div>


div.show(); // will create and attach dome node and update it's state according to boxes states
```


## Tests

```javascript
const { expect, TestSet } = nice;
const app = {};

// Create test set
const test = nice.TestSet(app);

obj.x2 = x => x*2;

// Create test
test("Double value", (x2) => { // x2 found in app 
  expect(x2(3)).is(6);
  
  // nested tests are ok
  test("Double mapping", (Spy) => { // no app.Spy found so nice.Spy provided
    const f = Spy(x2);
    expect([1,2].map(f)).deepEqual([2,4]);
    expect(f).calledTwice();
  })
});

// Create custom check
nice.Check('isBig', n => n > 10);

test((x2) => {
  expect(x2(6)).isBig();
  expect(x2(4)).not.isBig();
});

// Run tests
test.run();
//Tests done. OK: 3, Error: 0 (1ms)

```

You can use any created `Check` after `expect(value)`

[Top](#nicescript)

### Old

* [Functions](#functions) - adds couple features to regular JS functions.
* [Switch](#switch) - finally convenient.


---------------
Calling [mapping](#mapping) on box will create new box that follows changes in the original.
```javascript
const a = nice.Box('qwe');
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
-->