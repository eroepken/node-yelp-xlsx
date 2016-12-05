'use strict';

const yelp = require('yelp-fusion');
const json2xls = require('json2xls');
const fs = require('fs');

// Place holders for Yelp Fusion's OAuth 2.0 credentials. Grab them
// from https://www.yelp.com/developers/v3/manage_app
const clientId = 'REDACTED';
const clientSecret = 'REDACTED';

let numMiles = 7;
const numMetersInMile = 1609.344;

// Search up to 7 miles (11265.4 meters).
const searchRequest = {
  latitude: 40.920690,
  longitude: -72.723794,
  radius: parseInt(numMiles * numMetersInMile),
  price: '1,2,3,4',
  limit: 50
};

yelp.accessToken(clientId, clientSecret).then(response => {
  let client = yelp.client(response.jsonBody.access_token);

  if (typeof client !== 'undefined') {
    console.log('Token obtained.');
  }

  client.search(searchRequest).then(response => {

    let businesses = response.jsonBody.businesses;

    for (var i = 0; i < businesses.length; i++) {
      // Convert latitude and longitude into separate fields.
      businesses[i].latitude = businesses[i].coordinates.latitude;
      businesses[i].longitude = businesses[i].coordinates.longitude;
      delete businesses[i].coordinates;

      // Parse categories into separate fields.
      if (businesses[i].categories.length > 0) {
        for(var cat = 0; cat < businesses[i].categories.length; cat++) {
          businesses[i]['category' + (cat+1)] = businesses[i].categories[cat].title;
        }

        delete businesses[i].categories;
      }

      // Convert the location field into a human readable address.
      let street = businesses[i].location.address1;

      if (businesses[i].location.address2 != '' && businesses[i].location.address2 != null) {
        street += ' ' + businesses[i].location.address2;
      }
      if (businesses[i].location.address3 != '' && businesses[i].location.address3 != null) {
        street += ' ' + businesses[i].location.address3;
      }

      let address =  street + ', ' + businesses[i].location.city + ', ' + businesses[i].location.state + ' ' + businesses[i].location.zip_code;
      businesses[i].location = address;
    }

    let xls = json2xls(businesses);
    fs.writeFileSync('dataLat' + searchRequest.latitude + 'Long' + searchRequest.longitude + '.xlsx', xls, 'binary');
    console.log('File created.');
  }).catch(e => {
    console.log(e);
  });
}).catch(e => {
  console.log(e);
});