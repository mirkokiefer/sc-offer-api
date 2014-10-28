
var restify = require('restify');
var uuid = require('node-uuid').v4;
var url = require('url');
var async = require('async');
var joi = require('joi');
var offerValidationSchemata = require('./lib/offer-schemata');

module.exports = {
  start: start
};

function start(hostname, port, store, cb) {
  var server = createServer(store, resolveURL);
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

function createServer(store, resolveURL) {
  var server = restify.createServer({name: 'offer_api'});
  server.use(restify.bodyParser());

  server.post('/offers', validateOfferBody, postOffer);
  server.get('/offers/:offer_id', getOffer);
  server.put('/offers/:offer_id', validateOfferBody, putOffer);
  server.del('/offers/:offer_id', deleteOffer);
  server.get('/offers', getOffers);

  return server;

  function postOffer(req, res, next) {
    var id = uuid();
    var offer = req.body;
    offer.offer_id = id;
    store.writeObject(id, offer, function (err) {
      if (err) {
        return res.send(err.statusCode, err.message);
      }
      var responseBody = {
        offer_id: id,
        offer_url: createOfferURL(offer.offer_id)
      };
      res.send(201, responseBody);
    });
  }

  function getOffer(req, res, next) {
    var offerID = req.params.offer_id;
    store.readObject(offerID, function (err, offer) {
      if (err) {
        return res.send(err.statusCode, err.message);
      }
      if (!offer) {
        return next(new restify.NotFoundError());
      }
      offer.offer_url = createOfferURL(offer.offer_id);
      res.send(200, offer);
    });
  }

  function putOffer(req, res, next) {
    var offerID = req.params.offer_id;
    var offer = req.body;
    offer.offer_id = offerID;
    store.writeObject(offerID, offer, function (err) {
      if (err) {
        return res.send(err.statusCode, err.message);
      }
      res.send(200);
    });
  }

  function deleteOffer(req, res, next) {
    var offerID = req.params.offer_id;
    store.deleteObject(offerID, function (err) {
      if (err) {
        return res.send(err.statusCode, err.message);
      }
      res.send(200);
    });
  }

  function getOffers(req, res, next) {
    store.readKeys(function (err, keys) {
      if (err) {
        return res.send(err.statusCode, err.message);
      }
      async.map(keys, store.readObject, function (err, offers) {
        if (err) {
          return res.send(err.statusCode, err.message);
        }
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

  function validateOfferBody(req, res, next) {
    var offer = req.body;
    if (!offer) {
      return next(new restify.BadRequestError());
    }
    joi.validate(offer, offerValidationSchemata.base, {
      abortEarly: false,
      convert: false,
      allowUnknown: true
    }, function(err) {
      if (err) {
        return next(new restify.BadRequestError(err.message));
      }
      var offerType = offer.type;
      var schemaForType = offerValidationSchemata[offerType];
      joi.validate(offer, schemaForType, {
        abortEarly: false,
        convert: false,
        allowUnknown: true
      }, function(err) {
        if (err) {
          return next(new restify.BadRequestError(err.message));
        }
        next();
      });
    });
  }
}
