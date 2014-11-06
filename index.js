
var restify = require('restify');
var uuid = require('node-uuid').v4;
var url = require('url');
var async = require('async');
var joi = require('joi');
var moment = require('moment');
var bunyan = require('bunyan');
var createPrettyStream = require('bunyan-pretty');
var offerValidationSchemata = require('./lib/offer-schemata');

module.exports = {
  start: start
};

function start(host, port, store, cb) {
  var server = createServer(store, resolveURL);
  server.listen(port, cb);

  function resolveURL(pathname) {
    return url.resolve(host, pathname);
  }
}

function createServer(store, resolveURL) {
  var server = restify.createServer({name: 'offer_api'});
  server.use(restify.bodyParser());
  server.on('after', restify.auditLogger({
    log: bunyan.createLogger({
      name: 'audit',
      stream: process.stdout.isTTY ? createPrettyStream() : process.stdout,
      level: 'info'
    })
  }));

  server.get('/', getStatus);
  server.get('/restart', function (req) {
    process.exit(1);
  });
  server.post('/offers', validateOfferBody, postOffer);
  server.get('/offers/:offer_id', getOffer);
  server.put('/offers/:offer_id', validateOfferBody, putOffer);
  server.del('/offers/:offer_id', deleteOffer);
  server.get('/offers', getOffers);

  return server;

  function getStatus(req, res, next) {
    res.send(200, {running: true, offers: resolveURL('offers')});
    return next();
  }

  function postOffer(req, res, next) {
    var id = uuid();
    var offer = req.body;
    offer.offer_id = id;
    var mapped = mapOffer(offer);
    store.writeObject(id, mapped, function (err) {
      if (err) {
        return next(err);
      }
      var responseBody = {
        offer_id: mapped.offer_id,
        offer_url: createOfferURL(mapped.offer_id)
      };
      res.send(201, responseBody);
      return next();
    });
  }

  function getOffer(req, res, next) {
    var offerID = req.params.offer_id;
    store.readObject(offerID, function (err, offer) {
      if (err) {
        return next(err);
      }
      if (!offer) {
        return next(new restify.NotFoundError());
      }
      var mapped = mapOffer(offer);
      mapped.offer_url = createOfferURL(offer.offer_id);
      res.send(200, mapped);
      return next();
    });
  }

  function putOffer(req, res, next) {
    var offerID = req.params.offer_id;
    var updatedOffer = req.body;
    store.readObject(offerID, function(err, existing) {
      if (err) {
        return next(err);
      }
      if (!existing) {
        return next(new restify.NotFoundError());
      }
      updatedOffer.offer_id = offerID;
      store.writeObject(offerID, updatedOffer, function (err) {
        if (err) {
          return next(err);
        }
        res.send(200);
        return next();
      });
    });
  }

  function deleteOffer(req, res, next) {
    var offerID = req.params.offer_id;
    store.deleteObject(offerID, function (err) {
      if (err) {
        return next(err);
      }
      res.send(200);
      return next();
    });
  }

  function getOffers(req, res, next) {
    store.readKeys(function (err, keys) {
      if (err) {
        return next(err);
      }
      async.map(keys, store.readObject, function (err, offers) {
        if (err) {
          return next(err);
        }
        var mappedOffers = offers.map(function (each) {
          each.offer_url = createOfferURL(each.offer_id);
          return each;
        });
        res.send(200, {offers: mappedOffers});
        return next();
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
    coupon_code: true,
    highres_pic_url: true
  };
  var mapped = {};
  Object.keys(simpleKeys).forEach(function(key) {
    mapped[key] = data[key];
  });
  mapped.valid_from = moment(data.valid_from).toDate();
  mapped.valid_until = moment(data.valid_until).toDate();
  mapped.delivery_date = moment(data.delivery_date).toDate();
  mapped.splash_pic = mapSplashPic(data.splash_pic);
  if (data.pages) {
    mapped.pages = mapPages(data.pages);
  }
  if (data.barcode) {
    mapped.barcode = mapBarcode(data.barcode);
  }
  return mapped;

  function mapSplashPic(splashPic) {
    return {
      url: splashPic.url,
      width: splashPic.width,
      height: splashPic.height
    };
  }

  function mapPages(pages) {
    return pages.map(function(page) {
      return {
        pic_url: page.pic_url,
        pic_metadata_url: page.pic_metadata_url,
        highres_pic_url: page.highres_pic_url,
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