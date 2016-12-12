'use strict';

const yelp = require('yelp-fusion');
const json2xls = require('json2xls');
const fs = require('fs');
const unique = require('array-unique');

const config = require('./config.json');

const numMetersInMile = 1609.344;

const limit = 50;

// Only get the access token once.
yelp.accessToken(config.appID, config.appSecret).then(response => {

  let client = yelp.client(response.jsonBody.access_token);
  if (typeof client !== 'undefined') {
    console.log('Token obtained.');
  } else {
    return FALSE;
  }

  return getAllBusinesses(client).then(businesses => {
    let allBusinesses = [];

    for (let i = 0; i < businesses.length; i++) {
      allBusinesses = allBusinesses.concat(businesses[i]);
    }

    return allBusinesses;
  });
}).then(allBusinesses => {

  // fs.writeFileSync('data.json', JSON.stringify(allBusinesses, null, 1));
  let xls = json2xls(allBusinesses);
  fs.writeFileSync('data.xlsx', xls, 'binary');
  console.log('File created.');
}).catch(e => {
  console.log(e);
});

function getAllBusinesses(client) {
  // Cycle through all location objects.
  return Promise.all(config.locations.map(function (location) {
    if (typeof location.latitude === 'undefined' || typeof location.longitude === 'undefined') {
      console.log('Lat/Long missing.');
      return FALSE;
    }

    let searchRequest = {
      latitude: location.latitude,
      longitude: location.longitude,
      radius: parseInt(config.numMiles * numMetersInMile),
      price: config.price,
      limit: limit
    };

    let numIterations = [];
    for (var i=1;i <= config.numIterations; i++) {
      numIterations.push(i);
    }

    return iterateCall(client, numIterations, searchRequest).then((businesses) => {
      let allBusinesses = [];

      for (let i = 0; i < businesses.length; i++) {
        allBusinesses = allBusinesses.concat(businesses[i]);
      }

      return allBusinesses;
    });
  }));
}

function iterateCall(client, numIterations, searchRequest) {
  return Promise.all(numIterations.map(function (row) {
    searchRequest.offset = row * limit;

    return client.search(searchRequest).then(response => {
      let businesses = [];

      // We have to clean up the data that comes back.
      for (let i = 0; i < response.jsonBody.businesses.length; i++) {
        let bus = cleanResult(response.jsonBody.businesses[i]);
        businesses.push(bus);
      }

      return businesses;
    }).catch(e => {
      console.log(e);
    });
  }));
}

function cleanResult(bus) {
  // Convert latitude and longitude into separate fields.
  bus.latitude = bus.coordinates.latitude;
  bus.longitude = bus.coordinates.longitude;
  delete bus.coordinates;

  // Parse categories into separate fields.
  if (bus.categories.length > 0) {
    for(let cat = 0; cat < bus.categories.length; cat++) {
      bus['category' + (cat+1)] = bus.categories[cat].title;
    }
    delete bus.categories;
  }

  // Convert the location field into a human readable address.
  let street = bus.location.address1;
  if (bus.location.address2 != '' && bus.location.address2 != null) {
    street += ' ' + bus.location.address2;
  }

  if (bus.location.address3 != '' && bus.location.address3 != null) {
    street += ' ' + bus.location.address3;
  }

  let address = street + ', ' + bus.location.city + ', ' + bus.location.state + ' ' + bus.location.zip_code;
  bus.location = address;

  // Convert the business price to a number rather than dollar signs.
  bus.price = bus.price.length;

  // Remove the image url because we really don't need it.
  delete bus.image_url;

  return bus;
}