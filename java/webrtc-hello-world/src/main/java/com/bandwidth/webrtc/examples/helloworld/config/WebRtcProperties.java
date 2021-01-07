package com.bandwidth.webrtc.examples.helloworld.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.ConstructorBinding;

@ConstructorBinding
@ConfigurationProperties("webrtc")
public class WebRtcProperties {
    private final String baseUrl;


    public WebRtcProperties(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getBaseUrl() {
        return baseUrl;
    }
}
