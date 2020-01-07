<?php

/*
 * StartGatherTransfer.php
 *
 * A simple php app to demonstrate how to use Bandwidth's Voice API with callbacks.
 *
 * @copyright Bandwidth INC
 */

require_once "../vendor/autoload.php";

$speakSentence = new BandwidthLib\Voice\Bxml\SpeakSentence("Who do you want to transfer this call to? Enter the 10 digit phone number");
$speakSentence->voice("susan");

$gather = new BandwidthLib\Voice\Bxml\Gather();
$gather->gatherUrl("/voice/EndGatherTransfer.php");
$gather->maxDigits(10);
$gather->speakSentence($speakSentence);

$response = new BandwidthLib\Voice\Bxml\Response();
$response->addVerb($gather);

echo $response->toBxml();
