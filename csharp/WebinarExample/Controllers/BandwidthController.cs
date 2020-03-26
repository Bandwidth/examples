using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.IO;
using Bandwidth;
using Bandwidth.Standard.Utilities;
using Bandwidth.Standard.Messaging.Models;
using Bandwidth.Standard.Messaging;
using Bandwidth.Standard;
using Bandwidth.Standard.Voice.Bxml;
using Newtonsoft.Json;

namespace WebinarExample.Controllers
{
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
}