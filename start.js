
var port = process.env.PORT || 5000;
var hostname = process.env.HOSTNAME;
var store = require('s3store-mock')();

require('./index').start(hostname, port, store, function () {
  console.log('listening at %s:%s', hostname, port);
});