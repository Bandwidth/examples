<?php

/*
 * StartGatherGame.php
 *
 * A simple php app to demonstrate how to use Bandwidth's Voice API with callbacks.
 *
 * @copyright Bandwidth INC
 */

require_once "../vendor/autoload.php";

$gather = new BandwidthLib\Voice\Bxml\Gather();
$gather->gatherUrl("/voice/EndGatherGame.php");
$gather->maxDigits(2);

$response = new BandwidthLib\Voice\Bxml\Response();
$response->addVerb($gather);

echo $response->toBxml();
