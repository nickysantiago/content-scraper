/*
  A Node.js command line application that goes to an ecommerce site to get
  the latest prices and save them to a spreadsheet (CSV format).
*/

// Modules to be used
const fs = require('fs');
const Crawler = require('crawler');
const csv = require('csv');
const http = require('http');

// Check for folder named 'data', and create it if it doesn't exist.
if(!fs.existsSync('./data')) fs.mkdirSync('./data');

// CSV file should be named after the day it was created (eg: YYYY-MM-DD).
const date = new Date();
const csvFileName = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate()}.csv`;

// Create CSV file
fs.writeFile(`data/${csvFileName}`, '', err => err && console.log(err));

// Website to visit for scraping
const domain = 'http://shirts4mike.com/';

// Array of shirts
const shirts = [];

// Number of shirts in each table
const totalShirts = 8;

// Function that will be called by scraper for every page crawled
const getProductInfo = function(error, response, done) {
  // Return if there are any errors
  if(error) {
    return console.error(`Ooops! There was an error connecting to ${domain}: ${error.message}.`);
  }
  // Continue if connected successfully
  else {
    // $ is a server side implementation of jQuery included in the response
    const $ = response.$;
    // The entire URL, eg: http://shirts4mike.com/shirt.php?id=102
    const url = response.request.uri.href;

    /*
      Take a look at each anchor tag in the current page.
      If the anchor tag contains 'shirt.php' in it (eg: http://shirts4mike.com/shirt.php?id=102),
      scrape (crawl) that page using the link provided.
    */
    $('a').each((index, a) => {
      if(a.attribs.href.includes('shirt.php')) {
        scraper.queue(domain + a.attribs.href);
      }
    });

    /*
      If we are in a product page (eg: http://shirts4mike.com/shirt.php?id=102),
      get the price, title, url and image url of the product (eg: shirt), as well
      as the current time (in 24hr mode). Then save this information into a CSV file.
    */
    if(url.includes('shirt.php')) {
      let shirt = [];
      shirt.push($('input[name="item_name"]').attr('value'));
      shirt.push($('.price').text());
      shirt.push($('.shirt-picture span img').attr('src'));
      shirt.push(url);
      shirt.push(`${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`);
      shirts.push(shirt);
      // Wait until shirts array is completely filled to convert it to csv and save it
      if(shirts.length === totalShirts) {
        csv.stringify(shirts, (err, output) => {
          fs.writeFile(`data/${csvFileName}`, output, err => err && console.log(err));
        });
      }
    }
  }
  // Exit
  done();
}

// Create new crawler object.
const scraper = new Crawler({
  callback: getProductInfo,
  retries: 0,
  timeout: 5000
});

// Start program
scraper.queue(domain + 'shirts.php');
