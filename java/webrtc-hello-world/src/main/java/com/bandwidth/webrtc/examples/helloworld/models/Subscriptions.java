package com.bandwidth.webrtc.examples.helloworld.models;

public class Subscriptions {
    private String sessionId;
    private ParticipantSubscription[] participants;

    public Subscriptions() {}

    public Subscriptions(String sessionId, ParticipantSubscription[] participants) {
        this.sessionId = sessionId;
        this.participants = participants;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public ParticipantSubscription[] getParticipants() {
        return participants;
    }

    public void setParticipants(ParticipantSubscription[] participants) {
        this.participants = participants;
    }
}
