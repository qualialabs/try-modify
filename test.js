'use_strict';
import tryModify from './lib';

let spyFactory = (returnValue) => sinon.spy((...args) => {
  // Imitate meteor operations, async on the client and sync on the server
  if (Meteor.isClient) {
    let callback = args[args.length - 1];
    callback(null, returnValue);
    return returnValue;
  } else {
    return returnValue;
  }
});

let collectionStubFactory = () => {
  return {
    insert: spyFactory(1),
    update: spyFactory(1),
    remove: spyFactory(1),
  };
};

Tinytest.add('it inserts correctly', test => {
  let collectionStub = collectionStubFactory();
  let doc = {};
  tryModify(({insert, update, remove, upsert}) => {
    insert(collectionStub, doc);
  });
  sinon.assert.calledOnce(collectionStub.insert);
  sinon.assert.calledWith(collectionStub.insert, doc);
});

Tinytest.add('it updates correctly', test => {
  let collectionStub = collectionStubFactory();
  let doc = {};
  tryModify(({insert, update, remove, upsert}) => {
    update(collectionStub, 'id', doc, {upsert: true});
  });
  sinon.assert.calledOnce(collectionStub.update);
  sinon.assert.calledWith(collectionStub.update, 'id', doc, {upsert: true});
});

Tinytest.add('it removes correctly', test => {
  let collectionStub = collectionStubFactory();
  let doc = {};
  tryModify(({insert, update, remove, upsert}) => {
    remove(collectionStub, 'id');
  });
  sinon.assert.calledOnce(collectionStub.remove);
  sinon.assert.calledWith(collectionStub.remove, 'id');
});

Tinytest.addAsync('it collects the full sequence of operations before applying any', async (test, onComplete) => {
  let collectionStub = collectionStubFactory();
  collectionStub.insert = spyFactory(0);
  let doc = {};
  let results = tryModify(({insert, update, remove, upsert}) => {
    insert(collectionStub, doc);
    update(collectionStub, 'id', doc);
    remove(collectionStub, 'id');
    insert(collectionStub, 'id', doc);

    Object.keys(collectionStub).forEach(operation => {
      sinon.assert.notCalled(collectionStub[operation]);
    });
  });

  Object.keys(collectionStub).forEach(operation => {
    if (operation === 'insert') {
      sinon.assert.calledTwice(collectionStub[operation]);
    } else {
      sinon.assert.calledOnce(collectionStub[operation]);
    }
  });

  if (Meteor.isServer) {
    test.equal(results, [0, 1, 1, 0]);
    onComplete();
  } else {
    results = await Promise.all(results);
    test.equal(results, [0, 1, 1, 0]);
    onComplete();
  }
});

Tinytest.addAsync('it passes along exceptions thrown in the client function', (test, onComplete) => {
  let collectionStub = collectionStubFactory();
  if (Meteor.isServer) {
    // Throw exceptions synchronously on the server
    collectionStub.insert = sinon.stub().throws(new Error('oops'));
    try {
      tryModify(({insert, update, remove, upsert}) => {
        insert(collectionStub, 'id', {});
      });
      test.isTrue(false, 'this code should not execute');
    } catch (e) {
      test.equal(e.message, 'oops');
    }
    onComplete();
  } else {
    // Put exceptions in promises on the client
    collectionStub.insert = sinon.spy((...args) => {
      let callback = args[args.length - 1];
      callback('oops');
    });
    results = tryModify(({insert, update, remove, upsert}) => {
      insert(collectionStub, 'id', {});
    });
    Promise.all(results).then((res) => {
      test.isTrue(false, 'the promise should have been rejected');
    }).catch((err) => {
      test.equal(err, 'oops');
      onComplete();
    });
  }

});
