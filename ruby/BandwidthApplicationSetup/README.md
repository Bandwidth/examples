<div align="center">

# Bandwidth Ruby Application Setup

![BW_all](../../.readme_images/BW_all.png)

</div>

## About

This directory contains a quick Ruby script to setup a Bandwidth account to use HTTP Voice & HTTP Messaging.  It _mostly_ follows the [Automate Account Setup](https://dev.bandwidth.com/account/guides/programmaticApplicationSetup.html#top) guide.

* [Site (aka Subaccount)](https://dev.bandwidth.com/account/guides/programmaticApplicationSetup.html#create-subaccount-site)
* [Sipper (aka Location)](https://dev.bandwidth.com/account/guides/programmaticApplicationSetup.html#create-location)
* [Messaging Application](https://dev.bandwidth.com/account/applications/about.html)
* [Voice Application](https://dev.bandwidth.com/account/applications/about.html)

## PreReqs

* [Bandwidth Account](https://dashboard.bandwidth.com)
* [**Account Management** Credentials](https://dev.bandwidth.com/guides/accountCredentials.html#top)
* [Familiarity with the setup guide](https://dev.bandwidth.com/account/guides/programmaticApplicationSetup.html#top)


## Environment Variables

The following environmental variables need to be set

| Variable                 | Description                 |
|:-------------------------|:----------------------------|
| `BANDWIDTH_ACCOUNT_ID`   | Your Bandwidth account ID  |
| `BANDWIDTH_API_USERNAME`     | Your Bandwidth API username |
| `BANDWIDTH_API_PASSWORD` | Your Bandwidth API password |

## Dependency Installation

Run

```
bundle install
```

to install the required gems.

## Run the program

Run

```
ruby setup.rb
```

to run the script.

### Output Example

```
Site ID: 1234
SipPeer ID: 876543
Messaging Application
{:application_id=>"01a-7d-42-ac-e8ee", :service_type=>"Messaging-V2", :app_name=>"BandwidthMsgApplication", :callback_url=>"https://yourcallback.com", :msg_callback_url=>"https://yourcallback.com", :callback_creds=>{}}
Voice Application
{:application_id=>"49-32-47-b2-05ef71", :service_type=>"Voice-V2", :app_name=>"BandwidthVoiceApplication", :call_initiated_callback_url=>"https://yourcallback.com", :call_initiated_method=>"POST"}
```
