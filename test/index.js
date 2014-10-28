
var request = require('superagent');
var async = require('async');
var assert = require('assert');

var port = 2000;
var host = 'http://localhost:' + port;

var store = require('s3store-mock')();

before(function (done) {
  require('../index').start('localhost', port, store, done);
});

var offer1 = createOfferData('Fancy');
var offer2 = createOfferData('Schmancy');
var testOffers = [offer1, offer2];

describe('Offer API', function () {
  it('should fail to create an offer with missing properties', function(done) {
    var requiredProperties = [
      'type',
      'provider_id',
      'regions',
      'title',
      'valid_from',
      'valid_until',
      'delivery_date',
      'status'
    ];
    async.eachSeries(requiredProperties, function(key, cb) {
      var offerData = createSomeValidOfferData();
      offerData[key] = undefined;
      request.post(host + '/offers')
        .send(offerData)
        .end(function(err, res) {
          if (err) return cb(err);
          assert.equal(res.status, 400);
          cb();
        });
    }, done);
  });
  it('should create offer1', function (done) {
    request
      .post(host + '/offers')
      .send(offer1)
      .end(function (err, res) {
        assert.equal(res.status, 201);
        assert.ok(res.body.offer_id);
        assert.ok(res.body.offer_url);
        offer1.offer_id = res.body.offer_id;
        offer1.offer_url = res.body.offer_url;
        done();
      });
  });
  it('should fetch offer1', function (done) {
    request
      .get(offer1.offer_url)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, offer1);
        done();
      });
  });
  it('should create offer2', function (done) {
    var offer = createOfferData();
    request
      .post(host + '/offers')
      .send(offer2)
      .end(function (err, res) {
        assert.equal(res.status, 201);
        offer2.offer_id = res.body.offer_id;
        offer2.offer_url = res.body.offer_url;
        done();
      });
  });
  it('should fetch all offers', function (done) {
    request
      .get(host + '/offers')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, {offers: testOffers});
        done();
      });
  });
  it('should update offer1', function (done) {
    offer1.title = 'Think different!';
    request
      .put(offer1.offer_url)
      .send(offer1)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });
  it('should fetch updated offer1', function (done) {
    request
      .get(offer1.offer_url)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, offer1);
        done();
      });
  });
  it('should delete offer2', function (done) {
    request
      .del(offer2.offer_url)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });
  it('should only receive offer1', function (done) {
    request
      .get(host + '/offers')
      .end(function (err, res) {
        assert.deepEqual(res.body, {offers: [offer1]});
        done();
      });
  });
  it('should return 404 for non-existent offer', function (done) {
    request
      .get(offer2.offer_url)
      .end(function (err, res) {
        assert.equal(res.status, 404);
        done();
      });
  });
});

function createOfferData(title) {
  return {
    title: title,
    provider_id: '100',
    pages: []
  };
}

function createSomeValidOfferData() {
  return {
    type: 'catalog',
    provider_id: 'mcdonalds',
    regions: ['DE', 'US'],
    title: 'Awesome Title',
    valid_from: '2014-10-29T00:00:00.000Z',
    valid_until: '2014-11-30T00:00:00.000Z',
    delivery_date: '2014-10-28T00:00:00.000Z',
    status: 'created',
    pages: [{
      title: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy',
      pic_url: 'http://example.com/images/682d6250-5eaf-11e4-8d59-59d9e4019ad5/medium',
      pic_metadata_url: 'http://example.com/images/682d6250-5eaf-11e4-8d59-59d9e4019ad5',
      store_url: 'http://foo.bar.baz'
    }, {
      pic_url: 'http://example.com/images/682ec1e0-5eaf-11e4-8d59-59d9e4019ad5/medium',
      pic_metadata_url: 'http://example.com/images/682ec1e0-5eaf-11e4-8d59-59d9e4019ad5',
      store_url: 'http://foo2.bar.baz/123'
    }, {
      title: 'eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. A',
      pic_url: 'http://example.com/images/68302170-5eaf-11e4-8d59-59d9e4019ad5/medium',
      pic_metadata_url: 'http://example.com/images/68302170-5eaf-11e4-8d59-59d9e4019ad5',
    }],
    is_fullscreen: true
  };
}