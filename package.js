Package.describe({
  name: 'qualia:try-modify',
  version: '0.0.2',
  summary: 'Construct multi-document Mongo modifiers transactionally',
  git: 'https://github.com/qualialabs/try-modify',
  documentation: 'README.md'
});

var dependencies = [
  'ecmascript@0.9.0',
];

Package.onUse(function(api) {
  api.use(dependencies);
  api.mainModule('lib.js');
});

Package.onTest(function(api) {
  api.use(dependencies);
  api.use([
    'tinytest@1.0.12',
    'practicalmeteor:sinon@1.10.3_2',
    'qualia:try-modify@0.0.2',
  ]);
  api.mainModule('test.js');
});
