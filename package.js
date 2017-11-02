Package.describe({
  name: 'qualia:try-modify',
  version: '0.0.3',
  summary: 'Construct multi-document Mongo modifiers transactionally',
  git: 'https://github.com/qualialabs/try-modify',
  documentation: 'README.md'
});

var dependencies = [
  'ecmascript',
];

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.4');
  api.use(dependencies);
  api.mainModule('lib.js');
});

Package.onTest(function(api) {
  api.versionsFrom('METEOR@1.4');
  api.use(dependencies);
  api.use([
    'tinytest',
    'practicalmeteor:sinon',
    'qualia:try-modify',
  ]);
  api.mainModule('test.js');
});
