<div align="center">

# Bandwidth C# (dotnet core) Phone Number Ordering App

![BW_all](../../../.readme_images/BW_PhoneNumbers.png)

</div>

A small sample app that covers basic use cases with Bandwidth's Numbers API

## Pre-Reqs

You will need a Bandwidth account with a location and subaccount created and have their IDs handy.

## Installation

Clone the repo and run `dotnet restore` to get started

## Usage

The following environmental variables need to be set

| Variable                     | Description                                         |
|:-----------------------------|:----------------------------------------------------|
| `BANDWIDTH_ACCOUNT_ID`       | Your Bandwidth Messaging account ID                 |
| `BANDWIDTH_API_USER`         | Your Bandwidth API username                         |
| `BANDWIDTH_API_PASSWORD`     | Your Bandwidth API password                         |
| `BANDWIDTH_SIPPEER_ID`  | Your Bandwidth Location/Sippeer ID                  |
| `BANDWIDTH_SITE_ID` | Your Bandwidth Subaccount/Site ID                 |

## Walk Through

* ⚠️ App **does not** handle errors anywhere, will fail if an exception is thrown

* Searches for 10 phone numbers in an areaCode
* Searches for 10 phone numbers in a zipCode
* Searches for 10 toll free numbers
* Orders the first result of each of the searches for a total of 3 numbers
* Polls the order status until complete
* Fetches information about a number
* Adds a forwarding option to a number (not in the SDK, uses `System.Net.Http`)
* Disconnects all the numbers it ordered
* Lists inservice numbers