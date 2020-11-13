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

$voice_client = $client->getVoice()->getClient();

$app->post('/outboundCall', function (Request $request, Response $response) {
    // POST with to, from, and tag creates outbound call
    global $BANDWIDTH_ACCOUNT_ID, $BANDWIDTH_VOICE_APPLICATION_ID, $BASE_URL, $voice_client;
    $data = $request->getParsedBody();
    $body = new BandwidthLib\Voice\Models\ApiCreateCallRequest();
    $body->from = $data['from'];
    $body->to = $data['to'];
    $body->answerUrl = $BASE_URL . "/voiceCallback";;
    $body->applicationId = $BANDWIDTH_VOICE_APPLICATION_ID;

    try {
        $apiResponse = $voice_client->createCall($BANDWIDTH_ACCOUNT_ID, $body);
        $callId = $apiResponse->getResult()->callId;
        $response->getBody()->write('{"callId": "'.$callId.'"}');
        return $response->withStatus(201)
          ->withHeader('Content-Type', 'application/json');
    } catch (BandwidthLib\APIException $e) {
        print_r($e);
    }
    return $response->withStatus(201);
});

$app->post('/voiceCallback', function (Request $request, Response $response) {
    // Return Gather bxml
    $speakSentence = new BandwidthLib\Voice\Bxml\SpeakSentence("Press one for option one, Press two for option two. Then, press pound");
    $speakSentence->voice("kate");

    $gather = new BandwidthLib\Voice\Bxml\Gather();
    $gather->gatherUrl("/gatherCallback");
    $gather->terminatingDigits("#");
    $gather->maxDigits(1);
    $gather->firstDigitTimeout(10);
    $gather->speakSentence($speakSentence);

    $bxmlResponse = new BandwidthLib\Voice\Bxml\Response();
    $bxmlResponse->addVerb($gather);

    $bxml = $bxmlResponse->toBxml();
    $response = $response->withStatus(200)->withHeader('Content-Type', 'application/xml');
    $response->getBody()->write($bxml);
    return $response;

});

$app->post('/gatherCallback', function (Request $request, Response $response) {
    $data = $request->getParsedBody();

    if ($data['digits'] == 1){
      $speakSentence = new BandwidthLib\Voice\Bxml\SpeakSentence("You have chosen option one, thank you.");
    } else if ($data['digits'] == 2){
      $speakSentence = new BandwidthLib\Voice\Bxml\SpeakSentence("You have chosen option two, thank you.");
    } else {
      $speakSentence = new BandwidthLib\Voice\Bxml\SpeakSentence("You have chosen an invalid option.");
    }
    $speakSentence->voice("julie");

    $bxmlResponse = new BandwidthLib\Voice\Bxml\Response();
    $bxmlResponse->addVerb($speakSentence);

    $bxml = $bxmlResponse->toBxml();
    $response = $response->withStatus(200)->withHeader('Content-Type', 'application/xml');
    $response->getBody()->write($bxml);
    return $response;

});

$app->run();
