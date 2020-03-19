<div align="center">

# Bandwidth Java Webinar App

![BW_all](../../.readme_images/BW_all.png)

</div>

## Description
A template to be used to build Bandwidth apps in Java

## Pre-Reqs

You will need to set up Bandwidth Applications and have phone numbers associated with these application, and point the callback URL on these applications to the messaging and voice endpoints on the server running this app. `ngrok` is highly recommended for local prototyping.

## Running The App

### Environmental Variables
The following environmental variables need to be set

| Variable                   | Description                             |
|:---------------------------|:----------------------------------------|
| `MESSAGING_ACCOUNT_ID`     | Your Bandwidth Messaging account ID     |
| `MESSAGING_API_TOKEN`      | Your Bandwidth Messaging API token      |
| `MESSAGING_API_SECRET`     | Your Bandwidth Messaging API secret     |
| `MESSAGING_APPLICATION_ID` | Your Bandwidth Messaging application ID |
| `VOICE_ACCOUNT_ID`         | Your Bandwidth Voice account ID         |
| `VOICE_API_USERNAME`       | Your Bandwidth Voice API username       |
| `VOICE_API_PASSWORD`       | Your Bandwidth Voice API password       |
| `VOICE_APPLICATION_ID`     | Your Bandwidth Voice application ID     |


### Callback URLs For Bandwidth Applications

| Callback Type          | URL                           |
|:-----------------------|:------------------------------|
| Messaging Callback     | <url>/Callbacks/Messaging     |
| Inbound Voice Callback | <url>/Callbacks/Voice/Inbound |

## What you can do

* Text your phone number `dog` and you will recieve a picture of a dog sent back
* Text your phone number any phrase other than `dog` and you will receive a response
* Call your phone number and you will be asked to play a game

# Tutorial

## Assumptions

