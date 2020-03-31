# Bandwidth Ruby Template

## Description
A template to be used to build Bandwidth apps in Ruby

## Running The App

### Environmental Variables
The following environmental variables need to be set. For more information about each variable. Read more about each variable on the [Security & Credentials Documentation Page](https://dev.bandwidth.com/guides/accountCredentials.html#top).

| Variable                              | Description                             | Example                                            |
|:--------------------------------------|:----------------------------------------|:---------------------------------------------------|
| `BANDWIDTH_ACCOUNT_ID`                | Your Bandwidth Account Id               | `239525`                                            |
| `BANDWIDTH_API_USER`                  | Your Bandwidth API Username             | `johnDoe`                                          |
| `BANDWIDTH_API_PASSWORD`              | Your Bandwidth API Password             | `correct-horse-battery-stap1e`                     |
| `BANDWIDTH_MESSAGING_TOKEN`           | Your Bandwidth Messaging API token      | `eabb9d360e4025c81e28d336612ff402861a68d8f578307e` |
| `BANDWIDTH_MESSAGING_SECRET`          | Your Bandwidth Messaging API secret     | `70ba9d5e4f6c9739f86eab6e117f148af1ef8093793cbc87` |
| `BANDWIDTH_MESSAGING_APPLICATION_ID ` | Your Bandwidth Messaging application ID | `725e2ee2-a8c9-4a41-896a-9adad68456a8`             |
| `BANDWIDTH_VOICE_APPLICATION_ID`      | Your Bandwidth Voice application ID     | `acd1575d-b0f7-4274-95ee-e942a286df8c`             |


### Callback URLs For Bandwidth Applications

| Callback Type          | URL                           |
|:-----------------------|:------------------------------|
| Messaging Callback     | `/Callbacks/Messaging`     |
| Inbound Voice Callback | `/Callbacks/Voice/Inbound` |

### Commands
Run the following commands to get started

```
gem install bundler
bundle install
ruby app.rb
```
