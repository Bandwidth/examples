<div align="center">

# Bandwidth C# (dotnet core) Webinar App

![BW_all](../../.readme_images/BW_all.png)

</div>

A small sample app that covers basic use cases with Bandwidth's Voice and Messaging APIs

## Pre-Reqs

You will need to set up Bandwidth Applications and have phone numbers associated with these application, and point the callback URL on these applications to the messaging and voice endpoints on the server running this app. `ngrok` is highly recommended for local prototyping.

## Installation

Clone the repo and run `dotnet restore` to get started

## Usage

The following environmental variables need to be set

| Variable                     | Description                                         |
|:-----------------------------|:----------------------------------------------------|
| `BANDWIDTH_ACCOUNT_ID`       | Your Bandwidth Messaging account ID                 |
| `BANDWIDTH_API_USER`         | Your Bandwidth API username                         |
| `BANDWIDTH_API_PASSWORD`     | Your Bandwidth API password                         |
| `BANDWIDTH_MESSAGING_TOKEN`  | Your Bandwidth Messaging API token                  |
| `BANDWIDTH_MESSAGING_SECRET` | Your Bandwidth Messaging API secret                 |
| `MESSAGING_APPLICATION_ID`   | Your Bandwidth Messaging application ID             |
| `VOICE_APPLICATION_ID`       | Your Bandwidth Voice application ID                 |
| `BASE_URL`                   | The base url of the server running this application |

## Callback URLs For Bandwidth Applications

| Callback Type          | URL           |
|:-----------------------|:--------------|
| Messaging Callback     | <url>/Message |
| Inbound Voice Callback | <url>/Voice   |

## Run The Server
Run the following command to start the server

```
dotnet restore
dotnet run
```

You are now ready to text your Bandwidth phone number that is associated with the application

## What You Can Do

* Text your phone number `dog` and you will recieve a picture of a dog sent back
* Text your phone number any phrase other than `dog` and you will receive a response with the current date-time
* Call your phone number and you will be asked to play a game

---

# Tutorial
## Assumptions

