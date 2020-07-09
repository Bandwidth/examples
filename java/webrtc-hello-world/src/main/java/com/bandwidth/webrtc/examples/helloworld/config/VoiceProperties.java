package com.bandwidth.webrtc.examples.helloworld.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.ConstructorBinding;

@ConstructorBinding
@ConfigurationProperties("voice")
public class VoiceProperties {
    private final String applicationId;
    private final String applicationPhoneNumber;
    private final String callbackUrl;
    private final String outboundPhoneNumber;


    public VoiceProperties(String applicationId, String applicationPhoneNumber, String callbackUrl, String outboundPhoneNumber) {
        this.applicationId = applicationId;
        this.applicationPhoneNumber = applicationPhoneNumber;
        this.callbackUrl = callbackUrl;
        this.outboundPhoneNumber = outboundPhoneNumber;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public String getApplicationPhoneNumber() {
        return applicationPhoneNumber;
    }

    public String getCallbackUrl() {
        return callbackUrl;
    }

    public String getOutboundPhoneNumber() {
        return outboundPhoneNumber;
    }
}
