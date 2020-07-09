package com.bandwidth.webrtc.examples.helloworld;

import com.bandwidth.BandwidthClient;
import com.bandwidth.Environment;
import com.bandwidth.exceptions.ApiException;
import com.bandwidth.http.response.ApiResponse;
import com.bandwidth.voice.controllers.APIController;
import com.bandwidth.voice.models.ApiCallResponse;
import com.bandwidth.voice.models.ApiCreateCallRequest;
import com.bandwidth.webrtc.examples.helloworld.config.AccountProperties;
import com.bandwidth.webrtc.examples.helloworld.config.VoiceProperties;
import com.bandwidth.webrtc.examples.helloworld.models.CreateParticipantResponse;
import com.bandwidth.webrtc.examples.helloworld.models.Participant;

import com.bandwidth.webrtc.examples.helloworld.models.Session;
import com.bandwidth.webrtc.examples.helloworld.models.Subscriptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Example controller for a basic WebRTC application.
 *
 * The general flow is that after starting this server you visit it in a browser (localhost:8080 by default).
 * At that point, assuming the server is publicly available (using https://ngrok.com/ for example), you can then
 * call in using your voice application number, or if you've set the required properties, you can call out to a phone.
 *
 * See /src/main/resources/application.properties to set these properties.
 */
@RestController
public class HelloWorldController {
    Logger logger = LoggerFactory.getLogger(HelloWorldController.class);

    // Properties
    private final String accountId;
    private final String voiceApplicationId;
    private final String voiceApplicationPhoneNumber;
    private final String voiceCallbackUrl;
    private final String outboundPhoneNumber;

    private final WebRtcClient webRtcClient;
    private final APIController voiceController;

    private String sessionId;
    private final Map<String, CreateParticipantResponse> calls = new HashMap<>();

    @Autowired
    public HelloWorldController(AccountProperties accountProperties, VoiceProperties voiceProperties, WebRtcClient webRtcClient) {
        accountId = accountProperties.getId();
        voiceApplicationId = voiceProperties.getApplicationId();
        voiceApplicationPhoneNumber = voiceProperties.getApplicationPhoneNumber();
        voiceCallbackUrl = voiceProperties.getCallbackUrl();
        outboundPhoneNumber = voiceProperties.getOutboundPhoneNumber();
        this.webRtcClient = webRtcClient;
        BandwidthClient bandwidthClient = new BandwidthClient.Builder()
                .voiceBasicAuthCredentials(accountProperties.getUsername(), accountProperties.getPassword())
                .environment(Environment.PRODUCTION)
                .build();
        voiceController = bandwidthClient.getVoiceClient().getAPIController();
    }

    /**
     * Called by the browser to create a participant and get the device token it will use to
     * authenticate with Bandwidth's WebRTC platform
     * @return an object containing the token, and phone numbers for inbound and outbound calling
     */
    @GetMapping("/connectionInfo")
    public ResponseEntity<Map<String, String>> getConnectionInfo() {
        CreateParticipantResponse response = createParticipant("hello-world-browser");
        return ResponseEntity.ok(Map.of(
                "token", response.getToken(),
                "voiceApplicationPhoneNumber", voiceApplicationPhoneNumber,
                "outboundPhoneNumber", outboundPhoneNumber
        ));
    }

    /**
     * Called by the browser to initiate a call to the outbound phone number
     * @return no content
     */
    @GetMapping("/callPhone")
    public ResponseEntity<Object> callPhone() {
        if (outboundPhoneNumber == null || outboundPhoneNumber.isBlank()) {
            logger.warn("No outbound phone number configured");
            return ResponseEntity.badRequest().body("No outbound phone number has been set");
        }

        // Create a new participant and initiate a call
        CreateParticipantResponse response = createParticipant("hello-world-browser");
        initiateCall(outboundPhoneNumber, response);
        return ResponseEntity.noContent().build();
    }

    /**
     * Called by Bandwidth's Voice API when we receive an incoming call
     * @param body call information
     * @return transfer BXML
     */
    @PostMapping("/incomingCall")
    public ResponseEntity<String> onIncomingCall(@RequestBody Map<String, String> body) {
        String callId = body.get("callId");
        logger.info("received incoming call {} from {}", callId, body.get("from"));
        CreateParticipantResponse response = createParticipant("hello-world-phone");
        calls.put(callId, response);

        // Generate transfer BXML from the device token and return that to the Voice API
        String transferBxml = webRtcClient.generateTransferBxml(response.getToken());
        logger.info("transferring call {} to session {} as participant {}", callId, sessionId, response.getParticipant().getId());
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_XML).body(transferBxml);
    }

    /**
     * Called by Bandwidth's Voice API when an outgoing call is answered
     * @param body call information
     * @return transfer BXML
     */
    @PostMapping("/callAnswered")
    public ResponseEntity<String> onCallAnswered(@RequestBody Map<String, String> body) {
        String callId = body.get("callId");
        logger.info("received answered callback for call {} to {}", callId, body.get("to"));

        // Retrieve the participant and token that we set for this call id in initiateCall below
        CreateParticipantResponse response = calls.get(callId);
        if (response == null) {
            logger.warn("no participant found for call {}", callId);
            return ResponseEntity.badRequest().build();
        }

        // Generate transfer BXML from the device token and return that to the Voice API
        String transferBxml = webRtcClient.generateTransferBxml(response.getToken());
        logger.info("transferring call {} to session {} as participant {}", callId, sessionId, response.getParticipant().getId());
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_XML).body(transferBxml);
    }

    /**
     * Called by Bandwidth's Voice API for call status updates
     * @param body call information
     * @return no content
     */
    @PostMapping("/callStatus")
    public ResponseEntity<Object> onCallStatus(@RequestBody Map<String, String> body) {
        // If the eventType is disconnect, perform a little cleanup
        if (body.get("eventType").equals("disconnect")) {
            String callId = body.get("callId");
            logger.info("received disconnect event for call {}", callId);

            // Retrieve the participant and token associated with this call id
            CreateParticipantResponse response = calls.get(callId);
            if (response != null) {
                String participantId = response.getParticipant().getId();
                logger.info("deleting participant {}", participantId);
                webRtcClient.deleteParticipant(participantId);
                calls.remove(callId);
            } else {
                logger.warn("no participant associated with event {}", body);
            }
        } else {
            logger.warn("received unexpected status update {}", body);
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * Returns the current session id if it exists and is valid, or creates a new session and returns that id
     * @return session id
     */
    private String getSessionId() {
        if (sessionId != null) {
            try {
                webRtcClient.getSession(sessionId);
                logger.info("using session {}", sessionId);
                return this.sessionId;
            } catch (RuntimeException e) {
                logger.info("session {} is invalid, creating a new session", sessionId);
                sessionId = null;
            }
        }

        Session session = webRtcClient.createSession("hello-world");
        sessionId = session.getId();
        logger.info("created new session {}", sessionId);
        return sessionId;
    }

    /**
     * Creates a new participant and adds them to the current session
     * @param tag string a participant can be tagged with
     * @return a response encapsulating the new participant and the device token they can connect with
     */
    private CreateParticipantResponse createParticipant(String tag) {
        CreateParticipantResponse response = webRtcClient.createParticipant(tag);
        Participant participant = response.getParticipant();
        logger.info("created new participant {}", participant.getId());

        String sessionId = getSessionId();

        webRtcClient.addParticipantToSession(sessionId, participant.getId(), new Subscriptions(sessionId, null));
        logger.info("added participant {} to session {}", participant.getId(), sessionId);
        return response;
    }

    /**
     * Initiate an outbound call
     * @param phoneNumber phone number
     * @param createParticipantResponse CreateParticipantResponse that wraps a participant and device token
     */
    private void initiateCall(String phoneNumber, CreateParticipantResponse createParticipantResponse) {
        // Create a new call request
        ApiCreateCallRequest callRequest = new ApiCreateCallRequest();
        callRequest.setApplicationId(voiceApplicationId);
        callRequest.setFrom(voiceApplicationPhoneNumber);
        callRequest.setTo(phoneNumber);
        callRequest.setAnswerUrl(voiceCallbackUrl + "/callAnswered");
        callRequest.setDisconnectUrl(voiceCallbackUrl + "/callStatus");

        try {
            // Create a new call with that request
            ApiResponse<ApiCallResponse> apiCallResponse = voiceController.createCall(accountId, callRequest);
            String callId = apiCallResponse.getResult().getCallId();

            // Set the call id to the create participant response so we can transfer them when they answer
            calls.put(callId, createParticipantResponse);
            logger.info("initiated call {} to {}...", callId, phoneNumber);
        } catch (IOException | ApiException e) {
            logger.error("error calling {}", phoneNumber, e);
        }
    }
}
