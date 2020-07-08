package com.bandwidth.webrtc.examples.helloworld.models;

public class Participant {

    private String id;
    private String callbackUrl;
    private String[] publishPermissions;
    private String[] sessions;
    private Subscriptions subscriptions;
    private String tag;

    public Participant() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCallbackUrl() {
        return callbackUrl;
    }

    public void setCallbackUrl(String callbackUrl) {
        this.callbackUrl = callbackUrl;
    }

    public String[] getPublishPermissions() {
        return publishPermissions;
    }

    public void setPublishPermissions(String[] publishPermissions) {
        this.publishPermissions = publishPermissions;
    }

    public String[] getSessions() {
        return sessions;
    }

    public void setSessions(String[] sessions) {
        this.sessions = sessions;
    }

    public Subscriptions getSubscriptions() {
        return subscriptions;
    }

    public void setSubscriptions(Subscriptions subscriptions) {
        this.subscriptions = subscriptions;
    }

    public String getTag() {
        return tag;
    }

    public void setTag(String tag) {
        this.tag = tag;
    }
}
