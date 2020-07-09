package com.bandwidth.webrtc.examples.helloworld.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.ConstructorBinding;

@ConstructorBinding
@ConfigurationProperties("webrtc")
public class WebRtcProperties {
    private final String baseUrl;
    private final String sipxNumber;


    public WebRtcProperties(String baseUrl, String sipxNumber) {
        this.baseUrl = baseUrl;
        this.sipxNumber = sipxNumber;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public String getSipxNumber() {
        return sipxNumber;
    }
}
