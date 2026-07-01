package com.tracker.controller;

import com.tracker.dto.CreateSessionResponse;
import com.tracker.dto.LocationBroadcast;
import com.tracker.dto.SessionStatusResponse;
import com.tracker.entity.LiveLocation;
import com.tracker.service.LocationService;
import com.tracker.service.TrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * REST API controller for tracking session management.
 *
 * Endpoints:
 *   POST   /api/sessions               - Create a new tracking session
 *   GET    /api/sessions/{trackingId}  - Get session info + last known location
 *   GET    /api/sessions/{trackingId}/location - Get latest location snapshot
 *   DELETE /api/sessions/{trackingId}  - Expire a session
 */
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Slf4j
public class TrackingController {

    private final TrackingService trackingService;
    private final LocationService locationService;

    /**
     * Creates a new tracking session.
     * Returns share URL (for sender) and view URL (for viewers).
     */
    @PostMapping
    public ResponseEntity<CreateSessionResponse> createSession() {
        log.info("Creating new tracking session");
        CreateSessionResponse response = trackingService.createSession();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieves session metadata and latest location snapshot.
     */
    @GetMapping("/{trackingId}")
    public ResponseEntity<SessionStatusResponse> getSession(@PathVariable String trackingId) {
        SessionStatusResponse response = trackingService.getSession(trackingId);
        return ResponseEntity.ok(response);
    }

    /**
     * REST fallback to get the latest location for a tracking session.
     * Useful for initial map centering before WebSocket subscription is established.
     */
    @GetMapping("/{trackingId}/location")
    public ResponseEntity<LocationBroadcast> getLatestLocation(@PathVariable String trackingId) {
        // Validate session exists
        trackingService.getSession(trackingId);

        Optional<LiveLocation> location = locationService.getLatestLocation(trackingId);
        if (location.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        LiveLocation loc = location.get();
        LocationBroadcast broadcast = LocationBroadcast.builder()
                .trackingId(trackingId)
                .latitude(loc.getLatitude())
                .longitude(loc.getLongitude())
                .timestamp(loc.getTimestamp())
                .build();

        return ResponseEntity.ok(broadcast);
    }

    /**
     * Expires a tracking session. Idempotent.
     */
    @DeleteMapping("/{trackingId}")
    public ResponseEntity<Void> expireSession(@PathVariable String trackingId) {
        trackingService.expireSession(trackingId);
        return ResponseEntity.noContent().build();
    }
}
