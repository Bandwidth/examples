using System.Collections.Generic;
using System.IO;
using Helpers;
using BandwidthVoiceSDK.Standard;
using BandwidthVoiceSDK.Standard.Controllers;
using BandwidthVoiceSDK.Standard.Exceptions;
using BandwidthVoiceSDK.Standard.Models;
using BandwidthVoiceSDK.Standard.Utilities;

using BandwidthBXML;

using static Eagle.Server;

using static System.Console;

using static Enviroment.Properties;

namespace Controllers {

	/**
	* Controller to handle the Bandwidth voice interactions
	*/
	public class VoiceController{

		private static readonly Configuration voiceConfig2 = null;

		private static readonly Configuration voiceConfig = new Configuration.Builder()
			.WithBasicAuthPassword( getProperty("voice.password"))
			.WithBasicAuthUserName( getProperty("voice.username"))
			.WithEnvironment(Configuration.Environments.PRODUCTION)
			.Build();

    private static readonly string applicationId =  getProperty("voice.application.id");

    private static readonly string accountId =  getProperty("voice.account.id");

    private static readonly APIController voiceClient = new BandwidthVoiceSDKClient(voiceConfig).Client;

	private static readonly string host = getProperty("host");

	/**
     * Reply to an incoming call with a sentence and a gather
     */
    public static void letsPlayAGame(){

        post("/incoming/call", (request, response ) => {

			string json = ControllerHelpers.getBody(request);
            BandwidthCallbackMessageVoice callbackMessageVoice = APIHelper.JsonDeserialize<BandwidthCallbackMessageVoice>(json);

            string eventType = callbackMessageVoice.EventType;

            Response bxmlResponse = new Response();

            if("initiate".Equals(eventType)) {

                SpeakSentence speakSentence = new SpeakSentence();
				speakSentence.Sentence = "lets play a game";

                SpeakSentence speakSentence1 = new SpeakSentence();
				speakSentence1.Sentence	= "What is the sum of 2 plus 3.  Enter the sum followed by the pound symbol.";

                Gather gather = new Gather();
				gather.TerminatingDigits = "#";
				gather.SpeakSentence = speakSentence1;
				gather.GatherUrl = host + "/incoming/call";

			

                bxmlResponse.Add(speakSentence);
				bxmlResponse.Add(gather);

            } else if("gather".Equals(eventType)){

                string digits = callbackMessageVoice.Digits;

                PlayAudio playAudio;

                if("5".Equals(digits)){
                    //Correct
                    playAudio = new PlayAudio();
					playAudio.Url = "https://www23.online-convert.com/dl/web2/download-file/58b6885c-7ecc-4a55-b7ed-8a849e96965e/Smartest%20man%20alive.wav";
                } else {
                    //Wrong
                    playAudio = new PlayAudio();
					playAudio.Url =  "https://www8.online-convert.com/dl/web2/download-file/1eb741cf-9c40-4166-8a63-40cf70c06348/Never%20Gonna%20Give%20You%20Up%20Original.wav";
                }
                bxmlResponse.Add(playAudio);
            }

            return bxmlResponse.ToXml();

        });
    }
    
	/**
     * Initiates an outbound call from the Bandwidth network to the to caller.
     * @param to
     */
	public static void makeOutboudCall(string to){

        ApiCreateCallRequest callRequest = new ApiCreateCallRequest();

        callRequest.ApplicationId = applicationId;
        callRequest.To=to;
        callRequest.AnswerUrl= host + "/call/me/message";
        callRequest.From="+19192227323";

        try {
            voiceClient.CreateCall(accountId, callRequest);
        } catch (APIException e) {
           WriteLine( e.Message );
        } catch (IOException e) {
            WriteLine( e.Message );
        }


    }

    /**
     * Sends a Gather BXML to the http requester
     */
    public static void callMeMessage(){

        post("/call/me/message", ((request, response) => {

            SpeakSentence speakSentence = new SpeakSentence();
            speakSentence.Sentence = "Hey you asked to call, who should I call for you.  Enter their phone number followed by the pound symbol";
			
			Gather gather = new Gather();
			gather.SpeakSentence = speakSentence;
			gather.GatherUrl = host + "/forward/number";

            Response res =  new Response();
			res.Add(gather);

			return res.ToXml();

        }));

    }

    /**
     * Recieves the gathered digits and transfers the call to the number provided
     */
    public static void gatherAndForward(){

        post("/forward/number", ((request, response) => {

			string json = ControllerHelpers.getBody(request);
            BandwidthCallbackMessageVoice callbackMessageVoice = APIHelper.JsonDeserialize<BandwidthCallbackMessageVoice>(json);

            Response res =  new Response();

            if("gather".Equals(callbackMessageVoice.EventType)){

                string forwardTo = callbackMessageVoice.Digits;

                forwardTo = "+1" + forwardTo.Replace("#", "");

                PhoneNumber phoneNumber =new PhoneNumber();
				phoneNumber.Number = forwardTo;
				PhoneNumber[] phoneNumbers = {phoneNumber};

                Transfer transfer = new Transfer();
				transfer.PhoneNumbers = phoneNumbers;
				transfer.TransferCallerId = "+19192227323";

                res.Add(transfer);
            }
            return res.ToXml();
        }));

    }




	}


}