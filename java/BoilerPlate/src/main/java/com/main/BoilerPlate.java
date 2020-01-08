package com.main;

import com.bandwidth.BandwidthClient;
import com.bandwidth.Configuration;
import com.bandwidth.Environment;
import com.bandwidth.http.response.ApiResponse;
import com.bandwidth.messaging.models.BandwidthMessage;
import com.bandwidth.messaging.models.MessageRequest;
import com.bandwidth.voice.bxml.verbs.Response;
import com.bandwidth.voice.models.ApiCallResponse;
import com.bandwidth.voice.models.ApiCreateCallRequest;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

import java.util.Arrays;
import java.util.List;

import static spark.Spark.*;


public class BoilerPlate {


    private static String MESSAGING_ACCOUNT_ID = System.getenv("MESSAGING_ACCOUNT_ID");
    private static String MESSAGING_APPLICATION_ID = System.getenv("MESSAGING_APPLICATION_ID");

    private static String VOICE_ACCOUNT_ID = System.getenv("VOICE_ACCOUNT_ID");
    private static String VOICE_APPLICATION_ID = System.getenv("VOICE_APPLICATION_ID");

    private static BandwidthClient client = new BandwidthClient.Builder()
            .messagingBasicAuthCredentials(System.getenv("MESSAGING_API_TOKEN"), System.getenv("MESSAGING_API_SECRET"))
            .voiceBasicAuthCredentials(System.getenv("VOICE_API_USERNAME"), System.getenv("VOICE_API_PASSWORD"))
            .environment(Environment.PRODUCTION)
            .build();

    //Fully qualified name to remove confilicts
    private static com.bandwidth.messaging.controllers.APIController messagingController = client.getMessagingClient().getAPIController();
    private static com.bandwidth.voice.controllers.APIController voiceController = client.getVoiceClient().getAPIController();

    public static void main(String[] args) {




        get("/", (req, res) -> {

            return "Hello World";
        });


        post("/Create/Message", (req, res) -> {

            String json = req.body();
            Object obj = new JSONParser().parse(json);

            JSONObject jsonObject = (JSONObject) obj;

            JSONArray jsonArray = (JSONArray) jsonObject.get("To");

            List<String> to = Arrays.asList( (String[]) jsonArray.toArray() ) ;
            String from = (String) jsonObject.get("From");
            String text = (String) jsonObject.get("Text");

            MessageRequest messageRequest = new MessageRequest.Builder()
                    .applicationId(MESSAGING_APPLICATION_ID)
                    .from(from)
                    .to(to)
                    .text(text)
                    .build();

            ApiResponse<BandwidthMessage> response = messagingController.createMessage(MESSAGING_ACCOUNT_ID, messageRequest );

            return "Message Id:  " + response.getResult().getId();
        });

        post("/Create/Call", (req, res) -> {

            String json = req.body();
            Object obj = new JSONParser().parse(json);

            JSONObject jsonObject = (JSONObject) obj;

            String to = (String) jsonObject.get("To");
            String from = (String) jsonObject.get("From");
            String answerUrl = (String) jsonObject.get("AnswerUrl");

            ApiCreateCallRequest createCallRequest = new ApiCreateCallRequest.Builder()
                    .applicationId(VOICE_APPLICATION_ID)
                    .to(to)
                    .from(from)
                    .build();

            ApiResponse<ApiCallResponse> response = voiceController.createCall(VOICE_ACCOUNT_ID, createCallRequest);


            return "Call Id: " + response.getResult().getCallId();
        });

        post("/Callbacks/Messaging", (req, res) -> {


            return "";//Just needs an ACK
        });

        post("/Callbacks/Voice/Outbound", (req, res) -> {


            return "";//Just needs and ACK
        });

        post("/Callbacks/Voice/Inbound", (req, res) -> {


            return "Handle voice inbound call";//
        });

        post("/Bxml", (req, res) -> {

            Response response = Response.builder().build();

            //Add more verbs to response
            //response.add( speakSentence );

            return response.toBXML();
        });


    }
}
