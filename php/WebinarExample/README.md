<div align="center">

# Bandwidth PHP Webinar App

![BW_all](../../.readme_images/BW_all.png)

</div>

A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs

## Pre-Reqs

You will need to set up Bandwidth Applications and have phone numbers associated with these application, and point the callback URL on these applications to the messaging and voice endpoints on the server running this app. `ngrok` is highly recommended for local prototyping.

## Description
A small example demonstrating basic Bandwidth operations with the PHP SDK

## Running The App

### Environmental Variables
The following environmental variables need to be set. For more information about each variable. Read more about each variable on the [Security & Credentials Documentation Page](https://dev.bandwidth.com/guides/accountCredentials.html#top).

| Variable                              | Description                             | Example                                            |
|:--------------------------------------|:----------------------------------------|:---------------------------------------------------|
| `BANDWIDTH_ACCOUNT_ID`                | Your Bandwidth Account Id               | `239525`                                           |
| `BANDWIDTH_API_USER`                  | Your Bandwidth API Username             | `johnDoe`                                          |
| `BANDWIDTH_API_PASSWORD`              | Your Bandwidth API Password             | `correct-horse-battery-stap1e`                     |
| `BANDWIDTH_MESSAGING_TOKEN`           | Your Bandwidth Messaging API token      | `eabb9d360e4025c81e28d336612ff402861a68d8f578307e` |
| `BANDWIDTH_MESSAGING_SECRET`          | Your Bandwidth Messaging API secret     | `70ba9d5e4f6c9739f86eab6e117f148af1ef8093793cbc87` |
| `BANDWIDTH_MESSAGING_APPLICATION_ID ` | Your Bandwidth Messaging application ID | `725e2ee2-a8c9-4a41-896a-9adad68456a8`             |
| `BANDWIDTH_VOICE_APPLICATION_ID`      | Your Bandwidth Voice application ID     | `acd1575d-b0f7-4274-95ee-e942a286df8c`             |


### Callback URLs For Bandwidth Applications

| Callback Type          | URL                        |
|:-----------------------|:---------------------------|
| Messaging Callback     | `/Callbacks/Messaging`     |
| Inbound Voice Callback | `/Callbacks/Voice/Inbound` |

### Commands
Run the following commands to get started

```
composer require slim/slim:^4.0
composer require bandwidth/sdk
composer require slim/http
composer require slim/psr7
php -S localhost:8000 -t public
```


## What You Can Do

* Text your phone number `dog` and you will receive a picture of a dog sent back
* Text your phone number any phrase other than `dog` and you will receive a response '👋 Hello From bandwidth!'
* Call your phone number and you will be asked to play a game


# Tutorial

## Assumptions

* Have Bandwidth Account
* Have PHP Installed (along with composer)
* Have [ngrok](https://ngrok.com) installed

## Code-along

### Starting Point

* This is the initial state we'll build the app from.

```php
<?php

use BandwidthLib\Messaging\Models\BandwidthCallbackMessage;
use BandwidthLib\Messaging\Models\BandwidthMessage;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;


require __DIR__ . '/../vendor/autoload.php';


// Instantiate App
$app = AppFactory::create();

// Add error middleware
$app->addErrorMiddleware(true, true, true);

// Add routes
$app->get('/', function (Request $request, Response $response) {
    $response->getBody()->write('<a href="/hello/world">Try /hello/world</a>');
    return $response;
});

$app->get('/hello/{name}', function (Request $request, Response $response, $args) {
    $name = $args['name'];
    $response->getBody()->write("Hello, $name");
    return $response;
});

$app->post('/Callbacks/Messaging', function (Request $request, Response $response) {
    return $response->withStatus(200);
});

$app->post('/Callbacks/Voice/Inbound', function (Request $request, Response $response) {

    return $response;
});


$app->run();
```

### Intialize Bandwidth client

* Check environment variables and define client

```php
$BANDWIDTH_ACCOUNT_ID           = getenv("BANDWIDTH_ACCOUNT_ID");
$BANDWIDTH_API_USER             = getenv("BANDWIDTH_API_USER");
$BANDWIDTH_API_PASSWORD         = getenv("BANDWIDTH_API_PASSWORD");
$BANDWIDTH_MESSAGING_TOKEN      = getenv("BANDWIDTH_MESSAGING_TOKEN");
$BANDWIDTH_MESSAGING_SECRET     = getenv("BANDWIDTH_MESSAGING_SECRET");
$BANDWIDTH_MSG_APPLICATION_ID   = getenv("BANDWIDTH_MESSAGING_APPLICATION_ID");
$BANDWIDTH_VOICE_APPLICATION_ID = getenv("BANDWIDTH_VOICE_APPLICATION_ID");

$config = new BandwidthLib\Configuration(
    array(
        'messagingBasicAuthUserName' => $BANDWIDTH_MESSAGING_TOKEN,
        'messagingBasicAuthPassword' => $BANDWIDTH_MESSAGING_SECRET,
        'voiceBasicAuthUserName' => $BANDWIDTH_API_USER,
        'voiceBasicAuthPassword' => $BANDWIDTH_API_PASSWORD,
    )
);

$client = new BandwidthLib\BandwidthClient($config);
```

## Handling message callbacks

* For this guide, we're only actually hitting the Bandwidth API on inbound messages
* Parse out the callback using the APIHelper tools
* We need a few globals if we were to expand the functionality

```php
global $client, $BANDWIDTH_ACCOUNT_ID, $BANDWIDTH_MSG_APPLICATION_ID;
$data = $request->getBody()->getContents();
$messagingCallbacks = \BandwidthLib\APIHelper::deserialize($data, BandwidthCallbackMessage::class, true );

/** @var BandwidthCallbackMessage $messageCallback */
$messageCallback = array_pop($messagingCallbacks);
$message = $messageCallback->message;
```

### Check if DLR

* Bandwidth's messaging API sends both inbound message events and outbound DLRs to the same URL
* We need to check the direction of the message to determine actions.
  * for outbound messages, print the status and move on

```php
$isDlr = strtolower(trim($message->direction)) == 'out';
if ($isDlr) {

    return $response->withStatus(200);
}
```

### Build the 'to' array

* As we're responding to any inbound message, if it's a group message we should reply to the group

```php
$owner = $message->owner;
$toNumbers = (new ArrayObject($message->to))->getArrayCopy();
if (($key = array_search($owner, $toNumbers)) !== false) {
    unset($toNumbers[$key]);
}
array_push($toNumbers,$message->from);
```

### Build the message request

* Most of the message request is similar regardless of the inbound text content.
* So let's go ahead and build the skeleton request and fill in later
* Be sure to grab **the values** of the array with `array_values`. Otherwise the MessageRequest will include the keys.

```php
$messageRequest = new \BandwidthLib\Messaging\Models\MessageRequest();
$messageRequest->from = $owner;
$messageRequest->to = array_values($toNumbers);
$messageRequest->applicationId = $BANDWIDTH_MSG_APPLICATION_ID;
```

### Check if dog

* If the inbound message is "dog" we're going to send a picture
* Otherwise, we're going to reply to the message

```php
if ($isDog) {
    $messageRequest->text = '🐶';
    $messageRequest->media = ['https://bw-demo.s3.amazonaws.com/dog.jpg'];
}
else {
    $messageRequest->text = '👋 Hello From bandwidth!';
}
```

### Build the client and send the message

* Now that we have the message, let's send it and log the response

```php
$messagingClient = $client->getMessaging()->getClient();
$apiResponse = $messagingClient->createMessage($BANDWIDTH_ACCOUNT_ID, $messageRequest);

/** @var BandwidthMessage $messageResponse */
$messageResponse = $apiResponse->getResult();
$messageId = $messageResponse->id;
```

### All together the messaging handler looks like

```php
$app->post('/Callbacks/Messaging', function (Request $request, Response $response) {
    global $client, $BANDWIDTH_ACCOUNT_ID, $BANDWIDTH_MSG_APPLICATION_ID;
    $data = $request->getBody()->getContents();
    $messagingCallbacks = \BandwidthLib\APIHelper::deserialize($data, BandwidthCallbackMessage::class, true );

    /** @var BandwidthCallbackMessage $messageCallback */
    $messageCallback = array_pop($messagingCallbacks);
    $message = $messageCallback->message;

    $isDlr = strtolower(trim($message->direction)) == 'out';
    if ($isDlr) {

        return $response->withStatus(200);
    }
    $owner = $message->owner;
    $toNumbers = (new ArrayObject($message->to))->getArrayCopy();
    if (($key = array_search($owner, $toNumbers)) !== false) {
        unset($toNumbers[$key]);
    }
    array_push($toNumbers,$message->from);

    $messageRequest = new \BandwidthLib\Messaging\Models\MessageRequest();
    $messageRequest->from = $owner;
    $messageRequest->to = array_values($toNumbers);
    $messageRequest->applicationId = $BANDWIDTH_MSG_APPLICATION_ID;

    $messageText = strtolower(trim($message->text));
    $isDog = $messageText == 'dog';
    if ($isDog) {
        $messageRequest->text = '🐶';
        $messageRequest->media = ['https://bw-demo.s3.amazonaws.com/dog.jpg'];
    }
    else {
        $messageRequest->text = '👋 Hello From bandwidth!';
    }
    $messagingClient = $client->getMessaging()->getClient();
    $apiResponse = $messagingClient->createMessage($BANDWIDTH_ACCOUNT_ID, $messageRequest);

    /** @var BandwidthMessage $messageResponse */
    $messageResponse = $apiResponse->getResult();
    $messageId = $messageResponse->id;

    return $response->withStatus(200);
});
```

## Handling Voice callbacks

* We're always replying with the same BXML for each call
* Don't need to concern ourselves with details about the callback event
* The [Gather](https://dev.bandwidth.com/voice/bxml/verbs/gather.html) verb allows us to specify a new URL to handle user input.

### Build the BXML

```php
$speakSentence = new BandwidthLib\Voice\Bxml\SpeakSentence('Hello, let\'s play a game. What is 9 + 2');
$speakSentence->voice("kate");

$gather = new BandwidthLib\Voice\Bxml\Gather();
$gather->gatherUrl('/Callbacks/Voice/Gather');
$gather->maxDigits(2);
$gather->firstDigitTimeout(10);
$gather->speakSentence($speakSentence);

$bxmlResponse = new BandwidthLib\Voice\Bxml\Response();
$bxmlResponse->addVerb($gather);
$bxml = $bxmlResponse->toBxml();
$response = $response->withStatus(200)->withHeader('Content-Type', 'application/xml');
$response->getBody()->write($bxml);
return $response;
```

### Handle the Gather Callback

#### Create the endpoint

* We need to define a new route for the gather event.

```php
$app->post('/Callbacks/Voice/Gather', function (Request $request, Response $response) {
      return $response;
});
```

#### Extract Digits

* We need to pull the `digits` pressed values out of the callback to check if their arithmetic is correct

```php
$data = $request->getParsedBody();
$digits = $data['digits'];
```

#### Check digit value

* If the math is correct, play success file, if not play fail file

```php
$successFile = 'https://bw-demo.s3.amazonaws.com/tada.wav';
$failFile = 'https://bw-demo.s3.amazonaws.com/fail.wav';

$audioUri = $digits == '11' ? $successFile : $failFile;
```

#### Build and respond with the BXML

```php
$playAudio = new \BandwidthLib\Voice\Bxml\PlayAudio($audioUri);
$bxmlResponse = new \BandwidthLib\Voice\Bxml\Response();
$bxmlResponse->addVerb($playAudio);
$bxmlResponse->addVerb(new \BandwidthLib\Voice\Bxml\Hangup());
$bxml = $bxmlResponse->toBxml();
$response = $response->withStatus(200)->withHeader('Content-Type', 'application/xml');
$response->getBody()->write($bxml);
return $response;
```

### All together the voice handlers look like:

```php
$app->post('/Callbacks/Voice/Inbound', function (Request $request, Response $response) {
    $speakSentence = new BandwidthLib\Voice\Bxml\SpeakSentence('Hello, let\'s play a game. What is 9 + 2');
    $speakSentence->voice("kate");

    $gather = new BandwidthLib\Voice\Bxml\Gather();
    $gather->gatherUrl('/Callbacks/Voice/Gather');
    $gather->maxDigits(2);
    $gather->firstDigitTimeout(10);
    $gather->speakSentence($speakSentence);

    $bxmlResponse = new BandwidthLib\Voice\Bxml\Response();
    $bxmlResponse->addVerb($gather);
    $bxml = $bxmlResponse->toBxml();
    $response = $response->withStatus(200)->withHeader('Content-Type', 'application/xml');
    $response->getBody()->write($bxml);
    return $response;
});

$app->post('/Callbacks/Voice/Gather', function (Request $request, Response $response) {
    $data = $request->getParsedBody();
    $digits = $data['digits'];

    $successFile = 'https://bw-demo.s3.amazonaws.com/tada.wav';
    $failFile = 'https://bw-demo.s3.amazonaws.com/fail.wav';

    $audioUri = $digits == '11' ? $successFile : $failFile;
    $playAudio = new \BandwidthLib\Voice\Bxml\PlayAudio($audioUri);
    $bxmlResponse = new \BandwidthLib\Voice\Bxml\Response();
    $bxmlResponse->addVerb($playAudio);
    $bxmlResponse->addVerb(new \BandwidthLib\Voice\Bxml\Hangup());
    $bxml = $bxmlResponse->toBxml();
    $response = $response->withStatus(200)->withHeader('Content-Type', 'application/xml');
    $response->getBody()->write($bxml);
    return $response;
});
```