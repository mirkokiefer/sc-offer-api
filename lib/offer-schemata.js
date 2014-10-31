
var joi = require('joi');

var baseSchema = joi.object().keys({
  type: joi.alternatives().allow('catalog', 'coupon', 'online_coupon').required(),
  provider_id: joi.string().required(),
  regions: joi.array().includes(joi.string().required()).unique().required(),
  title: joi.string().required(),
  valid_from: joi.string().isoDate().required(),
  valid_until: joi.string().isoDate().required(),
  delivery_date: joi.string().isoDate().required(),
  status: joi.alternatives().allow('created', 'staged', 'pending', 'deleted', 'live').required(),
  splash_pic: joi.object().keys({
    width: joi.number().required(),
    height: joi.number().required(),
    url: joi.string().required()
  }).required(),
  highres_pic_url: joi.string().required(),
  targeted_card_numbers: joi.array().includes(joi.string().required()),
  terms_and_conditions: joi.string()
});

var catalogSchema = joi.object().keys({
  is_fullscreen: joi.boolean(),
  pages: joi.array().includes(joi.object().keys({
    pic_url: joi.string().required(),
    pic_metadata_url: joi.string().required(),
    highres_pic_url: joi.string().required(),
    title: joi.string(),
    store_url: joi.string()
  }).required()).required()
});

var onlineCouponSchema = joi.object().keys({
  pic_url: joi.string().required(),
  pic_metadata_url: joi.string().required(),
  text: joi.string().required(),
  affiliate_url: joi.string().required(),
  coupon_code: joi.string().required()
});

var validBarcodeFormats = [
  'CODE_39',
  'CODE_93',
  'CODE_128',
  'DATA_MATRIX',
  'EAN_8',
  'EAN_13',
  'ITF',
  'QR_CODE',
  'UPC_A'
];

var couponSchema = joi.object().keys({
  pic_url: joi.string().required(),
  pic_metadata_url: joi.string().required(),
  text: joi.string().required(),
  coupon_code: joi.string(),
  barcode: joi.object().keys({
    format: joi.alternatives().allow(validBarcodeFormats).required(),
    content: joi.string().required()
  })
});

var schemata = {
  base: baseSchema,
  catalog: catalogSchema,
  coupon: couponSchema,
  online_coupon: onlineCouponSchema
};

module.exports = schemata;