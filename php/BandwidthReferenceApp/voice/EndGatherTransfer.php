<?php

/*
 * EndGatherTransfer.php
 *
 * A simple php app to demonstrate how to use Bandwidth's Voice API with callbacks.
 *
 * @copyright Bandwidth INC
 */

require_once "../vendor/autoload.php";

$data = json_decode(file_get_contents('php://input'), true);
$phoneNumberString = "+1" . $data["digits"];

$phoneNumber = new BandwidthLib\Voice\Bxml\PhoneNumber($phoneNumberString);
$transfer = new BandwidthLib\Voice\Bxml\Transfer();
$transfer->transferCallerId($data["from"]);
$transfer->phoneNumbers(array($phoneNumber));

$response = new BandwidthLib\Voice\Bxml\Response();
$response->addVerb($transfer);

echo $response->toBxml();
