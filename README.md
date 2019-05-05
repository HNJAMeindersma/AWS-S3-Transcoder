# AWS-S3-Transcoder
**_Amazon Lambda Node.js script for transcoding media files in S3 using Elastic Transcoder_**

This setup mainly focusess on automatic transcoding audio files when they get uploaded to a specific folder in a S3 bucket. The script could however also be used for other media files and formats supported by AWS Elastic Transcoder.

It uses an "ingest" folder for newly added files. When the Lambda Function is triggered, an Elastic Transcoder job is created. The Lambda Function will check and wait until the transcoding is done. When successful the transcoded file is moved to its own folder. And the ingested file is moved to an "original" folder. All from one Amazon S3 bucket!

# Warning
### Reliability
The creator of this tutorial takes no reliability for damages, material or inmaterial, to any property, while using the information given in this tutorial or script.

### AWS Costs
Almost everything you do on Amazon Web Services costs real money. Know the costs of the services you and this tutorial are using before proceeding!

# Setup
1. [S3](#1-prepare-the-bucket)
2. [Elastic Transcoder](#2-create-a-transcoder-pipeline)
3. [IAM](#3-iam-role-for-lambda)
4. [Lambda](#4-setup-lambda)

### 1. Prepare the Bucket
Create a new bucket if you haven't already. Inside the root of this bucket create 3 folders:
* `ingest`
* `original`
* `vbr128`

### 2. Create a Transcoder Pipeline
In Elastic Transcoder create a new Pipeline. Select your bucket and use the default Elastic Transcoder role. Select your bucket again for the Transcoded Files, Playlists and Thumbnails.
![Create a new Pipeline](http://www.twodecimal.com/wp-content/uploads/2018/09/Pipeline.jpg)
![Note the Pipeline ID](http://www.twodecimal.com/wp-content/uploads/2018/09/pipelineid.jpg)

### 3. IAM Role for Lambda
Create a new IAM Role in the IAM Console for a AWS Service and select Lambda. Give it the following rights:
* `AmazonElasticTranscoder_FullAccess`
* `AmazonS3FullAccess`
* `CloudWatchFullAccess`
![New IAM Role](http://www.twodecimal.com/wp-content/uploads/2018/09/Lambda-Role.jpg)
![Role Policies](http://www.twodecimal.com/wp-content/uploads/2018/09/Lambda_s3_role.jpg)

### 4. Setup Lambda
##### Create a Function
Click on 'Create Function' in the Lambda main menu and start from scratch. Give it a name and use 'Node.js 6.10' as the Runtime engine. At the Permissions select the Existing Role you created earlier.
![New Lambda Function](http://www.twodecimal.com/wp-content/uploads/2018/09/lambda-function.jpg)

##### Insert _index.js_
Insert the contents of `index.js` from this repository into the main runtime file of the function.
![Insert index.js](http://www.twodecimal.com/wp-content/uploads/2018/09/Code-window.jpg)

##### Environment variables
You must set the following Environment variables:
* `BUCKET_REGION` : _`your_bucket_region`_
* `BUCKET_NAME` : _`your_bucket_name`_
* `PREFIX_TRIGGER` : `ingest/`
* `PREFIX_INPUT` : `original/`
* `PREFIX_OUTPUT` : `vbr128/`
* `PIPELINE_ID` : _`your_pipeline_id`_
* `TRANSCODE_PRESET` : _`your_preset_id`_ (this tutorial uses 'System preset: Audio MP3 - 128k')
* `TRANSCODE_EXTENSION` : `.mp3`
![Add Environment variables](http://www.twodecimal.com/wp-content/uploads/2018/09/pipeline-id.jpg)

##### Timeout
Under Basic Settings, set the timeout to 5 minutes or more. The Lambda function will wait until the transcoding is done for each file before moving the ingested original.

##### S3 Trigger
Add a S3 Trigger for All Create Events in your selected bucket. Use the Prefix `ingest/` for your ingest folder. You can also use a suffix, if you only want to trigger on a specific file type.
![Add S3 Trigger](http://www.twodecimal.com/wp-content/uploads/2018/09/Trigger.jpg)
![S3 Trigger settings](http://www.twodecimal.com/wp-content/uploads/2018/09/Object-wav.jpg)
