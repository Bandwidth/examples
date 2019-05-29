# Displaying Media Attachment to End Users

_As a developer, how do I display a media attachment to my end user?_

**This tutorial assumes you are familiar with:**
* Receiving Messaging Callbacks (Coming Soon)

When developing a Bandwidth enabled application that accepts MMS, you will often need to display received media to your end user. This process is not always as straightforward as it may appear.

**Consider the following example callback that your application receives to its callback URL:**

```json
[
  {
    "type"        : "message-received",
    "time"        : "2016-09-14T18:20:17Z",
    "description" : "Incoming message received",
    "to"          : "+12345678902",
    "message"     : {
      "id"            : "14762070468292kw2fuqty55yp2b2",
      "time"          : "2016-09-14T18:20:16Z",
      "to"            : ["+12345678902"],
      "from"          : "+12345678901",
      "text"          : "Hey, check this out!",
      "applicationId" : "93de2206-9669-4e07-948d-329f4b722ee2",
      "media"         : [
        "https://messaging.bandwidth.com/api/v2/users/9955525/media/14762070468292kw2fuqty55yp2b2/0/bw.png"
      ],
      "owner"         : "+12345678902",
      "direction"     : "in",
      "segmentCount"  : 1
    }
  }
]
```

Your first instinct may be to store this message in your data store as-is, and use it to generate the message shown to the end user in your application.

**You'll quickly discover that the provided media fails to render.** This is because the URL that is provided is an API call, and you will need to use your API Token and Secret to retrieve this media at the URL provided. Additionally, this URL is only functional for 48 hours.

This is incompatible with any client application, because it would require the client to have your API Token and Secret to view their MMS media.

As such, if we need to display this content to the user, or persist it for any amount of time greater than 48 hours, we'll need to move this content to our own storage and URL.

**The flow for doing so looks like this**:

1. A callback is received by your application that includes Media URL(s)
2. Your application retrieves the media from the provided URL, using an API Token and Secret
3. The media is streamed (recommended) or downloaded and then uploaded to a cloud hosting provider (or anywhere you'd like to persist the media)
4. Your application stores the self-hosted URL, instead of the Bandwidth API call.

You now have full control over the access to this media, its persistence and cleanup, and its display to your end users.

## Example Flow (Node, Express)

This example shows the cloud-agnostic solution flow that demonstrates best practices for processing an incoming callback and storing a self-hosted MediaURL.

In the below example, `getCloudMediaUrl` is the function defined in the next section.

```js
// Express route for our Bandwidth Application Callback
app.post('/callback', async (req, res) => {
  const requestBody = JSON.parse(req.body);

  // Processing each incoming message
  for (let i = 0; i < requestBody.length; i += 1) {
    let event = requestBody[i];

    // Only handling received messages for this example
    if (event.type === 'message-received') {

      // create our database object to be sent to our JSON database
      const newRecord = event;

      // and empty its media object
      newRecord.media = [];

      // changing our media URLs if there are any
      for (let j = 0; j < event.media.length; j += 1) {
        let media = event.media.length[j];

        // upload and get the updated media URL
        let mediaUrl = await getCloudMediaUrl(media);

        // update the media URL before sending to the database.
        newRecord.media.push(mediaUrl);
      }
    }

    // add the message, with updated mediaUrls, to the database
    db.add(newRecord)
  }
})
```

## Streaming a File to Cloud Storage

The below are some examples and resources for how you could stream files to various cloud storage providers.

### Amazon Web Services (AWS)

[More Reference Information](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html)

```js
const AWS = require('aws-sdk');
const fetch = require('node-fetch');

// used to generate authorization string
const Base64 = require('js-base64').Base64;

const getCloudMediaUrl = (mediaUrl) => {
  const s3 = new AWS.S3();

  // getting the filename
  const fileNameArray = mediaUrl.split('/')

  // adding a timestamp to avoid overwriting files with duplicate names.
  const fileName = `${Date.now()}-${fileNameArray[fileNameArray.length - 1]}`

  const media = await fetch(mediaUrl, {
    headers: {
      // need to include our API Token and Secret in the request.
      authorization: `Basic ${Base64.encode(`${BW_API_TOKEN}:${BW_API_SECRET}`)}`
    }
  })

  // preparing the S3 Upload
  const params = {
    Bucket: 'myBucket',
    Key: fileName,
    Body: media.body
  }

  // return the promise of the S3 Upload.
  return s3.upload(params).promise();
}
```

### Google Cloud

[More Reference Information](https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/File#createWriteStream)

```js
const {Storage} = require('@google-cloud/storage');
const fetch = require('node-fetch');

// used to generate authorization string
const Base64 = require('js-base64').Base64;

const getCloudMediaUrl = (mediaUrl) => {

  // getting the filename
  const fileNameArray = mediaUrl.split('/')

  // adding a timestamp to avoid overwriting files with duplicate names.
  const fileName = `${Date.now()}-${fileNameArray[fileNameArray.length - 1]}`

  // initialize storage client, and set bucket target
  const storage = new Storage();
  const myBucket = storage.bucket('myBucket');

  // set the file target
  const file = myBucket.file(fileName);

  // perform the fetch, and create a read stream from the body.
  return fetch(mediaUrl, {
    headers: {
      // need to include our API Token and Secret in the request.
      authorization: `Basic ${Base64.encode(`${BW_API_TOKEN}:${BW_API_SECRET}`)}`
    }
  })
    .then((res) => {
      // pipe the read stream coming in from the fetch body to a google cloud write stream:
      res.body.pipe(file.createWriteStream())
      .on('finish', function() {
        return `https://storage.googleapis.com/${'myBucket'}/${fileName}`
      });
    })
}
```

### Microsoft Azure

[Example Used to Create This Snippit](https://github.com/Azure-Samples/azure-storage-js-v10-quickstart/blob/master/index.js)
[More Reference Information](https://docs.microsoft.com/en-us/javascript/api/%40azure/storage-blob/?view=azure-node-preview)

```js

