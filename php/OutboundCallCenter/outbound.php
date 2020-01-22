<?php

/*
 * outbound.php
 *
 * Handles an incoming POST request with a JSON object with the following fields
 *  studentPhoneNumber: str
 *  desiredCallerId: str
 *  agentPhoneNumber: str
 *
 * All phone numbers are in the format +1XXXYYYZZZZ
 *
 * Creates a new call using Bandwidth's Voice API. The "tag" field is used to define the
 * caller ID and final destination phone numbers for the transfer
 */

require_once "vendor/autoload.php";

$VOICE_ACCOUNT_ID = getenv("VOICE_ACCOUNT_ID");
$VOICE_API_USERNAME = getenv("VOICE_API_USERNAME");
$VOICE_API_PASSWORD = getenv("VOICE_API_PASSWORD");
$VOICE_APPLICATION_ID = getenv("VOICE_APPLICATION_ID");
$BASE_URL = getenv("BASE_URL");
$BW_PHONE_NUMBER = getenv("BW_PHONE_NUMBER");

$config = new BandwidthLib\Configuration(
    array(
        'voiceBasicAuthUserName' => $VOICE_API_USERNAME,
        'voiceBasicAuthPassword' => $VOICE_API_PASSWORD
    )
);
$client = new BandwidthLib\BandwidthClient($config);

$voiceClient = $client->getVoice()->getClient();

$data = json_decode(file_get_contents('php://input'), true);

$tagObject->studentPhoneNumber = $data["studentPhoneNumber"];
$tagObject->desiredCallerId = $data["desiredCallerId"];

$body = new BandwidthLib\Voice\Models\ApiCreateCallRequest();
$body->from = $BW_PHONE_NUMBER;
$body->to = $data["agentPhoneNumber"];
$body->answerUrl = $BASE_URL . "/transfer.php";
$body->applicationId = $VOICE_APPLICATION_ID;
$body->tag = json_encode($tagObject);

$voiceClient->createCall($VOICE_ACCOUNT_ID, $body);

echo "call created\n";
