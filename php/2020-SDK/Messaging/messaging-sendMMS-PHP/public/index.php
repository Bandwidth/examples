<?php

use BandwidthLib\Messaging\Models\BandwidthCallbackMessage;
use BandwidthLib\Messaging\Models\BandwidthMessage;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$BANDWIDTH_ACCOUNT_ID = getenv("BANDWIDTH_ACCOUNT_ID");
$BANDWIDTH_API_USER = getenv("BANDWIDTH_API_USER");
$BANDWIDTH_API_PASSWORD = getenv("BANDWIDTH_API_PASSWORD");
$BANDWIDTH_MESSAGING_APPLICATION_ID = getenv("BANDWIDTH_MESSAGING_APPLICATION_ID");

$config = new BandwidthLib\Configuration(
    array(
        "messagingBasicAuthUserName" => $BANDWIDTH_API_USER,
        "messagingBasicAuthPassword" => $BANDWIDTH_API_PASSWORD
    )
);
$client = new BandwidthLib\BandwidthClient($config);

// Instantiate App
$app = AppFactory::create();

// Add error middleware
$app->addErrorMiddleware(true, true, true);

$messagingClient = $client->getMessaging()->getClient();

$app->post('/outboundMessage', function (Request $request, Response $response) {
  global $messagingClient, $BANDWIDTH_ACCOUNT_ID, $BANDWIDTH_MESSAGING_APPLICATION_ID;

  $data = $request->getParsedBody();
  $body = new BandwidthLib\Messaging\Models\MessageRequest();
  $body->from = $data['from'];
  $body->to = array($data['to']);
  $body->applicationId = $BANDWIDTH_MESSAGING_APPLICATION_ID;
  $body->text = $data['message'];
  $body->media = $data['mediaUrl'];
  try {
      $msgResponse = $messagingClient->createMessage($BANDWIDTH_ACCOUNT_ID, $body);
      $response->getBody()->write('{"Success":"Message sent successfully"}');
      return $response->withStatus(201)
        ->withHeader('Content-Type', 'application/json');
  } catch (Exception $e) {
      $response->getBody()->write('{"Error":"Message Failed"}'.$e);
      return $response->withStatus(400)
        ->withHeader('Content-Type', 'application/json');
  }
});

$app->post('/messageCallback', function (Request $request, Response $response) {
  global $messagingClient, $BANDWIDTH_ACCOUNT_ID;

  $data = $request->getBody()->getContents();
  $messagingCallbacks = \BandwidthLib\APIHelper::deserialize($data, BandwidthCallbackMessage::class, true );
  $messageCallback = array_pop($messagingCallbacks);
  $mediaName = $messageCallback->message->media;

  // TODO: return each object from the callback
  // var_dump($messageCallback)
  $type = $messageCallback->type;
  $time = $messageCallback->time;
  $description = $messageCallback->description;
  $to = $messageCallback->to;
  $message = $messageCallback->message;    // an object
  $messageId = $messageCallback->message->id;
  $messageTime = $messageCallback->message->time;
  $messageTo = $messageCallback->message->to;    // an array
  $messageFrom = $messageCallback->message->from;
  $messageText = $messageCallback->message->text;
  $messageApplicationId = $messageCallback->message->applicationId;
  if (isset($messageCallback->message->media)) {
    $messageMedia = $messageCallback->message->media;    // an array
  } else {
    $messageMedia = [];
  }
  $messageOwner = $messageCallback->message->owner;
  $messageDirection = $messageCallback->message->direction;
  $messageSegmentCount = $messageCallback->message->segmentCount;


  if ($messageDirection == "in"){
    $myfile = fopen("inbound_message.txt", "w") or die("Unable to open file!");
    $txt = "Type: ".$type."\nDescription: ".$description."\nText: ".$messageText."\nMedia Array: ".implode(", ", $messageMedia);
    fwrite($myfile, $txt);
    fclose($myfile);

    // download each file in the media array
    for ($i = 0; $i < count($messageMedia); $i++){
      $mediaId = substr($messageMedia[$i], strpos($messageMedia[$i], "media/") + 6);
      $ext = substr($mediaId, strpos($mediaId, "."));
      $response = $messagingClient->getMedia($BANDWIDTH_ACCOUNT_ID, $mediaId);
      $file = fopen("media_file".$i.$ext, "wb") or die("Unable to open file");
      fwrite($file, $response->getResult());
      fclose($file);
    }
  } else {
    $myfile = fopen("outbound_message.txt", "w") or die("Unable to open file!");
    $txt = "Type: ".$type."\nDescription: ".$description."\nText: ".$messageText;
    fwrite($myfile, $txt);
    fclose($myfile);
  }
  // save message content


  return $response->withStatus(200);
});

$app->post('/mediaManagement', function (Request $request, Response $response) {
  global $messagingClient, $BANDWIDTH_ACCOUNT_ID;

  $mediaName = "media_to_upload.jpg";
  $data = $request->getBody();

  // save image locally
  $myfile = fopen($mediaName, "w") or die("Unable to open file!");
  fwrite($myfile, $data);
  fclose($myfile);

  // upload image
  $filename = $mediaName;
  $file = fopen($filename, "rb") or die("Unable to open file");
  $contents = fread($file, filesize($filename));
  $messagingClient->uploadMedia($BANDWIDTH_ACCOUNT_ID, "bandwidth_sample_app.jpg", strlen($contents), $contents);
  fclose($file);

  // delete local image file
  unlink($mediaName);
  return $response->withStatus(200);
});

$app->run();
