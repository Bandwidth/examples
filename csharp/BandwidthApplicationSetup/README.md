<div align="center">

# Bandwidth C# Application Setup

![BW_all](../../.readme_images/BW_all.png)

</div>

## About

The 'program.cs' contains a quick script to setup a Bandwidth account to use HTTP Voice & HTTP Messaging.  It _mostly_ follows the [Automate Account Setup](https://dev.bandwidth.com/account/guides/programmaticApplicationSetup.html#top) guide.

* [Site (aka Subaccount)](https://dev.bandwidth.com/account/guides/programmaticApplicationSetup.html#create-subaccount-site)
* [Sipper (aka Location)](https://dev.bandwidth.com/account/guides/programmaticApplicationSetup.html#create-location)
* [Messaging Application](https://dev.bandwidth.com/account/applications/about.html)
* [Voice Application](https://dev.bandwidth.com/account/applications/about.html)

## PreReqs

* [Bandwidth Account](https://dashboard.bandwidth.com)
* [**Account Management** Credentials](https://dev.bandwidth.com/guides/accountCredentials.html#top)
* [Familiarity with the setup guide](https://dev.bandwidth.com/account/guides/programmaticApplicationSetup.html#top)
* [`Bandwidth.Iris` SDK](https://www.nuget.org/packages/Bandwidth.Iris/)


## Environment Variables

The following environmental variables need to be set

| Variable                 | Description                 |
|:-------------------------|:----------------------------|
| `BANDWIDTH_ACCOUNT_ID`   | Your Bandwidth account ID  |
| `BANDWIDTH_API_USER`     | Your Bandwidth API username |
| `BANDWIDTH_API_PASSWORD` | Your Bandwidth API password |

## Run the program

Ensure that DotNet framework or DotNetCore is installed (dotnet core users may notice warnings during build)

### Dotnet Core

```
$ dotnet run
```

Will build and and run the Program.cs script

#### Output

```
$ dotnet run
Created Site/Subaccount with ID: 32597
Created SipPeer/Location with ID: 611568
Created Messaging Appliction with ID: 5adf6d43-7da9-4486-a7b2-df869c043911
Updated SipPeer/Location with SMS Settings.
Updated SipPeer/Location with MMS Settings.
Updated SipPeer/Location with Messaging Application
Created Voice Application with ID: e34393c9-1064-4e
```