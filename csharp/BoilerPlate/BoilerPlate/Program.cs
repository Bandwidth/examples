using Bandwidth.Standard;
using Bandwidth.Standard.Messaging.Models;
using Newtonsoft.Json;
using System;
using System.Net;
using System.Text;
using System.Threading;

using VoiceController = Bandwidth.Standard.Voice.Controllers.APIController;
using MessagingController = Bandwidth.Standard.Messaging.Controllers.APIController;

using static Eagle.Server;
using Bandwidth.Standard.Voice.Models;
using Bandwidth.Standard.Voice.Bxml;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BoilerPlate
{
    class Program
    {


        private static string voiceUsername = Environment.GetEnvironmentVariable("VOICE_API_USERNAME");
        private static string voicePassword = Environment.GetEnvironmentVariable("VOICE_API_PASSWORD");
        private static string voiceAccountId = Environment.GetEnvironmentVariable("VOICE_ACCOUNT_ID");
        private static string voicApplicationId = Environment.GetEnvironmentVariable("VOICE_APPLICATION_ID");
        private static string voiceServer = Environment.GetEnvironmentVariable("VOICE_SERVER");


        private static string msgUser = Environment.GetEnvironmentVariable("MSG_API_USERNAME");
        private static string msgPassword = Environment.GetEnvironmentVariable("MSG_API_PASSWORD");
        private static string msgApplicationId = Environment.GetEnvironmentVariable("MSG_APPLICATION_ID");
        private static string msgAccountId = Environment.GetEnvironmentVariable("MSG_ACCOUNT_ID");



        private static Configuration config = new Configuration().ToBuilder()
                .WithVoiceBasicAuthPassword(voicePassword)
                .WithVoiceBasicAuthUserName(voiceUsername)
                .WithMessagingBasicAuthPassword(msgPassword)
                .WithMessagingBasicAuthUserName(msgUser)
                .WithEnvironment(Configuration.Environments.PRODUCTION)
                .Build();


        private static BandwidthClient clientInit = new BandwidthClient(config);

        private static VoiceController voiceController = clientInit.Voice.Client;
        private static MessagingController msgController = clientInit.Messaging.Client;

        static void Main(string[] args)
        {

            useHttp(true);
            port("8080");

            startServerInstance();

            get("/", (body, reponse) => {

                return "Hello World" ;

            });

            post("/Create/Call", (body, reponse) => {

                ApiCreateCallRequest apiCreateCallRequest = new ApiCreateCallRequest();

                apiCreateCallRequest.To = body.To;
                apiCreateCallRequest.From = body.From;
                apiCreateCallRequest.AnswerUrl = body.AnswerUrl;
                apiCreateCallRequest.ApplicationId = voicApplicationId;
                try
                {
                    voiceController.CreateCall(voiceAccountId, apiCreateCallRequest);
                }
                catch (APIException ex)
                {
                    throw new HttpStatusAwareException(ex.ResponseCode, ex.Message);
                }
                

                return "Creates a call";

            });

            post("/Create/Message", (body, reponse) => {

                MessageRequest messageReqeust = new MessageRequest();

                Newtonsoft.Json.Linq.JArray arr = body.To;

                messageReqeust.To = arr.ToObject<List<string>>(); ;
                messageReqeust.From = body.From;
                messageReqeust.Text = body.Text;
                messageReqeust.ApplicationId = msgApplicationId;
                try
                {
                    msgController.CreateMessage(msgUser, messageReqeust);
                } catch (APIException ex)
                {
                    throw new HttpStatusAwareException(ex.ResponseCode, ex.Message);
                }

                return "";

            });

            post("/Callbacks/Messaging", (body, reponse) => {

                return "Handle message callback";

            });

            post("/Callbacks/Voice/Outbound", (body, reponse) => {

                return "Handle outboud voice callback";
            });

            post("/Callbacks/Voice/Inbound", (body, reponse) => {

                return "Handle inbound voice callback";
            });

            post("/Bxml", (body, reponse) => {

                Response response = new Response();
                SpeakSentence speakSentence = new SpeakSentence
                {
                    Sentence = "Hello World!"
                };
                response.Add(speakSentence);

                return response.ToBXML();
            });

            post("/status", (body, reponse) => {

                string strBody = body;
                return strBody;
            });

            post("/stop", (body, reponse) => {

                Task.Run(() => {
                    Thread.Sleep(2000);
                    stop();
                });
                
                return "Server Shutting Down";
            });


            WaitOnServerToStop();

        }

    }
}
