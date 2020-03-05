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

    private static $instance = null;

    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new PhoneNumbers();
        }
        return self::$instance;
    }

    /**
     * Maps a phone number to the phoneNumber/bandwidthOrderId structure
     *
     * @var array
     */
    private $phoneNumbers;

    private function __construct() {
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
        if ($this->phoneNumberExists($phoneNumber)) {
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

/**
 * Taken from https://www.php.net/manual/en/class.simplexmlelement.php
 *
 * @param SimpleXMLElement $xml
 * @return array
 */
function xmlToArray(SimpleXMLElement $xml): array
{
    $parser = function (SimpleXMLElement $xml, array $collection = []) use (&$parser) {
        $nodes = $xml->children();
        $attributes = $xml->attributes();

        if (0 !== count($attributes)) {
            foreach ($attributes as $attrName => $attrValue) {
                $collection['attributes'][$attrName] = strval($attrValue);
            }
        }

        if (0 === $nodes->count()) {
            $collection['value'] = strval($xml);
            return $collection;
        }

        foreach ($nodes as $nodeName => $nodeValue) {
            if (count($nodeValue->xpath('../' . $nodeName)) < 2) {
                $collection[$nodeName] = $parser($nodeValue);
                continue;
            }

            $collection[$nodeName][] = $parser($nodeValue);
        }

        return $collection;
    };

    return [
        $xml->getName() => $parser($xml)
    ];
}

$app = AppFactory::create();

$app->addErrorMiddleware(true, true, true);

$app->post('/subscriptions/orders', function (Request $request, Response $response) {
    $body = xmlToArray(simplexml_load_string($request->getBody()));
    $orderId = $body["Notification"]["OrderId"]["value"];
    $phoneNumber = $body["Notification"]["CompletedTelephoneNumbers"]["TelephoneNumber"]["value"];

    PhoneNumbers::getInstance()->addPhoneNumber($phoneNumber, $orderId);
    $response->getBody()->write("success");
    return $response;
});

$app->post('/subscriptions/disconnects', function (Request $request, Response $response) {
    $body = xmlToArray(simplexml_load_string($request->getBody()));
    $phoneNumber = $body["Notification"]["CompletedTelephoneNumbers"]["TelephoneNumber"]["value"];

    PhoneNumbers::getInstance()->removePhoneNumber($phoneNumber);
    $response->getBody()->write("success");
    return $response;
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
    $body = json_decode($request->getBody(), true);
    $phoneNumber = $body["phoneNumber"];

    if (!$phoneNumber || !(preg_match('/^\d{10}$/', $phoneNumber))) {
        $response->getBody()->write(errorJson("validation", "Phone number is in an invalid format", "", ""));
        return $response->withStatus(400);
    }


    try {
        global $account;
        global $SITE_ID;
        $order = $account->orders()->create([
            "Name" => "PHP Sample App Order",
            "SiteId" => $SITE_ID,
            "ExistingTelephoneNumberOrderType" => [
                "TelephoneNumberList" => [
                    "TelephoneNumber" => [$phoneNumber]
                ]
            ]
        ]);

        $response->getBody()->write(json_encode(array("phoneNumber" => $phoneNumber, "bandwidthOrderId" => $order->id)));
        return $response->withStatus(201);
    } catch (Exception $e) {
        $response->getBody()->write(errorJson("order-failure", "Order request has failed", "", $e->getMessage()));
        return $response->withStatus(400);
    }
});

$app->get('/phoneNumbers', function (Request $request, Response $response) {
    $response->getBody()->write(PhoneNumbers::getInstance()->getPhoneNumbersJson());
    return $response;
    
});

$app->delete('/phoneNumbers/{phoneNumber}', function (Request $request, Response $response, $args) {
    $phoneNumber = $args["phoneNumber"];
    
    if (PhoneNumbers::getInstance()->phoneNumberExists($phoneNumber)) {
        try {
            global $account;
            $account->disconnects()->create(array(
                "Name" => "PHP Sample App Disconnect",
                "DisconnectTelephoneNumberOrderType" => array(
                    "TelephoneNumberList" => array(
                        "TelephoneNumber" => [$phoneNumber]
                    )
                )
            ));
            $response->getbody()->write("received");
            return $response->withstatus(201);
        } catch (Exception $e) {
            $response->getbody()->write(errorjson("disconnect-failure", "disconnect request has failed", "", $e->getmessage()));
            return $response->withstatus(400);
        }
    }
    else {
        $response->getBody()->write(errorJson("number-not-found", "Phone number not found", "", ""));
        return $response->withStatus(404);
    }
});

$app->run();
