#Offer-API

##`GET /offers`
List all offers.

``` json
{
  "offers": [
    {
      "offer_url": "...",
      "offer_id": "abc",
      "title": "Some title",
      ...
    },
    ...
  ]
}
```

##`POST /offers`
Create an offer.

##`GET /:offer_url`
Get a single offer.

##`PUT /:offer_url`
Update an offer.

##`DELETE /:offer_url`
Delete an offer.
