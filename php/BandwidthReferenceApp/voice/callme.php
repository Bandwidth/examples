<?php

/*
 * callme.php
 *
 * A simple php app to demonstrate how to use Bandwidth's Voice API with callbacks.
 *
 * @copyright Bandwidth INC
 */

require_once "../vendor/autoload.php";

$VOICE_ACCOUNT_ID = getenv("VOICE_ACCOUNT_ID");
$VOICE_API_USERNAME = getenv("VOICE_API_USERNAME");
$VOICE_API_PASSWORD = getenv("VOICE_API_PASSWORD");
$VOICE_APPLICATION_ID = getenv("VOICE_APPLICATION_ID");
$BASE_URL = getenv("BASE_URL");

if($BASE_URL == NULL || $VOICE_API_USERNAME == NULL || $VOICE_API_PASSWORD == NULL || $VOICE_APPLICATION_ID == NULL || $VOICE_ACCOUNT_ID == NULL) {
    echo "Please set the VOICE environmental variables defined in the README\n";
    exit(-1);
}

$config = new BandwidthLib\Configuration(
    array(
        // Set authentication parameters
        'voiceBasicAuthUserName' => $VOICE_API_USERNAME,
        'voiceBasicAuthPassword' => $VOICE_API_PASSWORD
    )
);
$client = new BandwidthLib\BandwidthClient($config);

$voiceClient = $client->getVoice()->getClient();
