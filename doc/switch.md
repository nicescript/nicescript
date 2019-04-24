Switch
=======

nice.Switch is powerful alternative to native JS switch operator. 


```javascript
const { Switch, _1, _2 } = nice;

const f = v => Switch(v)
  .is(1)(11)
  .isNumber()(22)
  .isString().use(s => s + '!')
  .default(42);

f(1);           // 11
f(3);           // 22
f('Hello');     // "Hello!"
f([]);          // 42
```
To use nice.Switch

1. [Create](#creation) Switch 
2. Write any number of [Condition statement](#condition-statement) followed by 
  [Value statement](#value-statement)
3. [Close](#close-statement) Switch

## Creation

Create Switch with nice.Switch(value) or nice.Switch(nice._1)

## Condition statement
Condition could be:
* Any Check function registered in nice e.g. `isNumber()`, `gt(5)`, `includes(e)`
* `is(value)` - check if fist parameter equal to `value`
* `check(fun)` - check if function `fun` returns truly value
* `_1.`,`_2.`,`_3.` + Condition: `_2.isNumber()` will check if second argument is Number 

### Arguments order
All checks are called with arguments provided to Switch followed by arguments provided to check itself. 
```javascript
Switch(1,2)
  .gt()(-1)
  .lt()(+1)
  .default(0);

// is the same as 

Switch(1)
  .gt(2)(-1)
  .lt(2)(+1)
  .default(0);
```
If you write `Switch(1, 2).gt(3)` 3 will be ignored as gt takes only 2 arguments.

### Check explicit argument
You can add `_1.`,`_2.`,`_3.` before check to use only one explicit argument.
```javascript
Switch(1,10)
  ._2.gt(5)('Big')
  (); // Big

Switch(1,10)
  ._1.gt(5)('Big')
  (); // 1
```

## Value statement


## Close statement
* Close Switch by:
    * `()` - return matched value or first argument of Switch
    * `default(value)` - return matched value or `value` 
    * `default.use(fun)` - return matched value or call `fun` and return its result 
    * `throw(e)` - throw `e`


Instant argument
```javascript
nice.Check('isMeat', v => ['pork', 'beef'].includes(v));

const tiger = { say: console.log };

function feedTiger(tiger, food){
  tiger.hungry = nice.Switch(food)
    .isMeat()(false)
    .default.use(name => tiger.say('I do not like ' + name) || true);
}

feedTiger(tiger, 'apple');   // tiger.hungry === true
// > I do not like apple

feedTiger(tiger, 'beef');    // tiger.hungry === false
```


#### Switch vs Function overload
Function overload with different types and Switch operator could be used in 
similar use cases. Here is few  
* Overloaded Function will search for best match while Switch will use first match.
* 

| Feature        | Overloaded Function           | Switch  |
| ------------- |---------------                | ------|
| Match algorithm      | Best match                    | First match |
| Match algorithm      | Best match                    | First match |



```javascript
const f1 = () => 1, f2 = () => 2;

nice.Func.Nothing(f1).Null(f2)(null);                   // 2
nice.Switch(null).isNothing().use(f1).isNull.use(f2);   // 1
```
Besides current implementation of Switch use only first argument.