const {
  Aborter,
  StorageURL,
  BlockBlobURL,
  uploadStreamToBlockBlob
} = require('@azure/storage-file');
const {
  STORAGE_ACCOUNT_NAME,
  credentials
} = require('./azureCredentials.js');
const fetch = require('node-fetch');

// used to generate authorization string
const Base64 = require('js-base64').Base64;

const getCloudMediaUrl = (mediaUrl) => {

  // getting the filename
  const fileNameArray = mediaUrl.split('/')

  // adding a timestamp to avoid overwriting files with duplicate names.
  const fileName = `${Date.now()}-${fileNameArray[fileNameArray.length - 1]}`

  // azure uses this object to abort after a specififed timeout (here 1 min)
  const aborter = Aborter.timeout(60 * 1000);

  
  // STORAGE_ACCOUNT_NAME is from your azure credentials
  const conatinerName = "demo";
  const pipeline = StorageURL.newPipeline(credentials);
  const serviceURL = new ServiceURL(`https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`, pipeline);
  const containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);

  // will only create a conatiner if it doesn't already exist
  // azure best practices recommends this
  await containerURL.create(aborter);

  



  // perform the fetch, and create a read stream from the body.
  return fetch(mediaUrl, {
    headers: {
      // need to include our API Token and Secret in the request.
      authorization: `Basic ${Base64.encode(`${BW_API_TOKEN}:${BW_API_SECRET}`)}`
    }
  })
    .then((res) => {

      // create a URL for the resource
      const blockBlobURL = BlockBlobURL.fromContainerURL(containerURL, fileName);

      // upload the stream to the url
      await uploadStreamToBlockBlob(
        aborter, 
        res.body, 
        blockBlobURL, 
        16384, // default highwatermark for stream 
        2 // max buffers, adjust as necessary
      );

      // return the URL
      return blockBlobURL
    })
}
```