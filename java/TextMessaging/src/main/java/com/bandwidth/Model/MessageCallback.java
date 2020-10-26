package com.bandwidth.Model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageCallback {

    private String type;
    private String time;
    private String description;
    private String to;
    private Message message;

    @Getter
    @Setter
    private class Message {
        private String id;
        private String time;
        private String to;
        private String from;
        private String text;
        private String applicationId;
        private String[] media;
        private String owner;
        private String direction;
        private int segmentCount;
    }
}
