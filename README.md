<div align="center">

# Bandwidth Examples

![BW_ALL](.readme_images/BW_all.png)

</div>

This repository contains examples of how to use Bandwidth's APIs and SDKs.

## About

In order to run the examples, you'll need a Bandwidth account with valid API Credentials. See the links below:

* [Bandwidth Dashboard](https://dashboard.bandwidth.com)
* [Bandwidth Support](https://support.bandwidth.com)
* [Bandwidth Documentation](https://dev.bandwidth.com)
  * [Credential Overview](https://dev.bandwidth.com/guides/accountCredentials.html#top)
  * [Numbers](https://dev.bandwidth.com/numbers/about.html)
  * [Voice](https://dev.bandwidth.com/voice/about.html)
  * [Messaging](https://dev.bandwidth.com/messaging/about.html)

## Contents

* [NodeJS](nodejs)
* [C#](csharp)
* [Ruby](ruby)
* [Python](python)
* [PHP](php)
* [Java](java)

<div align="center">

## NodeJS

<img src="https://github.com/Bandwidth/examples/raw/master/.readme_images/js.png" width="15%">

</div>

### SDKs

The NodeJS SDK(s) are available via [NPM](https://www.npmjs.com/) & Github.

| Module                                                                       | Description                                                                   | Github                                                                                    |
|:-----------------------------------------------------------------------------|:------------------------------------------------------------------------------|:------------------------------------------------------------------------------------------|
| [`@banwdidth/numbers`](https://www.npmjs.com/package/@bandwidth/numbers)     | Manage phone numbers and account settings                                     | [<img src="https://github.com/favicon.ico">](https://github.com/Bandwidth/node-numbers)   |
| [`@bandwidth/voice`](https://www.npmjs.com/package/@bandwidth/numbers)       | Create outbound phone calls and manage call media (recordings/transcriptions) | [<img src="https://github.com/favicon.ico">](https://github.com/Bandwidth/node-voice)     |
| [`@bandwidth/bxml`](https://www.npmjs.com/package/@bandwidth/bxml)           | Create BXML for managing call flow                                            | N/A                                                                                       |
| [`@bandwidth/messaging`](https://www.npmjs.com/package/@bandwidth/messaging) | Create outbound messages and manage message media (MMS)                       | [<img src="https://github.com/favicon.ico">](https://github.com/Bandwidth/node-messaging) |

### Examples

| Example                                       | Description                                                                              | Products        |
|:----------------------------------------------|:-----------------------------------------------------------------------------------------|:----------------|
| [Reference App](nodejs/BandwidthReferenceApp) | A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs | Voice/Messaging |
| [BoilerPlate](nodejs/BoilerPlate)             | A template to be used to build Bandwidth apps in NodeJS                                  | Voice/Messaging |

<div align="center">

## C#

<img src="https://github.com/Bandwidth/examples/raw/master/.readme_images/csharp.png" width="15%">


</div>

### SDKs

The C# SDK(s) are available via [NuGet](https://www.nuget.org/) & Github

| Module                                                             | Description                                                                     | Github                                                                                           |
|:-------------------------------------------------------------------|:--------------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------|
| [`Bandwidth.Sdk`](https://www.nuget.org/packages/Bandwidth.Sdk/)   | Manage Phone Calls with BXML, Create outbound calls, SMS messages, MMS messages | [<img src="https://github.com/favicon.ico">](https://github.com/Bandwidth/csharp-sdk)            |
| [`Bandwidth.Iris`](https://www.nuget.org/packages/Bandwidth.Iris/) | Manage phone numbers and account settings                                       | [<img src="https://github.com/favicon.ico">](https://github.com/Bandwidth/csharp-bandwidth-iris) |

### Examples

| Example                                       | Description                                                                              | Products        |
|:----------------------------------------------|:-----------------------------------------------------------------------------------------|:----------------|
| [Reference App](csharp/BandwidthReferenceApp) | A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs | Voice/Messaging |
| [BoilerPlate](csharp/BoilerPlate)             | A template to be used to build Bandwidth apps in C#                                      | Voice/Messaging |

<div align="center">

## Ruby

<img src="https://github.com/Bandwidth/examples/raw/master/.readme_images/ruby.png" width="15%">

</div>

### SDKs

The Ruby SDK(s) are available via [RubyGems](https://rubygems.org/) & Github

| Module                                                                 | Description                                                                     | Github                                                                                         |
|:-----------------------------------------------------------------------|:--------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------------------|
| [`bandwidth-sdk`](https://rubygems.org/gems/bandwidth-sdk)             | Manage Phone Calls with BXML, Create outbound calls, SMS messages, MMS messages | [<img src="https://github.com/favicon.ico">](https://github.com/Bandwidth/ruby-sdk)            |
| [`ruby-bandwidth-iris`](https://rubygems.org/gems/ruby-bandwidth-iris) | Manage phone numbers and account settings                                       | [<img src="https://github.com/favicon.ico">](https://github.com/Bandwidth/ruby-bandwidth-iris) |

### Examples

| Example                                           | Description                                                                                                | Products        |
|:--------------------------------------------------|:-----------------------------------------------------------------------------------------------------------|:----------------|
| [Reference App](ruby/BandwidthReferenceApp)       | A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs                   | Voice/Messaging |
| [BoilerPlate](ruby/BoilerPlate)                   | A template to be used to build Bandwidth apps in Ruby                                                      | Voice/Messaging |
| [Voicemail](ruby/RecordingApp)                    | A sample app that mimics a voicemail service using Bandwidth's Voice API and Recording                     | Voice/Messaging |
| [Phone Number Ordering](ruby/PhoneNumberOrdering) | A demo app that creates a Ruby/Sinatra server that exposes endpoints to order phone numbers from Bandwidth | Numbers         |

<div align="center">

## Python

<img src="https://github.com/Bandwidth/examples/raw/master/.readme_images/python.png" width="15%">

</div>

### SDKs

The Python SDK(s) are available via [PyPi](https://pypi.org/) & Github

| Module                                                     | Description                                                                     | Github                                                                                |
|:-----------------------------------------------------------|:--------------------------------------------------------------------------------|:--------------------------------------------------------------------------------------|
| [`bandwidth-sdk`](https://pypi.org/project/bandwidth-sdk/) | Manage Phone Calls with BXML, Create outbound calls, SMS messages, MMS messages | [<img src="https://github.com/favicon.ico">](https://github.com/Bandwidth/python-sdk) |

### Examples

| Example                                       | Description                                                                              | Products        |
|:----------------------------------------------|:-----------------------------------------------------------------------------------------|:----------------|
| [Reference App](python/BandwidthReferenceApp) | A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs | Voice/Messaging |
| [BoilerPlate](python/BoilerPlate)             | A template to be used to build Bandwidth apps in Python                                  | Voice/Messaging |
| [Voicemail](python/RecordingApp)              | A sample app that mimics a voicemail service using Bandwidth's Voice API and Recording   | Voice/Messaging |

<div align="center">

## PHP

<img src="https://github.com/Bandwidth/examples/raw/master/.readme_images/php.png" width="15%">

### SDKs

</div>


The PHP SDK(s) are available via [Packagist](https://packagist.org/) & Github

| Module                                                            | Description                                                                     | Github                                                                                        |
|:------------------------------------------------------------------|:--------------------------------------------------------------------------------|:----------------------------------------------------------------------------------------------|
| [`bandwidth/sdk`](https://packagist.org/packages/bandwidth/sdk)   | Manage Phone Calls with BXML, Create outbound calls, SMS messages, MMS messages | [<img src="https://github.com/favicon.ico">](https://github.com/Bandwidth/php-sdk)            |
| [`bandwidth/iris`](https://packagist.org/packages/bandwidth/iris) | Manage phone numbers and account settings                                       | [<img src="https://github.com/favicon.ico">](https://github.com/Bandwidth/php-bandwidth-iris) |

### Examples

| Example                                          | Description                                                                                            | Products        |
|:-------------------------------------------------|:-------------------------------------------------------------------------------------------------------|:----------------|
| [Reference App](php/BandwidthReferenceApp)       | A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs               | Voice/Messaging |
| [BoilerPlate](php/BoilerPlate)                   | A template to be used to build Bandwidth apps in PHP                                                   | Voice/Messaging |
| [Outbound Call Center](php/OutboundCallCenter)   | A sample app to show how to create an outbound call with a desired caller ID                           | Voice           |
| [Phone Number Ordering](php/PhoneNumberOrdering) | A demo app that creates a PHP/Slim server that exposes endpoints to order phone numbers from Bandwidth | Numbers         |

<div align="center">

## Java

<img src="https://github.com/Bandwidth/examples/raw/master/.readme_images/java.png" width="15%">

</div>

### SDKs

The Java SDK(s) are available via [Maven](https://mvnrepository.com/) & Github

| Module                                                                                                                      | Description                                                                     | Github                                                                                         |
|:----------------------------------------------------------------------------------------------------------------------------|:--------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------------------|
| [`com.bandwidth.sdk/bandwidth-sdk`](https://mvnrepository.com/artifact/com.bandwidth.sdk/bandwidth-sdk)                     | Manage Phone Calls with BXML, Create outbound calls, SMS messages, MMS messages | [<img src="https://github.com/favicon.ico">](https://github.com/Bandwidth/java-sdk)            |
| [`com.bandwidth.sdk/bandwidth-java-iris-sdk`](https://mvnrepository.com/artifact/com.bandwidth.sdk/bandwidth-java-iris-sdk) | Manage phone numbers and account settings                                       | [<img src="https://github.com/favicon.ico">](https://github.com/Bandwidth/java-bandwidth-iris) |

### Examples

| Example                                           | Description                                                                              | Products        |
|:--------------------------------------------------|:-----------------------------------------------------------------------------------------|:----------------|
| [Reference App](java/BandwidthReferenceApp)       | A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs | Voice/Messaging |
| [BoilerPlate](java/BoilerPlate)                   | A template to be used to build Bandwidth apps in Java                                    | Voice/Messaging |
| [Phone Number Ordering](java/PhoneNumberOrdering) | A demo app to order numbers using the bandwidth-java-iris-sdk                            | Numbers         |
