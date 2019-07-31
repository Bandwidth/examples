using System.Collections.Generic;
using System.IO;
using Helpers;
using BandwidthMsgSDK.Standard;
using BandwidthMsgSDK.Standard.Controllers;
using BandwidthMsgSDK.Standard.Exceptions;
using BandwidthMsgSDK.Standard.Models;
using BandwidthMsgSDK.Standard.Utilities;

using static Eagle.Server;

using static System.Console;

using static Enviroment.Properties;

namespace Controllers {
	public class MessageController {

		static readonly Configuration msgConfig = new Configuration.Builder()
            .WithBasicAuthPassword( getProperty("message.api.seceret") )
            .WithBasicAuthUserName( getProperty("message.api.token") )
            .WithEnvironment(Configuration.Environments.PRODUCTION)
            .Build();

		private static APIController msgClient =  new BandwidthMsgSDKClient(msgConfig).Client;

    	private  static string msgUserId = getProperty("message.account.id");
		private static readonly string applicationId =  getProperty("message.application.id");

		public static void uploadMedia(string fileURL, string contentType, string mediaId) {

       		if(!File.Exists(fileURL)) return;

			FileInfo fileInfo = new FileInfo(fileURL);

        	try {
            	msgClient.UploadMedia(msgUserId, mediaId, fileInfo.Length, File.ReadAllBytes(fileURL) ,contentType, "no-cache" );
        	} catch (APIException e) {
            	WriteLine(e.StackTrace);
        	} catch (IOException e) {
            	WriteLine(e.StackTrace);
        	}
    	}

    	public static void downloadMedia(){

    	}

		public static List<Media> listMedia() {

			List<Media> list = null;
			try {
				list = msgClient.ListMedia(msgUserId,"");
			} catch (APIException e) {
            	WriteLine(e.StackTrace);
        	} catch (IOException e) {
            	WriteLine(e.StackTrace);
        	}

			return list;

		}

		public static void listenReplyToMessage() {

			post("/msg/incoming", (request, response) => {

				string json = ControllerHelpers.getBody(request);

				BandwidthCallbackMessage[] callbackMessages = APIHelper.JsonDeserialize<BandwidthCallbackMessage[]>(json);

				if(callbackMessages == null || callbackMessages.Length == 0  ){
					//Incorrect format return
					return "";
				}

				if("message-delivered".Equals(callbackMessages[0].Type) || "message-failed".Equals(callbackMessages[0].Type)){
					//Message delivery notice or message filed notice.  Return 200 to Bandwidth.
					WriteLine(callbackMessages[0].Type);
					return "";
				}

				// Incoming message to application # callbackMessages[0].getType() equals "message-received"

				//number to reply too
				string from = callbackMessages[0].Message.From;

				//Set incoming number to be "To" number
				List<string> sendToNums = new List<string>();
				sendToNums.Add(from);

				MessageRequest msgRequest = new MessageRequest();
				msgRequest.ApplicationId = applicationId;
				msgRequest.From = "19192347322";//number tied to application
				msgRequest.To = sendToNums;

				string incomingText = callbackMessages[0].Message.Text;

				List<string> incomingMedia = callbackMessages[0].Message.Media;

				if("call me".Equals(incomingText.Trim().ToLower())){
					VoiceController.makeOutboudCall(from);
					return "";
				} else if( incomingMedia == null || incomingMedia.Count == 0 ) {
					msgRequest.Text = "The quick brown fox jumps over a lazy dog.";
				} else {

					//Download the incoming media to temp area on disk

					//Upload the media from the disk to bandwidth with diffrent name

					//Send the new media back to the texter

					msgRequest.Media = incomingMedia;
				}

				msgClient.CreateMessage(msgUserId, msgRequest);

				return "";
			});
		}




	}
}