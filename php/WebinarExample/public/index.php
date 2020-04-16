<?php

use BandwidthLib\Messaging\Models\BandwidthCallbackMessage;
use BandwidthLib\Messaging\Models\BandwidthMessage;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;


require __DIR__ . '/../vendor/autoload.php';

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


$app->run();