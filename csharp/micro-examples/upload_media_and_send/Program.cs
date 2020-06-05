using System;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using Bandwidth.Standard;
using Bandwidth.Standard.Messaging.Controllers;
using Environment = System.Environment;
using Bandwidth.Standard.Messaging.Models;
using Bandwidth.Standard.Http.Client;
using Bandwidth.Standard.Http.Response;
using Bandwidth.Standard.Messaging.Exceptions;

namespace mediaUploadAndSend
{
  class Program
  {

    private static readonly string BANDWIDTH_PHONE_NUMBER = "";
    private static readonly string TO_PHONE_NUMBER = "";
    private static readonly string ACCOUNT_ID = Environment.GetEnvironmentVariable("BANDWIDTH_ACCOUNT_ID");
    private static readonly string USERNAME = Environment.GetEnvironmentVariable("BANDWIDTH_API_USER");
    private static readonly string PASSWORD = Environment.GetEnvironmentVariable("BANDWIDTH_API_PASSWORD");
    private static readonly string API_TOKEN = System.Environment.GetEnvironmentVariable("BANDWIDTH_MESSAGING_TOKEN");
    private static readonly string API_SECRET = System.Environment.GetEnvironmentVariable("BANDWIDTH_MESSAGING_SECRET");
    private static readonly string APP_ID = System.Environment.GetEnvironmentVariable("BANDWIDTH_MESSAGING_APPLICATION_ID");
    public static async Task Main(string[] args)
    {
      BandwidthClient client = new BandwidthClient.Builder()
        .Environment(Bandwidth.Standard.Environment.Production)
        .MessagingBasicAuthCredentials(API_TOKEN, API_SECRET)
        .Build();
      APIController msgController = client.Messaging.APIController;

      string dog1 = "dog.jpg";
      string dog2 = "critter.jpg";
      string dogUrl1 = $"https://messaging.bandwidth.com/api/v2/users/{ACCOUNT_ID}/media/{dog1}";
      string dogUrl2 = $"https://messaging.bandwidth.com/api/v2/users/{ACCOUNT_ID}/media/{dog2}";
      using (FileStream fs = File.OpenRead(dog1))
      {
        FileStreamInfo fsi = new FileStreamInfo(fs, dog1, "image/jpg");
        try
        {
          await msgController.UploadMediaAsync(ACCOUNT_ID, dog1, fs.Length, fsi);
        }
        catch (MessagingException e)
        {
          string body = ((Bandwidth.Standard.Http.Response.HttpStringResponse)e.HttpContext.Response).Body;
          Console.WriteLine($"Failed Uploading Media: {e.Message}\n{body}");
          System.Environment.Exit(-1);
        }
        catch (Exception e)
        {
          Console.WriteLine("Something unknown went wrong");
          Console.WriteLine(e.Message);
          System.Environment.Exit(-1);
        }
      }
      using (FileStream fs = File.OpenRead(dog2))
      {
        FileStreamInfo fsi = new FileStreamInfo(fs, dog2, "image/jpg");
        try
        {
          await msgController.UploadMediaAsync(ACCOUNT_ID, dog2, fs.Length, fsi);
        }
        catch (MessagingException e)
        {
          string body = ((Bandwidth.Standard.Http.Response.HttpStringResponse)e.HttpContext.Response).Body;
          Console.WriteLine($"Failed Uploading Media: {e.Message}\n{body}");
          System.Environment.Exit(-1);
        }
        catch (Exception e)
        {
          Console.WriteLine("Something unknown went wrong");
          Console.WriteLine(e.Message);
          System.Environment.Exit(-1);
        }
      }
      MessageRequest myMessage = new MessageRequest();
      myMessage.ApplicationId = APP_ID;
      myMessage.To = new List<string> { TO_PHONE_NUMBER };
      myMessage.From = BANDWIDTH_PHONE_NUMBER;
      myMessage.Text = "👋 🐶";
      myMessage.Media = new List<string> { dogUrl1, dogUrl2 };
      try
      {
        ApiResponse<BandwidthMessage> apiResponse = (await msgController.CreateMessageAsync(ACCOUNT_ID, myMessage));
        Console.WriteLine($"Message ID: {apiResponse.Data.Id}");
      }
      catch (MessagingException e)
      {
        string body = ((Bandwidth.Standard.Http.Response.HttpStringResponse)e.HttpContext.Response).Body;
        Console.WriteLine($"Failed Sending Message: {e.Message}\n{body}");
        System.Environment.Exit(-1);
      }
      catch (Exception e)
      {
        Console.WriteLine("Something unknown went wrong");
        Console.WriteLine(e.Message);
        System.Environment.Exit(-1);
      }
    }
  }
}
