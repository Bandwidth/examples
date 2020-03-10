<?php

require_once "../vendor/autoload.php";

$VOICE_ACCOUNT_ID = getenv("VOICE_ACCOUNT_ID");
$VOICE_API_USERNAME = getenv("VOICE_API_USERNAME");
$VOICE_API_PASSWORD = getenv("VOICE_API_PASSWORD");
$VOICE_APPLICATION_ID = getenv("VOICE_APPLICATION_ID");

$config = new BandwidthLib\Configuration(
    array(
        'voiceBasicAuthUserName' => $VOICE_API_USERNAME,
        'voiceBasicAuthPassword' => $VOICE_API_PASSWORD
    )
);

$client = new BandwidthLib\BandwidthClient($config);

$voiceClient = $client->getVoice()->getClient();

$data = json_decode(file_get_contents('php://input'), true);

$to = $data["to"];
$from = $data["from"];
$answerUrl = $data["answerUrl"];

$body = new BandwidthLib\Voice\Models\ApiCreateCallRequest();
$body->from = $from;
$body->to = $to;
$body->answerUrl = $answerUrl;
$body->applicationId = $VOICE_APPLICATION_ID;

$voiceClient->createCall($VOICE_ACCOUNT_ID, $body);
