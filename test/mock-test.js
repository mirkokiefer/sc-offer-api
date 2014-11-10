
var request = require('superagent');
var async = require('async');
var assert = require('assert');

var port = 2003;
var host = 'http://localhost:' + port;

var store = require('s3store-mock')();

describe('mock data write and read', function () {
  var server = require('../index')(host, store);
  before(function (done) {
    server.listen(port, done);
  });
  after(function (done) {
    server.close(done);
  });
  var offers = require('./test_offers').offers;
  it('should write all test offers', function (done) {
    async.eachSeries(offers, writeOffer, done);
    function writeOffer(offer, cb) {
      request
        .post(host + '/offers')
        .send(offer)
        .end(function (err, res) {
          assert.equal(res.status, 201);
          offer.offer_id = res.body.offer_id;
          delete offer.offer_url;
          cb();
        });
    }
  });
  it('should read all test offers', function (done) {
    request
      .get(host + '/offers')
      .end(function (err, res) {
        var offers = res.body.offers;
        offers.forEach(function (each) {
          delete each.offer_url;
        });
        assert.deepEqual(res.body.offers.sort(sortByOfferID), offers.sort(sortByOfferID));
        done();
      });
    function sortByOfferID(a, b) {
      if (a.offer_id > b.offer_id) {
        return 1;
      }
      if (a.offer_id < b.offer_id) {
        return -1;
      }
      return 0;
    }
  });
});