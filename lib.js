let tryModify = (modifierBuilder) => {
  let modList = [];
  let operationFactory = (operation) => (collection, ...args) => modList.push({
    operation,
    collection,
    args,
  });

  let operations = {
    insert: operationFactory('insert'),
    update: operationFactory('update'),
    remove: operationFactory('remove'),
  };

  modifierBuilder(operations);

  return modList.map(({operation, collection, args}) => {
    return collection[operation].apply(collection, args);
  });
};

export {tryModify};
export default tryModify;
