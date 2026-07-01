package com.tracker.exception;

/**
 * Thrown when a tracking session with the given trackingId does not exist.
 */
public class SessionNotFoundException extends RuntimeException {

    public SessionNotFoundException(String trackingId) {
        super("Tracking session not found: " + trackingId);
    }
}
