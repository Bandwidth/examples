package com.bandwidth.webrtc.examples.helloworld.models;

public class CreateParticipantResponse {
    private Participant participant;
    private String token;

    public CreateParticipantResponse() {}

    public Participant getParticipant() {
        return participant;
    }

    public void setParticipant(Participant participant) {
        this.participant = participant;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
