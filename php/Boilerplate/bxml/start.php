<?php

require_once "../vendor/autoload.php";

$response = new BandwidthLib\Voice\Bxml\Response();
echo $response->toBxml();
