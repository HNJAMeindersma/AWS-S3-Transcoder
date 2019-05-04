'use strict';
var AWS = require('aws-sdk'),
transcoder = new AWS.ElasticTranscoder({
  apiVersion: '2012-09-25',
  region: process.env.BUCKET_REGION
});
exports.handler = (event, context, callback) => {
  let fileName = event.Records[0].s3.object.key;
  var srcKey =  decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  console.log('New file triggered: ', getDeleteName(fileName));
  transcoder.createJob({
    PipelineId: process.env.PIPELINE_ID,
    Input: {
      Key: srcKey
    },
    Output: {
      Key: getOutputName(fileName),
      PresetId: process.env.TRANSCODE_PRESET,
      AlbumArt: {
        MergePolicy: 'Fallback',
        Artwork: []
      }
    }
  }, function(err, data) {
    if(err) {
      console.log('Failed to create transcoder job: ', err);
    } else {
      console.log('Transcoder job created.');
      var s3 = new AWS.S3();
      var params = {
        Id: data.Job.Id
      };
      transcoder.waitFor('jobComplete', params, function(err, data) {
        if(err) {
          console.log('Failed to wait for job complete: ', err);
        } else {
          console.log('Transcoder job done.');
          var params = {
            Bucket: process.env.BUCKET_NAME,
            CopySource: '/' + process.env.BUCKET_NAME + '/' + fileName,
            Key: getCopyName(fileName)
          };
          s3.copyObject(params, function(err, data) {
            if(err) {
              console.log('Failed to copy triggered file: ', err);
            } else {
              console.log('Triggered file copied.');
              var params = {
                Bucket: process.env.BUCKET_NAME,
                Key: getDeleteName(fileName)
              };
              s3.deleteObject(params, function(err, data) {
                if(err) {
                  console.log('Failed to delete triggered file: ', err);
                } else {
                  console.log('Triggered file deleted.');
                }
              });
            }
          });
        }
      });
    }
    callback(err, data);
  });
};
function removeExtension(srcKey){
  let lastDotPosition = srcKey.lastIndexOf(".");
  if(lastDotPosition === -1) return srcKey;
  else return srcKey.substr(0, lastDotPosition);
}
function getOutputName(srcKey){
  let baseName = srcKey.replace(process.env.PREFIX_TRIGGER, '');
  let withOutExtension = removeExtension(baseName);
  let htmlEncoded = decodeURIComponent(withOutExtension.replace(/\+/g, " "));
  return process.env.PREFIX_OUTPUT + htmlEncoded + process.env.TRANSCODE_EXTENSION;
}
function getCopyName(srcKey){
  let baseName = srcKey.replace(process.env.PREFIX_TRIGGER, '');
  let htmlEncoded = decodeURIComponent(baseName.replace(/\+/g, " "));
  return process.env.PREFIX_INPUT + htmlEncoded;
}
function getDeleteName(srcKey){
  let htmlEncoded = decodeURIComponent(srcKey.replace(/\+/g, " "));
  return htmlEncoded;
}
