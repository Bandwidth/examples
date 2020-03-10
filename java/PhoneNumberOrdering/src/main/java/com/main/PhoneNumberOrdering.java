package com.main;

import com.bandwidth.iris.sdk.IrisClient;
import com.bandwidth.iris.sdk.model.*;
import com.bandwidth.iris.sdk.utils.XmlUtils;
import com.main.model.Notification;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

import java.util.*;

import static spark.Spark.*;


public class PhoneNumberOrdering {


    private static String accountId = System.getenv("IRIS_ACCOUNT_ID");
    private static String siteId = System.getenv("SITE_ID");

    private static String username = System.getenv("IRIS_USERNAME");
    private static String password = System.getenv("IRIS_PASSWORD");

    private static IrisClient client = new IrisClient(accountId, username, password);

    private static Map<String, JSONObject> storage = new HashMap<>();


    public static void main(String[] args) {

        port(4567);

        // Ping page to check that the server is up
        get("/", (req, res) -> {

            return "Hello World";
        });


        // orders subscription callback endpoint
        post("/subscriptions/orders", (req, res) -> {

            Notification notification = XmlUtils.fromXml(req.body(), Notification.class);

            System.out.println(notification.getMessage());

            return "";
        });

        // Disconnects subscription callback endpoint
        post("/subscriptions/disconnects", (req, res) -> {

            Notification notification = XmlUtils.fromXml(req.body(), Notification.class);

            System.out.println(notification.getMessage());

            if(notification.getNumbers() != null ){
                for(String number : notification.getNumbers()){
                    storage.remove(number);
                }
            }

            return "";
        });


        // GET endpoint for available Phone Numbers
        get("/availablePhoneNumbers", (req, res) -> {

            Map<String, Object> query = new HashMap<>();

            for(String key: req.queryMap().toMap().keySet()){
                query.put(key, req.queryMap().toMap().get(key)[0]);
            }


            try {
                List numbers = AvailableNumbers.search(client, query);
                String retStr = "[\n";

                for(Object str : numbers) {
                    retStr = retStr.concat(str.toString() +",\n");
                }
                retStr = retStr.concat("]");

                return retStr;
            } catch(Exception e){
                return e.getMessage();
            }


        });

        get("/phoneNumbers", (req, res) -> {

            String ret = "[";

            for(JSONObject obj : storage.values()){
                ret = ret.concat(obj.toString() + ",");
            }

            if(ret.endsWith(",")){
                ret = ret.substring(0, ret.length() - 2);
            }

            ret = ret.concat("]");

            return ret;
        });

        post("/phoneNumbers", (req, res) -> {

            JSONParser jp = new JSONParser();
            JSONObject obj = (JSONObject)jp.parse(req.body());

            String number = obj.get("phoneNumber").toString();

            Order order = new Order();
            order.setCustomerOrderId("customerOrderId");
            order.setName("Name");

            order.setSiteId(siteId);

            ExistingTelephoneNumberOrderType existingTelephoneNumberOrderType = new ExistingTelephoneNumberOrderType();
            existingTelephoneNumberOrderType.setTelephoneNumberList(new ArrayList<String>(){ {add(number); } });
            order.setExistingTelephoneNumberOrderType(existingTelephoneNumberOrderType);

            try {
                OrderResponse response = Order.create(client, order);

                obj.put("bandwidthOrderId", response.getOrder().getid());

                storage.put(obj.get("phoneNumber").toString(), obj);

                return obj.toJSONString();//Just needs and ACK
            } catch (Exception e ){
                return e.getMessage();
            }
        });

        delete("/phoneNumbers/:phoneNumber", (req, res) -> {

            String number = req.params("phoneNumber");


            // Check if the number has been ordered before.  This is just in memory.
            if( !storage.containsKey(number) ){
                res.status(404);
                return "Not found";
            }

            DisconnectTelephoneNumberOrder disconnectTelephoneNumberOrder = new DisconnectTelephoneNumberOrder();
            disconnectTelephoneNumberOrder.setCustomerOrderid("customerOrderId");
            disconnectTelephoneNumberOrder.setName("name");

            DisconnectTelephoneNumberOrderType disconnectTelephoneNumberOrderType = new DisconnectTelephoneNumberOrderType();
            disconnectTelephoneNumberOrderType.setTelephoneNumberList(new ArrayList<String>(){ {add(number); } });

            disconnectTelephoneNumberOrder.setDisconnectTelephoneNumberOrderType(disconnectTelephoneNumberOrderType);

            try {
                DisconnectTelephoneNumberOrder.create(client, disconnectTelephoneNumberOrder);
            } catch(Exception e) {
                return e.getMessage();
            }

            return "Recieved";//
        });


    }
}
