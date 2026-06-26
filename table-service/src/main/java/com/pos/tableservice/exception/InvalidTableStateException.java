package com.pos.tableservice.exception;

public class InvalidTableStateException extends RuntimeException {
    public InvalidTableStateException(String message) {
        super(message);
    }
}
