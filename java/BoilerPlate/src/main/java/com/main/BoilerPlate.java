package com.main;

import static spark.Spark.*;


public class BoilerPlate {


    /**
     * Initialize the Bandwidth Client here
     */

    public static void main(String[] args) {


        get("/", (req, res) -> {

            return "Hello World";
        });


        post("/Create/Message", (req, res) -> {


            return "Message Created";
        });

        post("/Create/Call", (req, res) -> {


            return "Call Created";
        });

        post("/Callbacks/Messaging", (req, res) -> {


            return "";//Just needs an ACK
        });

        post("/Callbacks/Voice/Outbound", (req, res) -> {


            return "";//Just needs and ACK
        });

        post("/Callbacks/Voice/Inbound", (req, res) -> {


            //Handle and inbound call

            return "";//BXML
        });


    }
}
