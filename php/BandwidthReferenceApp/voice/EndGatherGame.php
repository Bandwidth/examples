<?php

/*
 * EndGatherGame.php
 *
 * A simple php app to demonstrate how to use Bandwidth's Voice API with callbacks.
 *
 * @copyright Bandwidth INC
 */

require_once "../vendor/autoload.php";

$data = json_decode(file_get_contents('php://input'), true);
$digits = $data["digits"];
$playAudio;

if ($digits == "12") {
    $playAudio = new BandwidthLib\Voice\Bxml\PlayAudio("https://www.kozco.com/tech/piano2.wav");
} else {
    $playAudio = new BandwidthLib\Voice\Bxml\PlayAudio("https://www.kozco.com/tech/piano2.wav");
}

$response = new BandwidthLib\Voice\Bxml\Response();
$response->addVerb($playAudio);

echo $response->toBxml();
