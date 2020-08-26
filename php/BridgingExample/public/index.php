<?php

use Slim\Factory\AppFactory;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

require_once "vendor/autoload.php";

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

function updateCall($callId){
  global $BANDWIDTH_ACCOUNT_ID;
  $body = new BandwidthLib\Voice\Models\ApiModifyCallRequest();
  $body->state = "active";
  $body->redirectUrl = $BASE_URL . "/UpdateCall";

  try {
      $voiceClient->modifyCall($BANDWIDTH_ACCOUNT_ID, $callId, $body);
  } catch (BandwidthLib\APIException $e) {
      print_r($e);
  }
}


$app->post('/Inbound/VoiceCallback', function (Request $request, Response $response) {

}


$app->post('/Outbound/Answer', function (Request $request, Response $response) {

}


$app->post('/Outbound/Gather', function (Request $request, Response $response) {

}


$app->post('/Disconnect', function (Request $request, Response $response) {

}


$app->post('/UpdateCall', function (Request $request, Response $response) {

}


$app->post('/Recording', function (Request $request, Response $response) {

}


$app->post('/Status', function (Request $request, Response $response) {

}
