package com.bandwidth.webrtc.examples.helloworld;

import com.bandwidth.webrtc.examples.helloworld.config.AccountProperties;
import com.bandwidth.webrtc.examples.helloworld.config.WebRtcProperties;
import com.bandwidth.webrtc.examples.helloworld.models.CreateParticipantResponse;
import com.bandwidth.webrtc.examples.helloworld.models.Session;
import com.bandwidth.webrtc.examples.helloworld.models.Subscriptions;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.Objects;

/**
 * A temporary WebRTC client/SDK implementation that only contains methods needed for this example app
 *
 * This should soon be superseded by a controller included in the bandwidth-sdk
 */
@Component
public class WebRtcClient {
    private static final MediaType JSON = MediaType.parse("application/json");

    private final String callControlUrl;
    private final String credentials;
    private final String sipxNumber;

    private final OkHttpClient httpClient = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    public WebRtcClient(AccountProperties accountProperties, WebRtcProperties webRtcProperties) {
        this.callControlUrl = webRtcProperties.getBaseUrl() + "/accounts/" + accountProperties.getId();
        this.credentials = Credentials.basic(accountProperties.getUsername(), accountProperties.getPassword());
        this.sipxNumber = webRtcProperties.getSipxNumber();
    }

    public Session createSession(String tag) {
        try {
            var body = Map.of("tag", tag);
            String bodyString = mapper.writer().writeValueAsString(body);
            Request request = new Request.Builder()
                    .url(this.callControlUrl + "/sessions")
                    .addHeader("Authorization", credentials)
                    .post(RequestBody.create(JSON, bodyString))
                    .build();
            Response response = httpClient.newCall(request).execute();
            if (!response.isSuccessful()) {
                throw new RuntimeException(response.toString());
            }
            String json = Objects.requireNonNull(response.body()).string();
            return mapper.readValue(json, Session.class);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public Session getSession(String sessionId) {
        try {
            Request request = new Request.Builder()
                    .url(callControlUrl + "/sessions/" + sessionId)
                    .addHeader("Authorization", credentials)
                    .get()
                    .build();
            Response response = httpClient.newCall(request).execute();
            if (!response.isSuccessful()) {
                throw new RuntimeException(response.toString());
            }
            String json = Objects.requireNonNull(response.body()).string();
            return mapper.readValue(json, Session.class);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public CreateParticipantResponse createParticipant(String tag) {
        try {
            Map<String, Object> body = Map.of(
                    "callbackUrl", "https://example.com",
                    "publishPermissions", new String[]{"AUDIO"},
                    "tag", tag
            );
            String bodyString = mapper.writer().writeValueAsString(body);
            Request request = new Request.Builder()
                    .url(callControlUrl + "/participants")
                    .addHeader("Authorization", credentials)
                    .post(RequestBody.create(JSON, bodyString))
                    .build();
            Response response = httpClient.newCall(request).execute();
            if (!response.isSuccessful()) {
                throw new RuntimeException(response.toString());
            }
            String json = Objects.requireNonNull(response.body()).string();
            return mapper.readValue(json, CreateParticipantResponse.class);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public void deleteParticipant(String participantId) {
        try {
            Request request = new Request.Builder()
                    .url(callControlUrl + "/participants/" + participantId)
                    .addHeader("Authorization", credentials)
                    .delete()
                    .build();
            Response response = httpClient.newCall(request).execute();
            if (!response.isSuccessful()) {
                throw new RuntimeException(response.toString());
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public void addParticipantToSession(String sessionId, String participantId, Subscriptions subscriptions) {
        try {
            String bodyString = mapper.writer().writeValueAsString(subscriptions);
            Request request = new Request.Builder()
                    .url(callControlUrl + "/sessions/" + sessionId + "/participants/" + participantId)
                    .addHeader("Authorization", credentials)
                    .put(RequestBody.create(JSON, bodyString))
                    .build();
            Response response = httpClient.newCall(request).execute();
            if (!response.isSuccessful()) {
                throw new RuntimeException(response.toString());
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public String generateTransferBxml(String deviceToken) {
        try {
            String encodedPayload = deviceToken.split("\\.")[1];
            String decodedPayload = new String(Base64.getDecoder().decode(encodedPayload));
            Map<String, Object> payload = mapper.readValue(decodedPayload, new TypeReference<>() {});
            String tid = (String) payload.get("tid");
            return "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>" +
                    "<Response>" +
                    "<Transfer transferCallerId=\"" + tid + "\">" +
                    "<PhoneNumber>" + sipxNumber + "</PhoneNumber>" +
                    "</Transfer>" +
                    "</Response>";
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
