package com.bandwidth.controller;

import com.bandwidth.messaging.APIHelper;
import com.bandwidth.messaging.BandwidthV2MessagingClient;
import com.bandwidth.messaging.Configuration;
import com.bandwidth.messaging.Environments;
import com.bandwidth.messaging.controllers.APIController;
import com.bandwidth.messaging.exceptions.APIException;
import com.bandwidth.messaging.models.BandwidthCallbackMessage;
import com.bandwidth.messaging.models.Media;
import com.bandwidth.messaging.models.MessageRequest;

import java.io.*;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

import static spark.Spark.post;

import static com.bandwidth.enviroment.Properties.getProperty;

public class MessageController {


    private static Configuration msgConfig = new Configuration().newBuilder()
            .basicAuthPassword( getProperty("message.api.secret") )
            .basicAuthUserName( getProperty("message.api.token") )
            .environment(Environments.PRODUCTION)
            .build();

    private static APIController msgClient =  new BandwidthV2MessagingClient(msgConfig).getClient();

    private  static String msgUserId =  getProperty("message.account.id") ;

    private static String applicationId = getProperty("message.application.id");



    public static void uploadMedia(String fileURL, String contentType, String mediaId) {

       File file = new File(fileURL);

        try {
            msgClient.uploadMedia(msgUserId, mediaId, file.length(), Files.readAllBytes(file.toPath()) ,contentType, "no-cache" );
        } catch (APIException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void downloadMedia(){

    }

    public static List<Media> listMedia() {

        List<Media> list = null;
        try {
            list = msgClient.listMedia(msgUserId,"");
        } catch (APIException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }

       return list;

    }

    public static void listenReplyToMessage() {

        post("/msg/incoming", (request, response) -> {

            String json = request.body();

            BandwidthCallbackMessage[] callbackMessages = APIHelper.deserialize(json, BandwidthCallbackMessage[].class);

            if(callbackMessages == null || callbackMessages.length == 0  ){
                //Incorrect format return
                return "";
            }

            if("message-delivered".equalsIgnoreCase(callbackMessages[0].getType()) || "message-failed".equalsIgnoreCase(callbackMessages[0].getType())){
                //Message delivery notice or message filed notice.  Return 200 to Bandwidth.
                System.out.println(callbackMessages[0].getType());
                return "";
            }

            // Incoming message to application # callbackMessages[0].getType() equals "message-received"

            //number to reply too
            String from = callbackMessages[0].getMessage().getFrom();

            //Set incoming number to be "To" number
            List<String> sendToNums = new ArrayList<>();
            sendToNums.add(from);

            MessageRequest msgRequest = new MessageRequest();
            msgRequest.setApplicationId(applicationId);
            msgRequest.setFrom("19192347322");//number tied to application
            msgRequest.setTo(sendToNums);

            String incomingText = callbackMessages[0].getMessage().getText();

            List<String> incomingMedia = callbackMessages[0].getMessage().getMedia();

            if("call me".equalsIgnoreCase(incomingText.trim())){
                VoiceController.makeOutboudCall(from);
                return "";
            } else if( incomingMedia == null || incomingMedia.isEmpty() ) {
                msgRequest.setText("The quick brown fox jumps over a lazy dog.");
            } else {

                //Download the incoming media to temp area on disk

                //Upload the media from the disk to bandwidth with diffrent name

                //Send the new media back to the texter

                msgRequest.setMedia(incomingMedia);
            }

            msgClient.createMessage(msgUserId, msgRequest);

            return "";
        });
    }


}
