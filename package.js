Package.describe({
  name: 'qualia:try-modify',
  version: '0.0.1',
  summary: '',
  git: 'https://github.com/qualialabs/try-modify',
  documentation: 'README.md'
});

var dependencies = [
  'ecmascript',
];

Package.onUse(function(api) {
  api.use(dependencies);
  api.mainModule('lib.js');
});

Package.onTest(function(api) {
  api.use(dependencies);
  api.use([
    'tinytest',
    'practicalmeteor:sinon',
    'qualia:try-modify',
  ]);
  api.mainModule('test.js');
});
