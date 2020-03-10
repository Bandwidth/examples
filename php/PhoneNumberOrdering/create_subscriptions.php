<?php

/**
 * create_subscriptions.php
 *
 * A small script that sets up subscription callbacks for Bandwidth number ordering
 *
 * @copyright Bandwidth INC
 */

require 'vendor/autoload.php';

$IRIS_ACCOUNT_ID = getenv("IRIS_ACCOUNT_ID");
$IRIS_USERNAME = getenv("IRIS_USERNAME");
$IRIS_PASSWORD = getenv("IRIS_PASSWORD");
$SITE_ID = getenv("SITE_ID");

if($IRIS_ACCOUNT_ID == '' || $IRIS_USERNAME == '' || $IRIS_PASSWORD == '' || $SITE_ID == '') {
    echo "Please set the environmental variables defined in the README\n";
    exit(-1);
}

$base_url = $argv[1];

if ($base_url == '') {
    echo "usage: php create_subscriptions.php <base_url>\n";
    exit(-1);
}

if (substr($base_url, -1) != "/") {
    $base_url = $base_url . "/";
}

$orders_url = $base_url . "subscriptions/orders";
$disconnects_url = $base_url . "subscriptions/disconnects";

$client = new \Iris\Client($IRIS_USERNAME, $IRIS_PASSWORD, ['url' => 'https://dashboard.bandwidth.com/api/']);
$account = new \Iris\Account($IRIS_ACCOUNT_ID, $client);

$subscription = $account->subscriptions()->create([
    "OrderType" => "orders",
    "CallbackSubscription" => [
        "URL" => $orders_url
    ]
]);

$subscription = $account->subscriptions()->create([
    "OrderType" => "disconnects",
    "CallbackSubscription" => [
        "URL" => $disconnects_url
    ]
]);
