<div align="center">

# Java Boilerplate Code

![BW_all](../../.readme_images/BW_PhoneNumbers.png)

</div>

## Description
A demo app to order numbers using the bandwidth-java-iris-sdk

## Running The App

### Environmental Variables
The following environmental variables need to be set

| Variable | Description |
|--|--|
| IRIS_USERNAME | Your Bandwidth Iris Username |
| IRIS_PASSWORD | Your Bandwidth Iris password |
| IRIS_ACCOUNT_ID | Your Bandwidth AccountID |
| SITE_ID | Your Bandwidth Sub Account ID |

### Build Project

* Note Must use Java version 1.8

```bash
mvn compile
```

### Run Project

```bash
mvn exec:java -Dexec.mainClass=com.main.PhoneNumberOrdering
```

### Creating Subscriptions

In order to recieve Notifications from Bandwidth two subscriptions must be created.
To learn more about subscriptions see https://dev.bandwidth.com/numbers/guides/onDemandNumberSearchAndOrder.html#create-subscription

The application will need a publicly accessible url.  If running locally use Ngrok or a similar tool.

POST the following bodies (seperately) to https://dashboard.bandwidth.com/api/accounts/{Your_Account_ID}/subscriptions

```xml
<Subscription>
    <OrderType>disconnects</OrderType>
    <CallbackSubscription>
        <URL>https://YOUR_BASE_URL.com/subscriptions/disconnects</URL> <!-- Change the base url -->
        <Expiry>100000</Expiry>
    </CallbackSubscription>
</Subscription>
```

```xml
<Subscription>
    <OrderType>orders</OrderType>
    <CallbackSubscription>
        <URL>https://YOUR_BASE_URL.com/subscriptions/orders</URL> <!-- Change the base url -->
        <Expiry>10000</Expiry>
    </CallbackSubscription>
</Subscription>
```

### Checking Available Phone Numbers

```html
GET localhost:8080/availablePhoneNumbers/?city=RALEIGH&state=NC

[
...
]
```

### Order a Phone Number

```html
POST localhost:8080/phoneNumbers

{
  "phoneNumber" : "9194569878"
}
```

### Disconnect a Phone Number

```html
DELETE localhost:8080/phoneNumbers/9194569878
```

### List Phone Numbers

```html

```
