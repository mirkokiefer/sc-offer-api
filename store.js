
var async = require('async');

module.exports = createS3Store;

function createS3Store() {
  var dict = {};

  return {
    writeItem: writeItem,
    readItem: readItem,
    readItems: readItems,
    deleteItem: deleteItem,
    readItemKeys: readItemKeys
  };

  function writeItem(key, data, cb) {
    dict[key] = data;
    cb();
  }

  function readItem(key, cb) {
    var offer = dict[key];
    cb(null, offer);
  }

  function readItems(keys, cb) {
    async.map(keys, readItem, cb);
  }

  function deleteItem(key, cb) {
    delete dict[key];
    cb();
  }

  function readItemKeys(cb) {
    var keys = Object.keys(dict);
    cb(null, keys);
  }
}