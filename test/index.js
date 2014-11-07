
var request = require('superagent');
var async = require('async');
var assert = require('assert');
var _ = require('underscore');

var port = 2000;
var host = 'http://localhost:' + port;

var store = require('s3store-mock')();

before(function (done) {
  require('../index').start(host, port, store, done);
});

var offer1 = createSomeValidCatalog('Fancy');
var offer2 = createSomeValidCatalog('Schmancy');
var testOffers = [offer1, offer2];

describe('Offer API', function () {
  it('should fail to create a catalog with missing mandatory properties', function(done) {
    var requiredProperties = [
      'type',
      'provider_id',
      'regions',
      'title',
      'valid_from',
      'valid_until',
      'delivery_date',
      'status',
      'pages',
      'splash_pic',
      'highres_pic_url'
    ];
    async.eachSeries(requiredProperties, function(key, cb) {
      var offerData = createSomeValidCatalog('Awesome Title');
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
  it('should fail to create a catalog with missing mandatory properties in pages', function(done) {
    var requiredProperties = [
      'pic_url',
      'highres_pic_url'
    ];
    async.eachSeries(requiredProperties, function(key, cb) {
      var offerData = createSomeValidCatalog('Awesome Title');
      offerData.pages[0][key] = undefined;
      request.post(host + '/offers')
        .send(offerData)
        .end(function(err, res) {
          if (err) return cb(err);
          assert.equal(res.status, 400);
          cb();
        });
    }, done);
  });
  it('should fail to create a coupon with missing mandatory properties', function(done) {
    var requiredProperties = [
      'type',
      'provider_id',
      'regions',
      'title',
      'valid_from',
      'valid_until',
      'delivery_date',
      'status',
      'text',
      'pic_url',
      'splash_pic',
      'highres_pic_url'
    ];
    async.eachSeries(requiredProperties, function(key, cb) {
      var offerData = createSomeValidCoupon('Awesome Title');
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
  it('should fail to create an online-coupon with missing mandatory properties', function(done) {
    var requiredProperties = [
      'type',
      'provider_id',
      'regions',
      'title',
      'valid_from',
      'valid_until',
      'delivery_date',
      'status',
      'text',
      'pic_url',
      'splash_pic',
      'highres_pic_url',
      'affiliate_url'
    ];
    async.eachSeries(requiredProperties, function(key, cb) {
      var offerData = createSomeValidOnlineCoupon('Awesome Title');
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
    var offer = createSomeValidCatalog('Awesome Title');
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
  it('should return 404 when trying to read non-existent offer', function (done) {
    request
      .get(offer2.offer_url)
      .end(function (err, res) {
        assert.equal(res.status, 404);
        done();
      });
  });
  it('should return 404 when trying to update non-existent offer', function (done) {
    request
      .put(offer2.offer_url)
      .send(offer2)
      .end(function (err, res) {
        assert.equal(res.status, 404);
        done();
      });
  });
  it('should remove superfluous properties', function (done) {
    var someOffer = createSomeValidCatalog('Title1');
    someOffer.foo = 'bar';
    request
      .post(host + '/offers')
      .send(someOffer)
      .end(function (err, res) {
        assert.equal(res.status, 201);
        assert.ok(res.body.offer_id);
        assert.ok(res.body.offer_url);
        request.get(res.body.offer_url)
          .end(function(err, res) {
            assert.equal(res.status, 200);
            var fetchedOffer = res.body;
            someOffer.offer_id = fetchedOffer.offer_id;
            someOffer.offer_url = fetchedOffer.offer_url;
            assert.deepEqual(_.omit(someOffer, 'foo'), fetchedOffer);
            done();
          });
      });
  });
});

function createSomeValidCatalog(title) {
  return {
    type: 'catalog',
    provider_id: 'mcdonalds',
    regions: ['DE', 'US'],
    title: title,
    valid_from: '2014-10-29T00:00:00.000Z',
    valid_until: '2014-11-30T00:00:00.000Z',
    delivery_date: '2014-10-28T00:00:00.000Z',
    status: 'created',
    splash_pic: {
      url: 'http://example.com/images/a289cd00-5ebc-11e4-8d59-59d9e4019ad5/low',
      width: 123,
      height: 321
    },
    highres_pic_url: 'http://example.com/images/a289cd00-5ebc-11e4-8d59-59d9e4019ad5/high',
    pages: [{
      title: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy',
      pic_url: 'http://example.com/images/682d6250-5eaf-11e4-8d59-59d9e4019ad5/medium',
      highres_pic_url: 'http://example.com/images/a289cd00-5ebc-11e4-8d59-59d9e4019ad5/high',
      store_url: 'http://foo.bar.baz'
    }, {
      pic_url: 'http://example.com/images/682ec1e0-5eaf-11e4-8d59-59d9e4019ad5/medium',
      highres_pic_url: 'http://example.com/images/a289cd00-5ebc-11e4-8d59-59d9e4019ad5/high',
      store_url: 'http://foo2.bar.baz/123'
    }, {
      title: 'eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. A',
      pic_url: 'http://example.com/images/68302170-5eaf-11e4-8d59-59d9e4019ad5/medium',
      highres_pic_url: 'http://example.com/images/a289cd00-5ebc-11e4-8d59-59d9e4019ad5/high',
    }],
    is_fullscreen: true
  };
}

function createSomeValidOnlineCoupon(title) {
  return {
    type: 'online_coupon',
    title: title,
    provider_id: 'burger-king',
    text: 'Lorem ipsum',
    affiliate_url: 'http://coupon.bar.baz',
    pic_url: 'http://example.com/images/a289cd00-5ebc-11e4-8d59-59d9e4019ad5/medium',
    splash_pic: {
      url: 'http://example.com/images/a289cd00-5ebc-11e4-8d59-59d9e4019ad5/low',
      width: 123,
      height: 321
    },
    highres_pic_url: 'http://example.com/images/a289cd00-5ebc-11e4-8d59-59d9e4019ad5/high',
    status: 'created',
    regions: ['ES', 'CA'],
    valid_from: '2014-10-28T00:00:00.000Z',
    valid_until: '2014-11-28T00:00:00.000Z',
    delivery_date: '2014-10-28T00:00:00.000Z',
    terms_and_conditions: 'Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
  };
}

function createSomeValidCoupon(title) {
  return {
    type: 'coupon',
    title: title,
    provider_id: 'burger-king',
    text: 'Lorem ipsum',
    pic_url: 'http://example.com/images/a289cd00-5ebc-11e4-8d59-59d9e4019ad5/medium',
    splash_pic: {
      url: 'http://example.com/images/a289cd00-5ebc-11e4-8d59-59d9e4019ad5/low',
      width: 123,
      height: 321
    },
    highres_pic_url: 'http://example.com/images/a289cd00-5ebc-11e4-8d59-59d9e4019ad5/high',
    status: 'created',
    regions: ['ES', 'CA'],
    barcode: {
      format: 'CODE_39',
      content: 'code123'
    },
    valid_from: '2014-10-28T00:00:00.000Z',
    valid_until: '2014-11-28T00:00:00.000Z',
    delivery_date: '2014-10-28T00:00:00.000Z',
    terms_and_conditions: 'Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
  };
}