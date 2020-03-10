<div align="center">

# Bandwidth Examples

![BW_ALL](.readme_images/BW_all.png)

</div>

This repository contains examples of how to use Bandwidth's APIs and SDKs.

## About

In order to run the examples, you'll need a Bandwidth account with valid API Credentials. See the links below

* [Bandwidth Dashboard](https://dashboard.bandwidth.com)
* [Bandwidth Support](https://support.bandwidth.com)
* [Bandwidth Documentation](https://dev.bandwidth.com)
  * [Credential Overview](https://dev.bandwidth.com/guides/accountCredentials.html#top)
  * [Numbers](https://dev.bandwidth.com/numbers/about.html)
  * [Voice](https://dev.bandwidth.com/voice/about.html)
  * [Messaging](https://dev.bandwidth.com/messaging/about.html)

### NodeJS

#### SDKs

The NodeJS SDK(s) are available via NPM & Github.

| Module                                                                       | Description                                                                   | Github                                                      | NPM                                                       |
|:-----------------------------------------------------------------------------|:------------------------------------------------------------------------------|:------------------------------------------------------------|:----------------------------------------------------------|
| [`@banwdidth/numbers`](https://www.npmjs.com/package/@bandwidth/numbers)     | Manage phone numbers and account settings                                     | [github](https://github.com/Bandwidth/node-numbers)         | [npm](https://www.npmjs.com/package/@bandwidth/numbers)   |
| [`@bandwidth/voice`](https://www.npmjs.com/package/@bandwidth/numbers)       | Create outbound phone calls and manage call media (recordings/transcriptions) | [github](https://github.com/Bandwidth/node-voice)           | [npm](https://www.npmjs.com/package/@bandwidth/voice)     |
| [`@bandwidth/bxml`](https://www.npmjs.com/package/@bandwidth/bxml)           | Create BXML for managing call flow                                            | [![github](.readme_images/gh_icon.png =36x36)](https://github.com) | [npm](https://www.npmjs.com/package/@bandwidth/bxml)      |
| [`@bandwidth/messaging`](https://www.npmjs.com/package/@bandwidth/messaging) | Create outbound messages and manage message media (MMS)                       | [github](https://github.com/Bandwidth/node-messaging)       | [npm](https://www.npmjs.com/package/@bandwidth/messaging) |

#### Examples

* [Reference App](nodejs/BandwidthReferenceApp) - A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs
* [BoilerPlate](nodejs/BoilerPlate) - A template to be used to build Bandwidth apps in NodeJS

