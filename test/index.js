
var request = require('superagent');
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
