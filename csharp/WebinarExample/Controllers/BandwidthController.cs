using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.IO;
using Bandwidth;
using Bandwidth.Standard.Utilities;
using Bandwidth.Standard.Messaging.Models;


namespace WebinarExample.Controllers
{
  [ApiController]
  [Route("bandwidth/[controller]")]
  public class MessagingController : ControllerBase
  {
    private static string bandwidthAPIUser = Environment.GetEnvironmentVariable("BANDWIDTH_API_USER");
    private static string bandwidthAPIPassowrd = Environment.GetEnvironmentVariable("BANDWIDTH_API_PASSWORD");
    private static string voiceApplicationId = Environment.GetEnvironmentVariable("VOICE_APPLICATION_ID");
    private static string voiceServer = Environment.GetEnvironmentVariable("SERVER_PUBLIC_URL");


    private static string msgApiToken = Environment.GetEnvironmentVariable("BANDWIDTH_MESSAGING_TOKEN");
    private static string msgApiSecret = Environment.GetEnvironmentVariable("BANDWIDTH_MESSAGING_SECRET");
    private static string msgApplicationId = Environment.GetEnvironmentVariable("MSG_APPLICATION_ID");
    private static string msgAccountId = Environment.GetEnvironmentVariable("BANDWIDTH_ACCOUNT_ID");


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
      Console.WriteLine(json);
      BandwidthCallbackMessage[] callbackMessages = ApiHelper.JsonDeserialize<BandwidthCallbackMessage[]>(json);
      Console.WriteLine(callbackMessages[0].Message.MFrom);
      return "Hello";
    }
  }
}