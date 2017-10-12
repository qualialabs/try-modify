'use_strict';
import tryModify from './lib';

let collectionStubFactory = () => {
  return {
    insert: sinon.stub().returns(1),
    update: sinon.stub().returns(1),
    remove: sinon.stub().returns(1),
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

Tinytest.add('it collects the full sequence of operations before applying any', test => {
  let collectionStub = collectionStubFactory();
  collectionStub.insert.returns(0);
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

  test.equal(results, [0, 1, 1, 0]);
});

Tinytest.add('it passes along exceptions thrown in the client function', test => {
  let collectionStub = collectionStubFactory();
  collectionStub.insert = sinon.stub().throws(new Error('oops'));
  try {
    tryModify(({insert, update, remove, upsert}) => {
      insert(collectionStub, 'id', {});
    });
    test.isTrue(false, 'this code should not execute');
  } catch (e) {
    test.equal(e.message, 'oops');
  }
});
