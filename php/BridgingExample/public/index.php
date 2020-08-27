<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$BANDWIDTH_ACCOUNT_ID = getenv("BANDWIDTH_ACCOUNT_ID");
$BANDWIDTH_API_USER = getenv("BANDWIDTH_API_USER");
$BANDWIDTH_API_PASSWORD = getenv("BANDWIDTH_API_PASSWORD");
$BANDWIDTH_VOICE_APPLICATION_ID = getenv("BANDWIDTH_VOICE_APPLICATION_ID");
$BASE_URL = getenv("BASE_URL");
$PERSONAL_NUMBER = getenv("PERSONAL_NUMBER");

$config = new BandwidthLib\Configuration(
    array(
        "voiceBasicAuthUserName" => $BANDWIDTH_API_USER,
        "voiceBasicAuthPassword" => $BANDWIDTH_API_PASSWORD
    )
);

// Instantiate Bandwidth Client
$client = new BandwidthLib\BandwidthClient($config);

// Instantiate App
$app = AppFactory::create();

// Add error middleware
$app->addErrorMiddleware(true, true, true);

$voiceClient = $client->getVoice()->getClient();


// Create outbound call
function createOutboundCall($to, $from, $callId){
  global $voiceClient, $BANDWIDTH_VOICE_APPLICATION_ID, $BASE_URL, $BANDWIDTH_ACCOUNT_ID;
  $body = new BandwidthLib\Voice\Models\ApiCreateCallRequest();
  $body->from = $from;
  $body->to = $to;
  $body->answerUrl = $BASE_URL . "/Outbound/Answer";
  $body->applicationId = $BANDWIDTH_VOICE_APPLICATION_ID;
  $body->tag = $callId;
  $voiceClient->createCall($BANDWIDTH_ACCOUNT_ID, $body);
}

// Update existing call
function updateCall($callId){
  global $BANDWIDTH_ACCOUNT_ID, $BASE_URL, $voiceClient;
  $body = new BandwidthLib\Voice\Models\ApiModifyCallRequest();
  $body->state = "active";
  $body->redirectUrl = $BASE_URL . "/UpdateCall";

  try {
      $voiceClient->modifyCall($BANDWIDTH_ACCOUNT_ID, $callId, $body);
  } catch (BandwidthLib\APIException $e) {
      print_r($e);
  }
}


// Handle the incoming call
$app->post('/Inbound/VoiceCallback', function (Request $request, Response $response) {
  global $PERSONAL_NUMBER, $BASE_URL;

  $data = $request->getParsedBody();
  createOutBoundCall($PERSONAL_NUMBER, $data['from'], $data['callId']);

  $bxmlResponse = new BandwidthLib\Voice\Bxml\Response();
  $speakSentence = new BandwidthLib\Voice\Bxml\SpeakSentence("Connecting your call, please wait.");
  $speakSentence->voice("julie");
  $ring = new BandwidthLib\Voice\Bxml\Ring();
  $ring->duration(30);
  $redirect = new BandwidthLib\Voice\Bxml\Redirect();
  $redirect->redirectUrl($BASE_URL . "/UpdateCall");

  $bxmlResponse->addVerb($speakSentence);
  $bxmlResponse->addVerb($ring);
  $bxmlResponse->addVerb($redirect);

  $bxml = $bxmlResponse->toBxml();
  $response = $response->withStatus(200)->withHeader('Content-Type', 'application/xml');
  $response->getBody()->write($bxml);
  return $response;
});


// Send back Gather BXML when the outbound call is answered
$app->post('/Outbound/Answer', function (Request $request, Response $response) {
  global $BASE_URL;

  $data = $request->getParsedBody();

  $bxmlResponse = new BandwidthLib\Voice\Bxml\Response();
  $speakSentence = new BandwidthLib\Voice\Bxml\SpeakSentence("Please press 1 to accept the call, or any other button to send to voicemail");
  $speakSentence->voice("julie");

  $gather = new BandwidthLib\Voice\Bxml\Gather();
  $gather->gatherUrl($BASE_URL . "/Outbound/Gather");
  $gather->terminatingDigits("#");
  $gather->maxDigits(1);
  $gather->firstDigitTimeout(10);
  $gather->speakSentence($speakSentence);
  $gather->tag($data['tag']);

  $bxmlResponse->addVerb($gather);

  $bxml = $bxmlResponse->toBxml();
  $response = $response->withStatus(200)->withHeader('Content-Type', 'application/xml');
  $response->getBody()->write($bxml);
  return $response;
});


// act on the outbound callee's pressed digits
$app->post('/Outbound/Gather', function (Request $request, Response $response) {
  $data = $request->getParsedBody();
  $digits = $data['digits'];

  if ($digits == '1'){
    $bxmlResponse = new BandwidthLib\Voice\Bxml\Response();
    $speakSentence = new BandwidthLib\Voice\Bxml\SpeakSentence("The bridge will start now");
    $speakSentence->voice("julie");

    $bridge = new BandwidthLib\Voice\Bxml\Bridge($data['tag']);

    $bxmlResponse->addVerb($speakSentence);
    $bxmlResponse->addVerb($bridge);

    $bxml = $bxmlResponse->toBxml();
    $response = $response->withStatus(200)->withHeader('Content-Type', 'application/xml');
    $response->getBody()->write($bxml);
    return $response;
  } else {
    updateCall($data['tag']);
    return $response->withStatus(204);
  }

});


// Handle a disconnect event from the outbound callee
$app->post('/Disconnect', function (Request $request, Response $response) {
  $data = $request->getParsedBody();
  if ($data['eventType' == 'timeout']){
    updateCall($data['tag']);
  }
  return $response->withStatus(204);
});


// Update the original Inbound call to record a voicemail
$app->post('/UpdateCall', function (Request $request, Response $response) {
  global $BASE_URL;

  $data = $request->getParsedBody();
  $bxmlResponse = new BandwidthLib\Voice\Bxml\Response();

  $speakSentence = new BandwidthLib\Voice\Bxml\SpeakSentence("The person you are trying to reach is not available, please leave a message at the tone");
  $speakSentence->voice("julie");

  $playAudio = new BandwidthLib\Voice\Bxml\PlayAudio("https://www.soundjay.com/button/sounds/beep-01a.wav");

  $record = new BandwidthLib\Voice\Bxml\Record();
  $record->recordingAvailableUrl($BASE_URL . "/Recording");
  $record->recordingAvailableMethod('POST');
  $record->maxDuration(30);

  $bxmlResponse->addVerb($speakSentence);
  $bxmlResponse->addVerb($playAudio);
  $bxmlResponse->addVerb($record);

  $bxml = $bxmlResponse->toBxml();
  $response = $response->withStatus(200)->withHeader('Content-Type', 'application/xml');
  $response->getBody()->write($bxml);
  return $response;
});


// Download the recorded voicemail to a folder in our project directory once its complete
$app->post('/Recording', function (Request $request, Response $response) {
  global $BANDWIDTH_ACCOUNT_ID, $voiceClient;
  $data = $request->getParsedBody();
  try {
      $request = $voiceClient->getStreamRecordingMedia($BANDWIDTH_ACCOUNT_ID, $data['callId'], $data['recordingId']);
      $file = fopen("../Recordings/" . $data['recordingId'] . ".wav", "wb") or die("Unable to open file");
      fwrite($file, $request->getResult());
      fclose($file);
      return $response->withStatus(204);
  } catch (BandwidthLib\APIException $e) {
      return $response->withStatus(500);
  }
});


// Capture call status 
$app->post('/Status', function (Request $request, Response $response) {
  return $response->withStatus(204);
});

$app->run();
