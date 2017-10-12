# Qualia `tryModify`

`tryModify` is a helper function for building Mongo modifiers for multiple
documents.

## Motivation

We commonly need to modify multiple documents in a collection, for example in a
loop:

```
let ids = ['idA', 'idB', 'idC'];
items.forEach(id => {
  MyCollection.update(id, {
    $set: {
      my_field: true,
    }
  });
});
```

In addition, we often require that all of the updates should succeed, or else
none of them should be applied at all.

In this simple example, we can reasonably expect all of the updates to succeed.

However, if we need more complex logic to determine each update modifier, it's
possible that we will get most of the way through this `forEach` iteration and
then fail to update an item. When that happens, we potentially will have
modified many documents in the collection, so it might be hard to undo the
changes.

`tryModify` provides a way to compute the full list of modifiers before applying
and of them to your collections, reducing the risk of failing in the middle of
a multi-document update.

## Usage

```
tryModify(modifierBuilder)
```

`tryModify` allows you to write code describing the updates you want to
perform, but it only applies them after you fully construct your modifier.

It takes a single argument, your `modifierBuilder` function, described below.

Here's an example, showing all of the available operations. Let's assume
we have a collection called `Fruits`:

```js
try {

  let results = tryModify(({insert, update, remove}) => {

    insert(Fruits, {
      name: 'Apple',
      shape: 'round',
    });

    update(Fruits, 'grape_id', {
      $set: {
        color: 'purple'
      }
    });

    // Compute something hard, maybe throwing an exception
    removeID = myFunctionThatMightThrowException();

    remove(Fruits, removeID);

  });

  // Results will be an array of the return values from Mongo for each modifier
  console.log(results) // e.g. [1, 1, 1]

} catch (e) {
  // Handle any exceptions thrown above if needed
}
```

Pass `tryModify` a callback with code to modify your collections. Your callback
will be invoked with an object containing the operator functions `insert`,
`update`, and `remove`, which are API-compatible with the Mongo versions except
that they require the collection as the first argument.

As you invoke these operator functions, `tryModify` appends the modifiers to
an internal list. When your function completes, `tryModify` replays the
modifiers on the collections you've specified.

If your function throws an exception, `tryModify` will allow it to bubble up,
and it won't apply any of the modifiers to any collection.