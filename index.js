
var restify = require('restify');
var uuid = require('node-uuid').v4;
var url = require('url');
var async = require('async');
var joi = require('joi');
var moment = require('moment');
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
    var mapped = mapOffer(offer);
    store.writeObject(id, mapped, function (err) {
      if (err) {
        return res.send(err.statusCode, err.message);
      }
      var responseBody = {
        offer_id: mapped.offer_id,
        offer_url: createOfferURL(mapped.offer_id)
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
      var mapped = mapOffer(offer);
      mapped.offer_url = createOfferURL(offer.offer_id);
      res.send(200, mapped);
    });
  }

  function putOffer(req, res, next) {
    var offerID = req.params.offer_id;
    var updatedOffer = req.body;
    store.readObject(offerID, function(err, existing) {
      if (err) {
        return res.send(err.statusCode, err.message);
      }
      if (!existing) {
        return next(new restify.NotFoundError());
      }
      updatedOffer.offer_id = offerID;
      store.writeObject(offerID, updatedOffer, function (err) {
        if (err) {
          return res.send(err.statusCode, err.message);
        }
        res.send(200);
      });
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

function mapOffer(data) {
  var simpleKeys = {
    offer_id: true,
    type: true,
    provider_id: true,
    regions: true,
    title: true,
    status: true,
    targeted_card_numbers: true,
    terms_and_conditions: true,
    is_fullscreen: true,
    pic_url: true,
    pic_metadata_url: true,
    text: true,
    affiliate_url: true,
    coupon_code: true
  };
  var mapped = {};
  Object.keys(simpleKeys).forEach(function(key) {
    mapped[key] = data[key];
  });
  mapped.valid_from = moment(data.valid_from).toDate();
  mapped.valid_until = moment(data.valid_until).toDate();
  mapped.delivery_date = moment(data.delivery_date).toDate();
  if (data.pages) {
    mapped.pages = mapPages(data.pages);
  }
  if (data.barcode) {
    mapped.barcode = mapBarcode(data.barcode);
  }
  return mapped;

  function mapPages(pages) {
    return pages.map(function(page) {
      return {
        pic_url: page.pic_url,
        pic_metadata_url: page.pic_metadata_url,
        title: page.title,
        store_url: page.store_url
      };
    });
  }

  function mapBarcode(barcode) {
    return {
      content: barcode.content,
      format: barcode.format
    };
  }
}