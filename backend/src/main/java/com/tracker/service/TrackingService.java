package com.tracker.service;

import com.tracker.dto.CreateSessionResponse;
import com.tracker.dto.SessionStatusResponse;
import com.tracker.entity.LiveLocation;
import com.tracker.entity.SessionStatus;
import com.tracker.entity.TrackingSession;
import com.tracker.exception.SessionNotFoundException;
import com.tracker.repository.LiveLocationRepository;
import com.tracker.repository.TrackingSessionRepository;
import com.tracker.util.TrackingIdGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Business logic for creating, retrieving, and expiring tracking sessions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TrackingService {

    private final TrackingSessionRepository sessionRepository;
    private final LiveLocationRepository liveLocationRepository;
    private final TrackingIdGenerator idGenerator;

    @Value("${tracker.app.base-url:http://localhost:3000}")
    private String appBaseUrl;

    /**
     * Creates a new ACTIVE tracking session with a unique trackingId.
     * Retries ID generation on the (extremely rare) collision.
     */
    @Transactional
    public CreateSessionResponse createSession() {
        String trackingId = generateUniqueId();
        TrackingSession session = TrackingSession.builder()
                .trackingId(trackingId)
                .status(SessionStatus.ACTIVE)
                .build();
        session = sessionRepository.save(session);

        log.info("Created new tracking session: {}", trackingId);

        return CreateSessionResponse.builder()
                .trackingId(trackingId)
                .status(SessionStatus.ACTIVE)
                .shareUrl(appBaseUrl + "/share/" + trackingId)
                .viewUrl(appBaseUrl + "/track/" + trackingId)
                .createdAt(session.getCreatedAt())
                .expiresAt(session.getExpiresAt())
                .build();
    }

    /**
     * Retrieves session info along with the latest location snapshot.
     *
     * @throws SessionNotFoundException if no session exists with the given trackingId
     */
    @Transactional(readOnly = true)
    public SessionStatusResponse getSession(String trackingId) {
        TrackingSession session = findActiveOrAny(trackingId);
        LiveLocation location = liveLocationRepository.findByTrackingId(trackingId).orElse(null);

        return SessionStatusResponse.builder()
                .trackingId(session.getTrackingId())
                .status(session.getStatus())
                .createdAt(session.getCreatedAt())
                .expiresAt(session.getExpiresAt())
                .lastLatitude(location != null ? location.getLatitude() : null)
                .lastLongitude(location != null ? location.getLongitude() : null)
                .lastTimestamp(location != null ? location.getTimestamp() : null)
                .build();
    }

    /**
     * Marks a session as EXPIRED. Idempotent — safe to call multiple times.
     *
     * @throws SessionNotFoundException if no session exists with the given trackingId
     */
    @Transactional
    public void expireSession(String trackingId) {
        TrackingSession session = findActiveOrAny(trackingId);
        session.setStatus(SessionStatus.EXPIRED);
        sessionRepository.save(session);
        log.info("Session expired: {}", trackingId);
    }

    /**
     * Validates that a session exists and is ACTIVE. Used by LocationService before saving.
     *
     * @throws SessionNotFoundException if the session does not exist
     * @throws com.tracker.exception.SessionExpiredException if the session is EXPIRED
     */
    @Transactional(readOnly = true)
    public TrackingSession validateActiveSession(String trackingId) {
        TrackingSession session = sessionRepository.findByTrackingId(trackingId)
                .orElseThrow(() -> new SessionNotFoundException(trackingId));

        if (session.getStatus() == SessionStatus.EXPIRED) {
            throw new com.tracker.exception.SessionExpiredException(trackingId);
        }

        // Auto-expire if past expiresAt
        if (session.getExpiresAt() != null && LocalDateTime.now().isAfter(session.getExpiresAt())) {
            session.setStatus(SessionStatus.EXPIRED);
            sessionRepository.save(session);
            throw new com.tracker.exception.SessionExpiredException(trackingId);
        }

        return session;
    }

    // ---- Private helpers ----

    private TrackingSession findActiveOrAny(String trackingId) {
        return sessionRepository.findByTrackingId(trackingId)
                .orElseThrow(() -> new SessionNotFoundException(trackingId));
    }

    private String generateUniqueId() {
        String id;
        int attempts = 0;
        do {
            id = idGenerator.generate();
            attempts++;
            if (attempts > 10) {
                throw new IllegalStateException("Failed to generate unique tracking ID after 10 attempts");
            }
        } while (sessionRepository.existsByTrackingId(id));
        return id;
    }
}
