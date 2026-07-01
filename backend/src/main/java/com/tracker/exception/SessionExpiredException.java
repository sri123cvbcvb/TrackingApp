package com.tracker.exception;

/**
 * Thrown when a location update is received for an EXPIRED tracking session.
 */
public class SessionExpiredException extends RuntimeException {

    public SessionExpiredException(String trackingId) {
        super("Tracking session has expired: " + trackingId);
    }
}
