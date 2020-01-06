<?php

/*
 * messaging.php
 *
 * A simple php app to demonstrate how to use Bandwidth's Messaging API with callbacks.
 *
 * @copyright Bandwidth INC
 */

require_once "vendor/autoload.php";

$MESSAGING_ACCOUNT_ID = getenv("MESSAGING_ACCOUNT_ID");
$MESSAGING_API_TOKEN = getenv("MESSAGING_API_TOKEN");
$MESSAGING_API_SECRET = getenv("MESSAGING_API_SECRET");
$MESSAGING_APPLICATION_ID = getenv("MESSAGING_APPLICATION_ID");

if($MESSAGING_API_TOKEN == NULL || $MESSAGING_API_SECRET == NULL || $MESSAGING_APPLICATION_ID == NULL || $MESSAGING_ACCOUNT_ID == NULL) {
    echo "Please set the MESSAGING environmental variables defined in the README\n";
    exit(-1);
}

$config = new BandwidthLib\Configuration(
    array(
        // Set authentication parameters
        'messagingBasicAuthUserName' => $MESSAGING_API_TOKEN,
        'messagingBasicAuthPassword' => $MESSAGING_API_SECRET
    )
);
$client = new BandwidthLib\BandwidthClient($config);

$messagingClient = $client->getMessaging()->getClient();

$data = json_decode(file_get_contents('php://input'), true);

if ($data[0]["type"] == "message-received") {
    $body = new BandwidthLib\Messaging\Models\MessageRequest();
    $body->applicationId = $MESSAGING_APPLICATION_ID;
    $body->to = array($data[0]["message"]["from"]);
    $body->from = $data[0]["message"]["to"][0];
    $body->text = "The current date-time is: " . microtime() . " milliseconds since the epoch";

    $response = $messagingClient->createMessage($MESSAGING_ACCOUNT_ID, $body);
}
