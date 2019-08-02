package com.bandwidth.main;

import com.bandwidth.controller.MessageController;
import com.bandwidth.controller.VoiceController;
import com.bandwidth.enviroment.Properties;

import static spark.Spark.*;

public class Main {


    public static void main(String[] args){

        port(8080);

        Properties.configure("resources/local.props");

        //MessageController.uploadMedia("C:/Users/jchavez/Downloads/smartest.jpg", "image/jpeg", "smartest.jpg");

        //MessageController.listMedia();


        MessageController.listenReplyToMessage();

        VoiceController.letsPlayAGame();
        VoiceController.callMeMessage();
        VoiceController.gatherAndTransfer();



    }

    public static void out(String str){
        System.out.println(str);
    }
}
