package com.bandwidth.controller;

import com.bandwidth.voice.controllers.APIController;
import com.bandwidth.sdk.voice.models.verbs.*;
import com.bandwidth.voice.APIHelper;
import com.bandwidth.voice.BandwidthV2VoiceClient;
import com.bandwidth.voice.Configuration;
import com.bandwidth.voice.Environments;
import com.bandwidth.voice.exceptions.APIException;
import com.bandwidth.voice.models.ApiCreateCallRequest;
import com.bandwidth.voice.models.BandwidthCallbackMessageVoice;

import java.io.IOException;

import static spark.Spark.post;

import static com.bandwidth.enviroment.Properties.getProperty;

/**
 * Controller to handle the Bandwidth voice interactions
 */
public class VoiceController {


    private static final Configuration voiceConfig = new Configuration().newBuilder()
            .basicAuthPassword( getProperty("voice.password") )
            .basicAuthUserName( getProperty("voice.username") )
            .environment(Environments.PRODUCTION)
            .build();

    private static final String applicationId = getProperty("voice.application.id");

    private static final String accountId = getProperty("voice.account.id");

    private static final APIController voiceClient = new BandwidthV2VoiceClient(voiceConfig).getClient();

    private static final String HOST = getProperty("host");

    /**
     * Reply to an incoming call with a sentence and a gather
     */
    public static void letsPlayAGame(){

        post("/incoming/call", (request, response ) -> {

            BandwidthCallbackMessageVoice callbackMessageVoice = APIHelper.deserialize(request.body(), BandwidthCallbackMessageVoice.class);

            String eventType = callbackMessageVoice.getEventType();

            Response bxmlResponse = Response.builder().build();

            if("initiate".equalsIgnoreCase(eventType)) {

                SpeakSentence speakSentence = SpeakSentence.builder().text("lets play a game").build();

                SpeakSentence speakSentence1 = SpeakSentence.builder().text("What is the sum of 2 plus 3.  Enter the sum followed by the pound symbol.").build();
                Gather gather = Gather.builder().terminatingDigits("#").audioProducer(speakSentence1).gatherUrl(HOST + "/incoming/call").build();

                bxmlResponse.add(speakSentence).add(gather);

            } else if("gather".equalsIgnoreCase(eventType)){

                String digits = callbackMessageVoice.getDigits();

                PlayAudio playAudio;

                if("5".equalsIgnoreCase(digits)){
                    //Correct
                    playAudio = PlayAudio.builder().audioUri("https://www23.online-convert.com/dl/web2/download-file/58b6885c-7ecc-4a55-b7ed-8a849e96965e/Smartest%20man%20alive.wav").build();
                } else {
                    //Wrong
                    playAudio = PlayAudio.builder().audioUri("https://www8.online-convert.com/dl/web2/download-file/1eb741cf-9c40-4166-8a63-40cf70c06348/Never%20Gonna%20Give%20You%20Up%20Original.wav").build();
                }
                bxmlResponse.add(playAudio);
            }

            return bxmlResponse.toXml();

        });
    }

    /**
     * Initiates an outbound call from the Bandwidth network to the to caller.
     * @param to
     */
    public static void makeOutboundCall(String to){

        ApiCreateCallRequest callRequest = new ApiCreateCallRequest();

        callRequest.setApplicationId(applicationId);
        callRequest.setTo(to);
        callRequest.setAnswerUrl(HOST + "/call/me/message");
        callRequest.setFrom("+19192227323");

        try {
            voiceClient.createCall(accountId, callRequest);
        } catch (APIException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }


    }

    /**
     * Sends a Gather BXML to the http requester
     */
    public static void callMeMessage(){

        post("call/me/message", ((request, response) -> {

            SpeakSentence speakSentence = SpeakSentence.builder().text("Hey you asked to call, who should I call for you.  Enter their phone number followed by the pound symbol").build();
            Gather gather = Gather.builder().audioProducer(speakSentence).gatherUrl(HOST + "/forward/number").build();

            return Response.builder().build().add(gather).toXml();

        }));

    }

    /**
     * Recieves the gathered digits and transfers the call to the number provided
     */
    public static void gatherAndForward(){

        post("/forward/number", ((request, response) -> {

            BandwidthCallbackMessageVoice callbackMessageVoice = APIHelper.deserialize(request.body(), BandwidthCallbackMessageVoice.class);

            Response res = Response.builder().build();

            if("gather".equalsIgnoreCase(callbackMessageVoice.getEventType())){

                String forwardTo = callbackMessageVoice.getDigits();

                forwardTo = "+1" + forwardTo.replaceAll("#", "");

                PhoneNumber phoneNumber = PhoneNumber.builder().phoneNumber(forwardTo).build();
                Transfer transfer = Transfer.builder().phoneNumbers(phoneNumber).transferCallerId("+19192227323").build();

                res.add(transfer).toXml();
            }

            System.out.println(res.toXml());
            return res.toXml();
        }));

    }

}
