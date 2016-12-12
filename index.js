'use strict';

const yelp = require('yelp-fusion');
const json2xls = require('json2xls');
const fs = require('fs');
const unique = require('array-unique');

const config = require('./config.json');

let numMiles = 7;
const numMetersInMile = 1609.344;

let allBusinesses = [];

function yelpCall(searchParams) {
  yelp.accessToken(config.appID, config.appSecret).then(response => {
    let client = yelp.client(response.jsonBody.access_token);

    if (typeof client !== 'undefined') {
      console.log('Token obtained.');
    }

    let searchRequest = {
      latitude: 40.920690,
      longitude: -72.723794,
      radius: parseInt(numMiles * numMetersInMile),
      price: '1,2,3,4',
      limit: 50
    };

    client.search(searchRequest).then(response => {

      let businesses = response.jsonBody.businesses;

      // We have to clean up the data that comes back.
      for (let i = 0; i < businesses.length; i++) {
        let bus = businesses[i];

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

        let address =  street + ', ' + bus.location.city + ', ' + bus.location.state + ' ' + bus.location.zip_code;
        bus.location = address;

        allBusinesses.push(bus);
      }

      // let xls = json2xls(businesses);
      // fs.writeFileSync('data.xlsx', xls, 'binary');
      console.log('File created.');
    }).catch(e => {
      console.log(e);
    });
  }).catch(e => {
    console.log(e);
  });
}