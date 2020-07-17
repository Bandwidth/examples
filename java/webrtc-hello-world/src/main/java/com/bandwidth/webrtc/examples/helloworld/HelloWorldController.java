package com.bandwidth.webrtc.examples.helloworld;

import com.bandwidth.BandwidthClient;
import com.bandwidth.Environment;
import com.bandwidth.exceptions.ApiException;
import com.bandwidth.http.response.ApiResponse;
import com.bandwidth.voice.models.ApiCallResponse;
import com.bandwidth.voice.models.ApiCreateCallRequest;
import com.bandwidth.webrtc.examples.helloworld.config.AccountProperties;
import com.bandwidth.webrtc.examples.helloworld.config.VoiceProperties;

import com.bandwidth.webrtc.examples.helloworld.config.WebRtcProperties;
import com.bandwidth.webrtc.models.AccountsParticipantsResponse;
import com.bandwidth.webrtc.models.Participant;
import com.bandwidth.webrtc.models.PublishPermissionEnum;
import com.bandwidth.webrtc.models.Session;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Base64;
import java.util.Collections;
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
    private final String sipxNumber;

    private final com.bandwidth.voice.controllers.APIController voiceController;
    private final com.bandwidth.webrtc.controllers.APIController webrtcController;

    private String sessionId;
    private final Map<String, AccountsParticipantsResponse> calls = new HashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    public HelloWorldController(AccountProperties accountProperties, VoiceProperties voiceProperties, WebRtcProperties webRtcProperties) {
        accountId = accountProperties.getId();
        voiceApplicationId = voiceProperties.getApplicationId();
        voiceApplicationPhoneNumber = voiceProperties.getApplicationPhoneNumber();
        voiceCallbackUrl = voiceProperties.getCallbackUrl();
        outboundPhoneNumber = voiceProperties.getOutboundPhoneNumber();
        sipxNumber = webRtcProperties.getSipxNumber();

        logger.info("accountId: {}", accountId);
        logger.info("voiceApplicationId: {}", voiceApplicationId);
        logger.info("voiceApplicationPhoneNumber: {}", voiceApplicationPhoneNumber);
        logger.info("voiceCallbackUrl: {}", voiceCallbackUrl);
        logger.info("outboundPhoneNumber: {}", outboundPhoneNumber);

        BandwidthClient bandwidthClient = new BandwidthClient.Builder()
                .voiceBasicAuthCredentials(accountProperties.getUsername(), accountProperties.getPassword())
                .webRtcBasicAuthCredentials(accountProperties.getUsername(), accountProperties.getPassword())
                .environment(Environment.PRODUCTION)
                .build();
        voiceController = bandwidthClient.getVoiceClient().getAPIController();
        webrtcController = bandwidthClient.getWebRtcClient().getAPIController();
    }

    /**
     * Called by the browser to create a participant and get the device token it will use to
     * authenticate with Bandwidth's WebRTC platform
     * @return an object containing the token, and phone numbers for inbound and outbound calling
     */
    @GetMapping("/connectionInfo")
    public ResponseEntity<Map<String, String>> getConnectionInfo() {
        AccountsParticipantsResponse response = createParticipant("hello-world-browser");
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
        AccountsParticipantsResponse response = createParticipant("hello-world-browser");
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
        AccountsParticipantsResponse response = createParticipant("hello-world-phone");
        calls.put(callId, response);

        // Generate transfer BXML from the device token and return that to the Voice API
        String transferBxml = generateTransferBxml(response.getToken());
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
        AccountsParticipantsResponse response = calls.get(callId);
        if (response == null) {
            logger.warn("no participant found for call {}", callId);
            return ResponseEntity.badRequest().build();
        }

        // Generate transfer BXML from the device token and return that to the Voice API
        String transferBxml = generateTransferBxml(response.getToken());
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
            AccountsParticipantsResponse response = calls.get(callId);
            if (response != null) {
                try {
                    String participantId = response.getParticipant().getId();
                    logger.info("deleting participant {}", participantId);
                    webrtcController.deleteParticipant(accountId, participantId);
                    calls.remove(callId);
                } catch (IOException | ApiException e) {
                    throw new RuntimeException(e);
                }
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
                webrtcController.getSession(accountId, sessionId);
                logger.info("using session {}", sessionId);
                return this.sessionId;
            } catch (IOException | ApiException e) {
                logger.info("session {} is invalid, creating a new session", sessionId);
                sessionId = null;
            }
        }

        try {
            Session session = new Session();
            session.setTag("hello-world");

            ApiResponse<Session> response = webrtcController.createSession(accountId, session);
            session = response.getResult();

            sessionId = session.getId();
            logger.info("created new session {}", sessionId);
            return sessionId;
        } catch (IOException | ApiException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Creates a new participant and adds them to the current session
     * @param tag string a participant can be tagged with
     * @return a response encapsulating the new participant and the device token they can connect with
     */
    private AccountsParticipantsResponse createParticipant(String tag) {
        try {
            Participant participant = new Participant();
            participant.setCallbackUrl("https://example.com");
            participant.setPublishPermissions(Collections.singletonList(PublishPermissionEnum.AUDIO));
            participant.setTag(tag);

            ApiResponse<AccountsParticipantsResponse> response = webrtcController.createParticipant(accountId, participant);
            AccountsParticipantsResponse result = response.getResult();
            participant = result.getParticipant();
            logger.info("created new participant {}", participant.getId());

            String sessionId = getSessionId();
            webrtcController.addParticipantToSession(accountId, sessionId, participant.getId(), new com.bandwidth.webrtc.models.Subscriptions(sessionId, null));
            logger.info("added participant {} to session {}", participant.getId(), sessionId);
            return result;
        } catch (IOException | ApiException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Initiate an outbound call
     * @param phoneNumber phone number
     * @param createParticipantResponse AccountsParticipantsResponse that wraps a participant and device token
     */
    private void initiateCall(String phoneNumber, AccountsParticipantsResponse createParticipantResponse) {
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

    /**
     * Generate transfer BXML from a WebRTC device token (JWT)
     * We're working on moving this into the SDK
     * @param deviceToken token
     * @return transfer BXML
     */
    private String generateTransferBxml(String deviceToken) {
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
