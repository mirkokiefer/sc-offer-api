
var port = process.env.PORT || 5000;
var hostname = process.env.PUBLIC_HOSTNAME || 'localhost';
var createStore = require('s3store');

var options = {
  key: process.env.AWS_KEY,
  secret: process.env.AWS_SECRET,
  bucket: process.env.S3_BUCKET,
  region: process.env.S3_REGION || 'eu-west-1',
  namespace: process.env.S3_NAMESPACE || 'offers'
};
var store = createStore(options);

require('./index').start(hostname, port, store, function () {
  console.log('listening at %s:%s', hostname, port);
});
