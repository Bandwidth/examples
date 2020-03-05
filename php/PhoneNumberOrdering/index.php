<?php
  
/**
 * index.php
 *
 * A simple Slim app to demonstrate number ordering through Bandwidth's API 
 *
 * @copyright Bandwidth INC
 */
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

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
            "phoneNumber" => $phoneNumber,
            "bandwidthOrderId" => $orderId
        );
    }

    /**
     * Removes a phone number from the in memory storage
     *
     * @param string $phoneNumber The number to remove
     * @throws Exception If the phone number is not found
     */
    function removePhoneNumber($phoneNumber) {
        if (phoneNumberExists($phoneNumber)) {
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

/**
 * Generates a consistent JSON error response body
 *
 * @param string $type The type of error
 * @param string $description Error description
 * @param string $bandwidthErrorCode Error code returned by bandwidth
 * @param string $bandwidthErrorDescription Error description returned by bandwidth
 * @return string
 */
function errorJson($type, $description, $bandwidthErrorCode, $bandwidthErrorDescription) {
    return json_encode(array(
        "type" => $type,
        "description" => $description,
        "bandwidthErrorCode" => $bandwidthErrorCode,
        "bandwidthErrorDescription" => $bandwidthErrorDescription
    ));
}

$app = AppFactory::create();

$app->addErrorMiddleware(true, true, true);

$app->post('/subscriptions/orders', function (Request $request, Response $response) {
    
});

$app->post('/subscriptions/disconnects', function (Request $request, Response $response) {
    
});

$app->get('/availablePhoneNumbers', function (Request $request, Response $response) {
    $areaCode = $request->getQueryParam("areaCode", null);
    if ($areaCode && !(preg_match('/^\d{3}$/', $areaCode))) {
        $response->getBody()->write(errorJson("validation", "Area code is in an invalid format", "", ""));
        return $response->withStatus(400);
    }

    $zipCode = $request->getQueryParam("zipCode", null);
    if ($zipCode && !(preg_match('/^\d{5}$/', $zipCode))) {
        $response->getBody()->write(errorJson("validation", "Zip code is in an invalid format", "", ""));
        return $response->withStatus(400);
    }

    $queryParams = array("quantity" => 10);
    if ($areaCode) {
        $queryParams["areaCode"] = $areaCode;
    }

    if ($zipCode) {
        $queryParams["zipCode"] = $zipCode;
    }

    try {
        global $account;
        $phoneNumbers = $account->availableNumbers($queryParams);
        $nums = [];
        foreach ($phoneNumbers as $phone) {
            array_push($nums, $phone->TelephoneNumber);
        }
        $response->getBody()->write(json_encode($nums[0]));
    }
    catch (Exception $e) {
        $response->getBody()->write(errorJson("validation", "Unable to search for numbers", "", $e->getMessage()));
        return $response->withStatus(400);
    }
    return $response;
});

$app->post('/phoneNumbers', function (Request $request, Response $response) {
    
});

$app->get('/phoneNumbers', function (Request $request, Response $response) {
    
});

$app->delete('/phoneNumbers/{phoneNumber}', function (Request $request, Response $response, $args) {
    
});

$app->run();
