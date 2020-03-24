package com.main;

import com.bandwidth.ApiHelper;
import com.bandwidth.BandwidthClient;
import com.bandwidth.Configuration;
import com.bandwidth.Environment;
import com.bandwidth.exceptions.ApiException;
import com.bandwidth.http.response.ApiResponse;
import com.bandwidth.messaging.models.BandwidthCallbackMessage;
import com.bandwidth.messaging.models.BandwidthMessage;
import com.bandwidth.messaging.models.MessageRequest;
import com.bandwidth.voice.bxml.verbs.*;
import com.bandwidth.voice.models.ApiCallResponse;
import com.bandwidth.voice.models.ApiCreateCallRequest;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static spark.Spark.*;


public class WebinarExample {


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

    public static void main(String[] args) {

        get("/", (req, res) -> {

            return "Hello World";
        });

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

    }
}
