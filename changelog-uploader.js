// AWS works for communicating to Spaces
const aws = require('aws-sdk');
const fs = require('fs');
const { log } = require('builder-util');

// Set S3 endpoint to DigitalOcean Spaces
const spacesEndpoint = new aws.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new aws.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_KEY_ID,
  secretAccessKey: process.env.DO_SECRET_KEY
});

// Add a file to a Space
var params = {
  Body: fs.readFileSync('./changelog.txt'),
  Bucket: 'nwest',
  Key: 'adtools/changelog.txt',
  ACL: 'public-read'
};

s3.putObject(params, function(err, data) {
  if (err) console.log(err, err.stack);
});

log.info({ file: 'changelog.txt', provider: 'Spaces' }, 'uploading manually');
