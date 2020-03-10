package com.main.model;

import javax.xml.bind.annotation.*;

@XmlRootElement(name = "Notification")
@XmlAccessorType(XmlAccessType.FIELD)
public class Notification {

    @XmlElement(name = "Status")
    private String status;
    @XmlElement(name = "SubscriptionId")
    private boolean subscriptionId;
    @XmlElement(name = "Message")
    private String message;
    @XmlElement(name = "OrderId")
    private boolean orderId;
    @XmlElement(name = "OrderType")
    private String orderType;
    @XmlElement(name = "CustomerOrderId")
    private boolean customerOrderId;
    @XmlElementWrapper(name = "CompletedTelephoneNumbers")
    @XmlElement(name = "TelephoneNumber")
    private String[] numbers;


    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(boolean subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isOrderId() {
        return orderId;
    }

    public void setOrderId(boolean orderId) {
        this.orderId = orderId;
    }

    public String getOrderType() {
        return orderType;
    }

    public void setOrderType(String orderType) {
        this.orderType = orderType;
    }

    public boolean isCustomerOrderId() {
        return customerOrderId;
    }

    public void setCustomerOrderId(boolean customerOrderId) {
        this.customerOrderId = customerOrderId;
    }

    public String[] getNumbers() {
        return numbers;
    }

    public void setNumbers(String[] numbers) {
        this.numbers = numbers;
    }
}
