Control structures
===========

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
