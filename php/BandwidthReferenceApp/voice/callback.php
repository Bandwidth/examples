<?php

/*
 * callback.php
 *
 * A simple php app to demonstrate how to use Bandwidth's Voice API with callbacks.
 *
 * @copyright Bandwidth INC
 */

require_once "../vendor/autoload.php";

$pause = new BandwidthLib\Voice\Bxml\Pause();
$pause->duration(3);

$speakSentence1 = new BandwidthLib\Voice\Bxml\SpeakSentence("Let's play a game");
$speakSentence1->voice("susan");

$speakSentence2 = new BandwidthLib\Voice\Bxml\SpeakSentence("What is 3 times 4");
$speakSentence2->voice("susan");

$redirect = new BandwidthLib\Voice\Bxml\Redirect();
$redirect->redirectUrl("/voice/StartGatherGame.php");

$response = new BandwidthLib\Voice\Bxml\Response();
$response->addVerb($pause);
$response->addVerb($speakSentence1);
$response->addVerb($speakSentence2);
$response->addVerb($redirect);

echo $response->toBxml();