* Have Bandwidth Account
* Have Java Installed (along with Maven)
* Have [ngrok](https://ngrok.com) installed
* Familiarity with [SparkJava](https://sparkjava.com/)
* SIPPEER/Application/Site Setup in your [Dashboard](https://dashboard.bandwidth.com)
* [Bandwidth SDK](https://mvnrepository.com/artifact/com.bandwidth.sdk/bandwidth-sdk)

## Code-along

The tutorial picks up from the boiler plate and add/removes a few method

* Remove the `POST` methods to create messages and calls as we're only focused on incoming messages & calls

## Configure Bandwidth Controllers

```java
private static String MESSAGING_ACCOUNT_ID = System.getenv("MESSAGING_ACCOUNT_ID");
private static String MESSAGING_APPLICATION_ID = System.getenv("MESSAGING_APPLICATION_ID");

private static String VOICE_ACCOUNT_ID = System.getenv("VOICE_ACCOUNT_ID");
private static String VOICE_APPLICATION_ID = System.getenv("VOICE_APPLICATION_ID");

private static BandwidthClient client = new BandwidthClient.Builder()
        .messagingBasicAuthCredentials(System.getenv("MESSAGING_API_TOKEN"), System.getenv("MESSAGING_API_SECRET"))
        .voiceBasicAuthCredentials(System.getenv("VOICE_API_USERNAME"), System.getenv("VOICE_API_PASSWORD"))
        .environment(Environment.PRODUCTION)
        .build();

//Fully qualified name to remove conflicts
private static com.bandwidth.messaging.controllers.APIController messagingController = client.getMessagingClient().getAPIController();
private static com.bandwidth.voice.controllers.APIController voiceController = client.getVoiceClient().getAPIController();
```

## Handle Incoming Messages

### Parse Callback

Using the API Helper, de-serialize the callback into the BandwidthCallBackMessage object

```java
String json = req.body();
BandwidthCallbackMessage[] incomingMessageArray = ApiHelper.deserialize(json, BandwidthCallbackMessage[].class);
BandwidthCallbackMessage incomingMessage = incomingMessageArray[0];
BandwidthMessage message = incomingMessage.getMessage();
```

### Check the callback direction

The messaging API sends both DLRs and incoming to the same URL, so we need to check the direction of the message callback and only process inbound message.

```java
if(message.getDirection().equals("out")) {
    String logMessage = String.format("Message ID: %s DLR Status: %s", message.getId(), incomingMessage.getDescription());
    System.out.println(logMessage);
    return "";
}
```


### Build the response set

The callback object from Bandwidth contains all members of the group MMS (if it is a group MMS). We need to build the response array to ensure we're replying to the group and not just the original sender.

```java
String owner = message.getOwner();
List<String> numbers = new ArrayList<>(message.getTo());

numbers.removeIf(number -> Objects.equals(number, owner));
numbers.add(message.getFrom());
```

### Build the MessageRequest

Using the SDK build the message request template

```java
MessageRequest messageRequest = new MessageRequest.Builder()
        .applicationId(MESSAGING_APPLICATION_ID)
        .from(owner)
        .to(numbers)
        .build();
```

### Check the message text and send message

If the message `isDog` then send a MMS, other wise send normal text

```java
boolean isDog = message.getText().trim().toLowerCase().equals("dog");
if (isDog) {
    List<String> media = Collections.singletonList("https://bw-demo.s3.amazonaws.com/dog.jpg");
    MessageRequest mmsMessage = messageRequest.toBuilder()
            .text("🐶")
            .media(media)
            .build();
    try {
        ApiResponse<BandwidthMessage> response = messagingController.createMessage(MESSAGING_ACCOUNT_ID, mmsMessage);
        System.out.println(String.format("Sent Message with ID: %s", response.getResult().getId()));
    } catch (ApiException | IOException e){
        System.out.println("Failed sending message");
        System.out.println(e);
    }
}
else {
    MessageRequest smsMessage = messageRequest.toBuilder()
            .text("👋 Hello from Bandwidth")
            .build();

    try {
        ApiResponse<BandwidthMessage> response = messagingController.createMessage(MESSAGING_ACCOUNT_ID, smsMessage);
        System.out.println(String.format("Sent Message with ID: %s", response.getResult().getId()));
    } catch (ApiException | IOException e){
        System.out.println("Failed sending message");
        System.out.println(e);
    }
}
```

## Send Response back to Bandwidth

```java
res.status(200);

return "";//Just needs an ACK
```

## Final Message Handler

All together the message handler should look like:

```java
post("/Callbacks/Messaging", (req, res) -> {
    // We can set the status now

    String json = req.body();
    BandwidthCallbackMessage[] incomingMessageArray = ApiHelper.deserialize(json, BandwidthCallbackMessage[].class);
    BandwidthCallbackMessage incomingMessage = incomingMessageArray[0];
    BandwidthMessage message = incomingMessage.getMessage();

    // Handle DLRs
    if(message.getDirection().equals("out")) {
        String logMessage = String.format("Message ID: %s DLR Status: %s", message.getId(), incomingMessage.getDescription());
        System.out.println(logMessage);
        return "";
    }

    String owner = message.getOwner();
    List<String> numbers = new ArrayList<>(message.getTo());

    numbers.removeIf(number -> Objects.equals(number, owner));
    numbers.add(message.getFrom());

    MessageRequest messageRequest = new MessageRequest.Builder()
            .applicationId(MESSAGING_APPLICATION_ID)
            .from(owner)
            .to(numbers)
            .build();

    boolean isDog = message.getText().trim().toLowerCase().equals("dog");
    if (isDog) {
        List<String> media = Collections.singletonList("https://bw-demo.s3.amazonaws.com/dog.jpg");
        MessageRequest mmsMessage = messageRequest.toBuilder()
                .text("🐶")
                .media(media)
                .build();
        try {
            ApiResponse<BandwidthMessage> response = messagingController.createMessage(MESSAGING_ACCOUNT_ID, mmsMessage);
            System.out.println(String.format("Sent Message with ID: %s", response.getResult().getId()));
        } catch (ApiException | IOException e){
            System.out.println("Failed sending message");
            System.out.println(e);
        }
    }
    else {
        MessageRequest smsMessage = messageRequest.toBuilder()
                .text("👋 Hello from Bandwidth")
                .build();

        try {
            ApiResponse<BandwidthMessage> response = messagingController.createMessage(MESSAGING_ACCOUNT_ID, smsMessage);
            System.out.println(String.format("Sent Message with ID: %s", response.getResult().getId()));
        } catch (ApiException | IOException e){
            System.out.println("Failed sending message");
            System.out.println(e);
        }
    }
    res.status(200);

    return "";//Just needs an ACK
});
```

## Voice Handler

The voice API will send callbacks on inbound calls.

According to the spec, we will answer the call; quiz the caller on the some basic arithmetic.

### Build the BXML

Build the BXML and set the `gatherUrl` to `gatherReponse` so our next callback will come to that handler.

```java
SpeakSentence speakSentence = SpeakSentence.builder()
        .text("Let's play a game, what is 9 plus 2")
        .voice("kate")
        .build();

Gather gather = Gather.builder()
        .gatherUrl("gatherResponse")
        .maxDigits(2)
        .firstDigitTimeout(10.0)
        .build();

Response response = Response.builder().build()
        .add(speakSentence)
        .add(gather);
String bxml = response.toBXML();
```

### Respond to the callback with the XML

Bandwidth expects a BXML response to continue the call flow. It's helpful to set the contenttype and the status code explicitly.

```java
res.status(200);
res.type("application/xml");
return bxml;
```

## Gather Handler

The user button presses will come as a callback to the Server. We need to deserialize the callback and extract the digits.

### Declare entry path

Setup a Spark route to accept the gather request

```java
post("/Callbacks/Voice/gatherResponse", (req, res) -> {});
```

### De-serialize the callback

The Voice SDK does not _yet_ provide classes for the unique callback events. So we're using the generic `JSONObject`.

```java
String json = req.body();
Object obj = new JSONParser().parse(json);

JSONObject jsonObject = (JSONObject) obj;
```

### Extract and check the digits.

If the digits match the answer we'll play back a congratulations file. Otherwise we will play a sad trombone.

```java
final String SUCCESS_FILE = "https://bw-demo.s3.amazonaws.com/tada.wav";
final String FAIL_FILE = "https://bw-demo.s3.amazonaws.com/fail.wav";
String mediaUri = digits.equals("11") ? SUCCESS_FILE : FAIL_FILE;
```


### Build the BXML

We now have a complete picture of the response, We'll build the BXML based on the `mediaUri` for `<PlayAudio>` and then `<Hangup>` the call.

```java
PlayAudio playAudio = PlayAudio.builder()
      .audioUri(mediaUri)
      .build();
Hangup hangup = Hangup.builder().build();
Response response = Response.builder().build()
      .add(playAudio)
      .add(hangup);
```

### Send the BXML as a response to the callback

Same as before, we'll send the response to the callback.

```java
res.type("application/xml");
res.status(200);
String bxml = response.toBXML();
return bxml;
```

## Final Voice Handler (incoming call and BXML)

```java
post("/Callbacks/Voice/Inbound", (req, res) -> {

    SpeakSentence speakSentence = SpeakSentence.builder()
            .text("Let's play a game, what is 9 plus 2")
            .voice("kate")
            .build();

    Gather gather = Gather.builder()
            .gatherUrl("gatherResponse")
            .maxDigits(2)
            .firstDigitTimeout(10.0)
            .build();

    Response response = Response.builder().build()
            .add(speakSentence)
            .add(gather);

    String bxml = response.toBXML();
    res.status(200);
    res.type("application/xml");
    return bxml;
});

post("/Callbacks/Voice/gatherResponse", (req, res) -> {
    String json = req.body();
    Object obj = new JSONParser().parse(json);

    JSONObject jsonObject = (JSONObject) obj;

    String digits = (String) jsonObject.get("digits");

    final String SUCCESS_FILE = "https://bw-demo.s3.amazonaws.com/tada.wav";
    final String FAIL_FILE = "https://bw-demo.s3.amazonaws.com/fail.wav";
    String mediaUri = digits.equals("11") ? SUCCESS_FILE : FAIL_FILE;

    PlayAudio playAudio = PlayAudio.builder()
            .audioUri(mediaUri)
            .build();
    Hangup hangup = Hangup.builder().build();
    Response response = Response.builder().build()
            .add(playAudio)
            .add(hangup);

    res.type("application/xml");
    res.status(200);
    String bxml = response.toBXML();
    return bxml;

});
```

---

And that's it! you should now have a working autoresponding quiz giving Bandwidth Java Application
