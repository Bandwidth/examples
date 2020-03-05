<?php
  
/**
 * phone_number_ordering.php
 *
 * A simple Slim app to demonstrate number ordering through Bandwidth's API 
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

$client = new \Iris\Client($IRIS_USERNAME, $IRIS_PASSWORD, ['url' => 'https://dashboard.bandwidth.com/api/']);
$account = new \Iris\Account($IRIS_ACCOUNT_ID, $client);

class PhoneNumbers {

    /**
     * Maps a phone number to the phoneNumber/bandwidthOrderId structure
     *
     * @var array
     */
    private $phoneNumbers;

    function __construct() {
        $this->phoneNumbers = array();
    }

    /**
     * Adds a phone number and its order id to the in memory storage
     *
     * @param string $phoneNumber The phone number to add
     * @param string $orderId The order id
     */
    function addPhoneNumber($phoneNumber, $orderId) {
        $this->phoneNumbers[$phoneNumber] = array(
            "phoneNumber" => $phoneNumber;
            "bandwidthOrderId" => $orderId;
        );
    }

    /**
     * Removes a phone number from the in memory storage
     *
     * @param string $phoneNumber The number to remove
     * @throws Exception If the phone number is not found
     */
    function removePhoneNumber($phoneNumber) {
        if phoneNumberExists($phoneNumber) {
            unset($this->phoneNumbers[$phoneNumber]);
        } else {
            throw new Exception("Phone number not found");
        }
    }

    /**
     * Returns a JSON string of all phone numbers
     *
     * @return string
     */
    function getPhoneNumbersJson() {
        return json_encode(array_values($this->phoneNumbers));
    }

    /**
     * Returns true if the phone number exists, false otherwise
     *
     * @param string $phoneNumber The phone number to check
     * @return bool
     */
    function phoneNumberExists($phoneNumber) {
        return array_key_exists($phoneNumber, $this->phoneNumbers);
    }
}
