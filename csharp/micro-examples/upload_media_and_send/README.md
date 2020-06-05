<div align="center">

# Bandwidth C# (dotnet core) Media Upload Media and Send Message

![BW_Messaging](../../../.readme_images/BW_Messaging.png)

</div>

A small sample that uploads two pictures to Bandwidth's messaging media API and attaches them to send an MMS.

## Pre-Reqs

You will need the following setup:
* [Messaging Credentials](https://dev.bandwidth.com/guides/accountCredentials.html#messaging)
* [Account Configured for v2 Messaging](https://support.bandwidth.com/hc/en-us/articles/360033658613-Messaging-V2-API-Account-Setup-UI-)
* ⚠️ This script is not setup to receive callback urls. A free service like [RequestBin](https://requestbin.com/) can be used as your application's callback URL for quick testing.
* A phone number allocated to your location
* A test phone number to receive the picture messages

## Installation

### Update variables

The following environmental variables need to be set

| Variable                             | Description                             |
|:-------------------------------------|:----------------------------------------|
| `BANDWIDTH_ACCOUNT_ID`               | Your Bandwidth Messaging account ID     |
| `BANDWIDTH_API_USER`                 | Your Bandwidth API username             |
| `BANDWIDTH_API_PASSWORD`             | Your Bandwidth API password             |
| `BANDWIDTH_MESSAGING_TOKEN`          | Your Bandwidth Messaging API token      |
| `BANDWIDTH_MESSAGING_SECRET`         | Your Bandwidth Messaging API secret     |
| `BANDWIDTH_MESSAGING_APPLICATION_ID` | Your Bandwidth Messaging application ID |

### Update Program.cs

* Update the lines to their respective values:

  * `private static readonly string BANDWIDTH_PHONE_NUMBER = "";`
  * `private static readonly string TO_PHONE_NUMBER = "";`

### Install and run

* `$ dotnet restore` will install packages
* `$ dotnet run` will execute the code

## Walk Through

* Will upload two pictures
* Will send those two pictures as an MMS to the `TO_PHONE_NUMBER` from the `BANDWIDTH_PHONE_NUMBER`
* Will catch some errors and demonstrate how to access error information.
