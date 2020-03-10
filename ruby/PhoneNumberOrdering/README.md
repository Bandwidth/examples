<div align="center">

# Phone Number Ordering Server

![BW_all](../../.readme_images/BW_PhoneNumbers.png)

</div>
A demo app that creates a Ruby/Sinatra server that exposes endpoints to order phone numbers from Bandwidth

## Running The App

### Installations

Run

```
bundle install
```

to install the required dependencies

### Environmental Variables
The following environmental variables need to be set

| Variable | Description |
|--|--|
| IRIS_USERNAME | Your Bandwidth Iris Username |
| IRIS_PASSWORD | Your Bandwidth Iris password |
| IRIS_ACCOUNT_ID | Your Bandwidth AccountID |
| SITE_ID | Your Bandwidth Sub Account ID |

### Creating Subscriptions

Run

```
ruby create_subscriptions.rb <BASE_URL>
```

to setup your subscription callbacks

### Running The Server

Run

```
ruby phone_number_ordering.rb
```

to start the server

## Server Endpoints

### Subscription Order Callbacks

Bandwidth sends information to this endpoint

Request
```
POST /subscriptions/orders
```

### Subscription Disconnect Callbacks

Bandwidth sends information to this endpoint

Request
```
POST /subscriptions/disconnects
```

### Search Phone Numbers

Searches for phone numbers to order. Responds with a list of up to 10 phone numbers based on the search query.

Request
```
GET /availablePhoneNumbers
```

| Query Parameter | Description |
|--|--|
| areaCode | A 3 digit area code to search for phone numbers in |
| zipCode | A 5 digit zip code to search for phone numbers in |

Response
```
<response>
```

### Order Phone Number

Places an order for a phone number

Request
```
POST /phoneNumbers
```

| JSON Request Field | Description |
|--|--|
| phoneNumber | The number to order |

Response
```
<response example>
```

| JSON Response Field | Description |
|--|--|
| phoneNumber | The number being ordered |
| bandwidthOrderId | The order ID assigned by Bandwidth |

### Get Phone Numbers

Returns an array of all phone number and order ID pairs

Request
```
GET /phoneNumbers
```

Response
```
<response example>
```

| JSON Response Field | Description |
|--|--|
| phoneNumber | The number being ordered |
| bandwidthOrderId | The order ID assigned by Bandwidth |

### Delete Phone Number

Deletes a phone number

Request
```
DELETE /phoneNumbers/{phoneNumber}
```

## Error Schema

Any expected error will return a JSON object defined below

| JSON Response Field | Description |
|--|--|
| type | Type of error. One of `validation, order-failure, disconnect-failure, number-not-found` |
| description | Description of the error type  |
| bandwidthErrorCode | (optional) Error code returned by Bandwidth |
| bandwidthErrorDescription | (optional) Error description returned by Bandwidth |
