package com.bandwidth;

import com.bandwidth.Model.MessageCallback;
import com.bandwidth.exceptions.ApiException;
import com.bandwidth.http.response.ApiResponse;
import com.bandwidth.messaging.models.BandwidthMessage;
import com.bandwidth.messaging.models.MessageRequest;
import com.bandwidth.messaging.controllers.APIController;
import com.bandwidth.BandwidthClient;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@SpringBootApplication
@RestController

public class Main {

    private String username = System.getenv("BANDWIDTH_USERNAME");
    private String password = System.getenv("BANDWISTH_PASSWORD");
    private String accountId = System.getenv("ACCOUNT_ID");
    private String applicationId = System.getenv("APPLICATION_ID");

    private BandwidthClient client = new BandwidthClient.Builder()
            .messagingBasicAuthCredentials(username, password)
            .environment(Environment.PRODUCTION)
            .build();

    private APIController controller = client.getMessagingClient().getAPIController();

    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
        System.out.println("Server is starting...");
    }

    @RequestMapping("/outBoundMessage")
    public String createMessage(MessageRequest messageRequest) {

        try {
            ApiResponse<BandwidthMessage> response = controller.createMessage(accountId, messageRequest);
        } catch (ApiException e) {
            System.out.println(e.getHttpContext().getResponse().getRawBody());
        } catch (IOException e) {
            System.out.println(e.getMessage());
        }

        return "success";
    }

    @RequestMapping("/messageCallback")
    public void messageCallback(MessageCallback callback) {
        if (callback.getType() == "message-received") {
            
        } else {
            System.out.println(callback.getDescription());
        }
    }


}
