
var restify = require('restify');
var uuid = require('node-uuid').v4;
var url = require('url');

module.exports = {
  start: start
};

function start(hostname, port, cb) {
  var server = createServer(resolveURL);
  server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
    cb();
  });

  function resolveURL(pathname) {
    return url.format({
      protocol: 'http',
      hostname: hostname,
      port: port,
      pathname: pathname
    });
  }
}

function createServer(resolveURL) {
  var server = restify.createServer({name: 'offer_api'});
  server.use(restify.bodyParser());

  server.post('/offers', postOffer);
  server.get('/offers/:offer_id', getOffer);
  server.put('/offers/:offer_id', putOffer);
  server.del('/offers/:offer_id', deleteOffer);
  server.get('/offers', getOffers);

  var store = require('./store')();
  return server;

  function postOffer(req, res, next) {
    var id = uuid();
    var offer = req.body;
    offer.offer_id = id;
    store.writeItem(id, offer, function (err) {
      var responseBody = {
        offer_id: id,
        offer_url: createOfferURL(offer.offer_id)
      };
      res.send(201, responseBody);
    });
  }

  function getOffer(req, res, next) {
    var offerID = req.params.offer_id;
    store.readItem(offerID, function (err, offer) {
      offer.offer_url = createOfferURL(offer.offer_id);
      res.send(200, offer);
    });
  }

  function putOffer(req, res, next) {
    var offerID = req.params.offer_id;
    var offer = req.body;
    offer.offer_id = offerID;
    store.writeItem(offerID, offer, function (err) {
      res.send(200);
    });
  }

  function deleteOffer(req, res, next) {
    var offerID = req.params.offer_id;
    store.deleteItem(offerID, function (err) {
      res.send(200);
    });
  }

  function getOffers(req, res, next) {
    store.readItemKeys(function (err, keys) {
      store.readItems(keys, function (err, offers) {
        var mappedOffers = offers.map(function (each) {
          each.offer_url = createOfferURL(each.offer_id);
          return each;
        });
        res.send(200, {offers: mappedOffers});
      });
    });
  }

  function createOfferURL(offerID) {
    return resolveURL('offers/' + offerID);
  }
}
