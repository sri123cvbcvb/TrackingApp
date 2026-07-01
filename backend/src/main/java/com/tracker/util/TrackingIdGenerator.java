package com.tracker.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Generates short, URL-safe, alphanumeric tracking IDs.
 * Uses a SecureRandom source for unpredictability.
 * Example output: "F3X9K2BQ"
 */
@Component
public class TrackingIdGenerator {

    private static final String CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int ID_LENGTH = 8;
    private final SecureRandom random = new SecureRandom();

    /**
     * Generates a random 8-character alphanumeric tracking ID.
     * Characters are chosen from an unambiguous set (no I/O/0/1 to avoid confusion).
     */
    public String generate() {
        StringBuilder sb = new StringBuilder(ID_LENGTH);
        for (int i = 0; i < ID_LENGTH; i++) {
            sb.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        }
        return sb.toString();
    }
}
