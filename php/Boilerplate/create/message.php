<?php

require_once "../vendor/autoload.php";

$MESSAGING_ACCOUNT_ID = getenv("MESSAGING_ACCOUNT_ID");
$MESSAGING_API_TOKEN = getenv("MESSAGING_API_TOKEN");
$MESSAGING_API_SECRET = getenv("MESSAGING_API_SECRET");
$MESSAGING_APPLICATION_ID = getenv("MESSAGING_APPLICATION_ID");

$config = new BandwidthLib\Configuration(
    array(
        'messagingBasicAuthUserName' => $MESSAGING_API_TOKEN,
        'messagingBasicAuthPassword' => $MESSAGING_API_SECRET
    )
);

$client = new BandwidthLib\BandwidthClient($config);

$messagingClient = $client->getMessaging()->getClient();

$data = json_decode(file_get_contents('php://input'), true);

$to = $data["to"];
$from = $data["from"];
$text = $data["text"];

$body = new BandwidthLib\Messaging\Models\MessageRequest();
$body->applicationId = $MESSAGING_APPLICATION_ID;
$body->to = $to;
$body->from = $from;
$body->text = $text;

$messagingClient->createMessage($MESSAGING_ACCOUNT_ID, $body);
