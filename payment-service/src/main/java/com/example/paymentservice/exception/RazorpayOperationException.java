package com.example.paymentservice.exception;

public class RazorpayOperationException extends RuntimeException {

    public RazorpayOperationException(String message) {
        super(message);
    }

    public RazorpayOperationException(String message, Throwable cause) {
        super(message, cause);
    }

}
