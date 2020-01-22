<?php

/*
 * transfer.php
 *
 * Returns BXML to transfer a call to the desired phone number with the desired caller ID.
 */

require_once "vendor/autoload.php";

$data = json_decode(file_get_contents('php://input'), true);

$tag = json_decode($data["tag"], true);

$studentPhoneNumber = $tag["studentPhoneNumber"];
$desiredCallerId = $tag["desiredCallerId"];

$number = new BandwidthLib\Voice\Bxml\PhoneNumber($studentPhoneNumber);
$transfer = new BandwidthLib\Voice\Bxml\Transfer();
$transfer->transferCallerId($desiredCallerId);
$transfer->phoneNumbers(array($number));

$response = new BandwidthLib\Voice\Bxml\Response();
$response->addVerb($transfer);

echo $response->toBxml();