* Have Bandwidth Account
* Have dotnet Installed (along with NPM)
* Have [ngrok](https://ngrok.com) installed

## Code along

The demo app starts from an empty web project.

```
dotnet new web -o WebinarExample
cd WebinarExample
dotnet add package Bandwidth.Sdk
dotnet add package Newtonsoft.Json
dotnet restore
dotnet run
```

### Update Startup.cs to use endpoint routing

```csharp
namespace WebinarExample
{
    public class Startup
    {
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            //Update this
            services.AddControllers();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseRouting();
            // Update this
            app.UseEndpoints(endpoints =>
            {
              endpoints.MapControllers();
            });
        }
    }
}
```

### Create Controllers

* Create new folder `mkdir Controllers`
* Create new Bandwidth Controller `touch ./Controllers/BandwidthController.cs`
* Setup Route for messaging: `${ngrokUrl}/bandwidth/messaging`
* Setup Route for voice: `${ngrokUrl}/bandwidth/voice`

#### Empty Bandwidth Controller

```csharp
namespace WebinarExample.Controllers
{
  [ApiController]
  [Route("bandwidth/[controller]")]
  public class MessagingController : ControllerBase
  {}

  [ApiController]
  [Route("bandwidth/[controller]")]
  public class VoiceController : ControllerBase
  {}
}
```

### Create MessagingCallback handler

* For this guide, we're only actually hitting the Bandwidth API on inbound messages
  * We'll go ahead and declare our envVars here.
* Within the `MessagingController` class add our callback handler

```csharp
private static string bandwidthAccountId = System.Environment.GetEnvironmentVariable("BANDWIDTH_ACCOUNT_ID");
private static string bandwidthAPIUser = System.Environment.GetEnvironmentVariable("BANDWIDTH_API_USER");
private static string bandwidthAPIPassowrd = System.Environment.GetEnvironmentVariable("BANDWIDTH_API_PASSWORD");
private static string msgApiToken = System.Environment.GetEnvironmentVariable("BANDWIDTH_MESSAGING_TOKEN");
private static string msgApiSecret = System.Environment.GetEnvironmentVariable("BANDWIDTH_MESSAGING_SECRET");
private static string msgApplicationId = System.Environment.GetEnvironmentVariable("MESSAGING_APPLICATION_ID");

// POST bandwidth/messageCallback
[HttpPost]
[Consumes("application/json")]
public async Task<string> MessageCallback()
{

  return "";
}
```

#### Parse the callback from Bandwidth

* Currently need to deserialize using the `ApiHelper` provided by Bandwidth
* We'll create a few variables to track the message and help access values

```csharp
string json;
using (var reader = new StreamReader(Request.Body))
{
  json = await reader.ReadToEndAsync();
}

BandwidthCallbackMessage[] callbackMessages = ApiHelper.JsonDeserialize<BandwidthCallbackMessage[]>(json);
BandwidthCallbackMessage callbackMessage = callbackMessages[0];
BandwidthMessage message = callbackMessage.Message;
```

#### Check direction

* If the direction of the `BandwidthMessage message` is "out" we know it is a DLR
* Log it and move on

```csharp
if (message.Direction.ToLower().Trim().Equals("out"))
{
  string logMessage = $"Message ID: {message.Id} DLR Status: {callbackMessage.Description}";
  Console.WriteLine(logMessage);
  return "";
}
```

#### Build the response 'To' array

* Bandwidth support group mms (where multiple phone numbers are in a group thread)
* We should respond to the group and not just the individual
* Done so in a way to support both group & single conversations

```csharp
string owner = message.Owner;
List<string> numbers = new List<string>(message.To);
numbers.Remove(owner);
numbers.Add(message.MFrom);
```

#### Build the message request

* Depending on the results of the inbound text we'll send a different message
* However, most of the request is the same (to, from, applicationId)

```csharp
MessageRequest messageRequest = new MessageRequest();
messageRequest.ApplicationId = msgApplicationId;
messageRequest.To = numbers;
messageRequest.MFrom = owner;
```

#### Check if dog

* If the inbound message text (trimmed and to lower case) is "Dog" we'll send something different

```csharp
bool isDog = message.Text.ToLower().Trim().Equals("dog");
if (isDog)
{
  List<string> media = new List<string>() { "https://bw-demo.s3.amazonaws.com/dog.jpg" };
  messageRequest.Text = "🐶";
  messageRequest.Media = media;
}
else
{
  messageRequest.Text = "👋 Hello From Bandwidth!";
}
```

#### Build the client and send the message

* Build the Bandwidth Client
* Once the client is initialized, grab the messaging controller
* Send the message
* This is an example **that does not handle errors!!**

```csharp
BandwidthClient client = new BandwidthClient.Builder()
  .Environment(Bandwidth.Standard.Environment.Production)
  .VoiceBasicAuthCredentials(bandwidthAPIUser, bandwidthAPIPassowrd)
  .MessagingBasicAuthCredentials(msgApiToken, msgApiSecret)
  .Build();

Bandwidth.Standard.Messaging.Controllers.APIController msgController = client.Messaging.APIController;
Bandwidth.Standard.Http.Response.ApiResponse<BandwidthMessage> response = await msgController.CreateMessageAsync(bandwidthAccountId, messageRequest);

Console.WriteLine($"Sent message with ID: {response.Data.Id}");
```

### All together messaging controller looks like:

```csharp
[ApiController]
[Route("bandwidth/[controller]")]
public class MessagingController : ControllerBase
{
  private static string bandwidthAccountId = System.Environment.GetEnvironmentVariable("BANDWIDTH_ACCOUNT_ID");
  private static string bandwidthAPIUser = System.Environment.GetEnvironmentVariable("BANDWIDTH_API_USER");
  private static string bandwidthAPIPassowrd = System.Environment.GetEnvironmentVariable("BANDWIDTH_API_PASSWORD");
  private static string msgApiToken = System.Environment.GetEnvironmentVariable("BANDWIDTH_MESSAGING_TOKEN");
  private static string msgApiSecret = System.Environment.GetEnvironmentVariable("BANDWIDTH_MESSAGING_SECRET");
  private static string msgApplicationId = System.Environment.GetEnvironmentVariable("MESSAGING_APPLICATION_ID");

  // POST bandwidth/messageCallback
  [HttpPost]
  [Consumes("application/json")]
  public async Task<string> MessageCallback()
  {
    string json;
    using (var reader = new StreamReader(Request.Body))
    {
      json = await reader.ReadToEndAsync();
    }

    BandwidthCallbackMessage[] callbackMessages = ApiHelper.JsonDeserialize<BandwidthCallbackMessage[]>(json);
    BandwidthCallbackMessage callbackMessage = callbackMessages[0];
    BandwidthMessage message = callbackMessage.Message;

    if (message.Direction.ToLower().Trim().Equals("out"))
    {
      string logMessage = $"Message ID: {message.Id} DLR Status: {callbackMessage.Description}";
      Console.WriteLine(logMessage);
      return "";
    }

    string owner = message.Owner;
    List<string> numbers = new List<string>(message.To);
    numbers.Remove(owner);
    numbers.Add(message.MFrom);

    MessageRequest messageRequest = new MessageRequest();
    messageRequest.ApplicationId = msgApplicationId;
    messageRequest.To = numbers;
    messageRequest.MFrom = owner;

    bool isDog = message.Text.ToLower().Trim().Equals("dog");
    if (isDog)
    {
      List<string> media = new List<string>() { "https://bw-demo.s3.amazonaws.com/dog.jpg" };
      messageRequest.Text = "🐶";
      messageRequest.Media = media;
    }
    else
    {
      messageRequest.Text = "👋 Hello From Bandwidth!";
    }

    BandwidthClient client = new BandwidthClient.Builder()
      .Environment(Bandwidth.Standard.Environment.Production)
      .VoiceBasicAuthCredentials(bandwidthAPIUser, bandwidthAPIPassowrd)
      .MessagingBasicAuthCredentials(msgApiToken, msgApiSecret)
      .Build();

    Bandwidth.Standard.Messaging.Controllers.APIController msgController = client.Messaging.APIController;
    Bandwidth.Standard.Http.Response.ApiResponse<BandwidthMessage> response = await msgController.CreateMessageAsync(bandwidthAccountId, messageRequest);

    Console.WriteLine($"Sent message with ID: {response.Data.Id}");

    return "";
  }
}
```

### Create VoiceCallback handler

* The voice API sends JSON and expects BXML in response
* Within the `VoiceController` class* As we're going to respond in the same way for each and every call, we only need to build the BXML and don't really care about the callback values.
* We'll be building a SpeakSentence and embedding that within the Gather request
* Gather request = "Please input digits"
* Gather needs a place to send it's callback

```csharp
[HttpPost]
[Consumes("application/json")]
public string VoiceCallback()
{
  SpeakSentence speakSentence = new SpeakSentence();
  speakSentence.Voice = "kate";
  speakSentence.Sentence = "Let's play a game, what is 9 plus 2";

  Gather gather = new Gather();
  gather.SpeakSentence = speakSentence;
  gather.MaxDigits = 2;
  gather.GatherUrl = "gather";
  gather.FirstDigitTimeout = 10;

  Response response = new Response();
  response.Add(gather);

  string bxml = response.ToBXML();

  return bxml;
}
```

### Create the GatherController

* The `GatherController` will accept a JSON callback with the results of the user input

```csharp
[ApiController]
[Route("bandwidth/[controller]")]
public class GatherController : ControllerBase
{

  [HttpPost]
  [Consumes("application/json")]
  public async Task<string> GatherCallback()
  {

    return "";
  }
}
```

#### Within the `GatherCallback` method Parse the response

* Read in as JSON (voice models coming soon)
* Deserialize to `dynamic` for accessing data

```csharp
string json;
using (var reader = new StreamReader(Request.Body))
{
  json = await reader.ReadToEndAsync();
}

dynamic gatherEvent = JsonConvert.DeserializeObject<dynamic>(json);
```

#### Check digits, and set audio file

* If the digits match the correct math, play success, otherwise play sad trombone

```csharp
string digits = gatherEvent.digits;
const string SUCCESS_FILE = "https://bw-demo.s3.amazonaws.com/tada.wav";
const string FAIL_FILE = "https://bw-demo.s3.amazonaws.com/fail.wav";

string media = digits.Equals("11") ? SUCCESS_FILE : FAIL_FILE;
```

#### Build the BXML

* PlayAudio using the media based on the digits
* add a Hangup Verb for good record keeping

```csharp
PlayAudio playAudio = new PlayAudio();
playAudio.Url = media;
Hangup hangup = new Hangup();

Response response = new Response();
response.Add(playAudio);
response.Add(hangup);

string bxml = response.ToBXML();
return bxml;
```

### All together the Voice Controllers look like:

```csharp
[ApiController]
[Route("bandwidth/[controller]")]
public class VoiceController : ControllerBase
{

  [HttpPost]
  [Consumes("application/json")]
  public string VoiceCallback()
  {
    SpeakSentence speakSentence = new SpeakSentence();
    speakSentence.Voice = "kate";
    speakSentence.Sentence = "Let's play a game, what is 9 plus 2";

    Gather gather = new Gather();
    gather.SpeakSentence = speakSentence;
    gather.MaxDigits = 2;
    gather.GatherUrl = "gather";
    gather.FirstDigitTimeout = 10;

    Response response = new Response();
    response.Add(gather);

    string bxml = response.ToBXML();

    return bxml;
  }
}

[ApiController]
[Route("bandwidth/[controller]")]
public class GatherController : ControllerBase
{

  [HttpPost]
  [Consumes("application/json")]
  public async Task<string> GatherCallback()
  {

    string json;
    using (var reader = new StreamReader(Request.Body))
    {
      json = await reader.ReadToEndAsync();
    }

    dynamic gatherEvent = JsonConvert.DeserializeObject<dynamic>(json);
    string digits = gatherEvent.digits;
    const string SUCCESS_FILE = "https://bw-demo.s3.amazonaws.com/tada.wav";
    const string FAIL_FILE = "https://bw-demo.s3.amazonaws.com/fail.wav";

    string media = digits.Equals("11") ? SUCCESS_FILE : FAIL_FILE;
    PlayAudio playAudio = new PlayAudio();
    playAudio.Url = media;
    Hangup hangup = new Hangup();

    Response response = new Response();
    response.Add(playAudio);
    response.Add(hangup);

    string bxml = response.ToBXML();
    return bxml;
  }
}
```

---
