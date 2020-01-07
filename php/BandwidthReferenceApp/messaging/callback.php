<?php

/*
 * callback.php
 *
 * A simple php app to demonstrate how to use Bandwidth's Messaging API with callbacks.
 *
 * @copyright Bandwidth INC
 */

require_once "../vendor/autoload.php";

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
        'messagingBasicAuthUserName' => $MESSAGING_API_TOKEN,
        'messagingBasicAuthPassword' => $MESSAGING_API_SECRET
    )
);
$client = new BandwidthLib\BandwidthClient($config);

$messagingClient = $client->getMessaging()->getClient();

$data = json_decode(file_get_contents('php://input'), true);

/*
 * Handle the inbound message based on the following rules:
 *  If the message contains "call me", make an outbound call
 *  If the message contains media, the media is downloaded
 *   locally, uploaded to Bandwidth, and is sent as a MMS reply
 *  Otherwise, the response is the current datetime
 * All other message callbacks are ignored
 */
if ($data[0]["type"] == "message-received") {
    if (strpos($data[0]["message"]["text"], "call me") !== false) {
        echo "NYI";
    }
    elseif (array_key_exists("media", $data[0]["message"])) {
        echo "NYI";
    }
    else {
        //handleInboundSms(array($data[0]["message"]["from"]), $data[0]["message"]["to"][0]);
        $to = array($data[0]["message"]["from"]);
        $from = $data[0]["message"]["to"][0];

        $body = new BandwidthLib\Messaging\Models\MessageRequest();
        $body->applicationId = $MESSAGING_APPLICATION_ID;
        $body->to = $to;
        $body->from = $from;
        $body->text = "The current date-time is: " . microtime() . " milliseconds since the epoch";

        $messagingClient->createMessage($MESSAGING_ACCOUNT_ID, $body);
    }
}
