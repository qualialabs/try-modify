# Qualia `tryModify`

`tryModify` is a helper function for building Mongo modifiers for multiple
documents.

## Motivation

We commonly need to modify multiple documents in a collection, for example in a
loop:

```js
let ids = ['idA', 'idB', 'idC'];
ids.forEach(id => {
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
then fail to update an item:

```js
let ids = ['idA', 'idB', 'idC'];
ids.forEach(id => {
  if (Math.random() > 0.5) {
    throw new Error('which updates have run? :)');
  }
  MyCollection.update(id, {
    $set: {
      my_field: true,
    }
  });
});
```

When an iterating update fails, we potentially will have modified many documents
in the collection, so it might be hard to undo the changes.

`tryModify` provides a way to compute the full list of modifiers before applying
any of them to your collections, reducing the risk of failing in the middle of
a multi-document update.

## Usage

```js
tryModify(modifierBuilder);
```

`tryModify` allows you to write code describing the updates you want to
perform, but it only applies them after you fully construct your modifier.

It takes a single argument, your `modifierBuilder` function, described below.
The modifier builder calls stubbed collection operation functions. If it
completes without throwing exceptions, all of the operations are applied to
the collection.

`tryModify` returns different things depending on where it runs:

* on the server, collection updates are synchronous, and `tryModify`
synchronously returns an array of the result of each collection operation, in
order.
* on the client, collection updates are asynchronous, and `tryModify` returns
an array of promises, each of which resolves to the result of the corresponding
collection operation.

Here's the above simple example, updated to use `tryModify`:

```js
tryModify(({update}) => {
  let ids = ['idA', 'idB', 'idC'];
  ids.forEach(id => {
    if (Math.random() > 0.5) {
      throw new Error('At least no updates have run yet! :)');
    }
    update(MyCollection, id, {
      $set: {
        my_field: true,
      }
    });
  });
});
```

Pass `tryModify` a callback with code to modify your collections. Your callback
will be invoked with an object containing the operator functions `insert`,
`update`, and `remove`, which are API-compatible with the Mongo versions except
that they require the collection as the first argument. Above, we only use
`update`, so it's the only argument we destructure.

As you invoke the operator functions, `tryModify` appends the modifiers to
an internal list. When your function completes, `tryModify` replays the
modifiers on the collections you've specified.

If your function throws an exception, `tryModify` will allow it to bubble up,
and it won't apply any of the modifiers to any collection.

If we end up throwing an exception above, then we can rest assured that `MyCollection`
has not been modified at all. If we happen to make it through the `forEach` iteration
without throwing, then our three updates will be applied to `MyCollection` in the
order we called `update`.

Here's a more complete example, showing all of the available operations. Let's assume
we have a collection called `Fruits`:

```js
try {
  let promisesOrResults = tryModify(({insert, update, remove}) => {
    insert(Fruits, {
      name: 'Apple',
      shape: 'round',
    });

    let purpleIDs = ['grape_id', 'plum_id', 'acai_id'];
    purpleIDs.forEach(id => {
      update(Fruits, id, {
        $set: {
          color: 'purple'
        }
      });
    });

    // Compute something hard, maybe throwing an exception
    removeID = myFunctionThatMightThrowException();
    remove(Fruits, removeID);
  });
} catch(e) {
  // Handle any errors thrown while building the modifier. On the server,
  // collection updates happen synchronously, so this block will also catch
  // errors thrown while applying the operations to the collections.
}

// Depending on where you call tryModify, the results are different:

if (Meteor.isClient) {
  // On the client, we don't know if the updates succeeded until later:
  try {
    let results = await Promise.all(promisesOrResults);
    console.log(results); // e.g. "inserted-apple-id", 1, 1, 1, 1
  } catch (e) {
    // Something went wrong while applying the updates to the collection
  }
} else {
  // On the server, `promises` is just an array of results, so the await is not
  // necessary. At this point, all updates have already been applied.
  console.log(promisesOrResults); // e.g. "inserted-apple-id", 1, 1, 1, 1
}
```
