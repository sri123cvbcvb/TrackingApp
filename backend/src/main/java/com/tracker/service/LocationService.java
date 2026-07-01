package com.tracker.service;

import com.tracker.dto.LocationBroadcast;
import com.tracker.dto.LocationUpdateRequest;
import com.tracker.entity.LiveLocation;
import com.tracker.entity.LocationHistory;
import com.tracker.repository.LiveLocationRepository;
import com.tracker.repository.LocationHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * Handles location update logic:
 * 1. Validates the session is active.
 * 2. Upserts the live_location record.
 * 3. Appends to location_history for future route-replay.
 * 4. Broadcasts via STOMP to all subscribers on /topic/track/{trackingId}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {

    private final TrackingService trackingService;
    private final LiveLocationRepository liveLocationRepository;
    private final LocationHistoryRepository locationHistoryRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Processes an incoming location update from the Sender.
     * Persists data and broadcasts to all viewers in real time.
     */
    @Transactional
    public LocationBroadcast processLocationUpdate(LocationUpdateRequest request) {
        String trackingId = request.getTrackingId();

        // Validate session is active (throws if not)
        trackingService.validateActiveSession(trackingId);

        long now = Instant.now().toEpochMilli();

        // Upsert live location (one row per session)
        Optional<LiveLocation> existing = liveLocationRepository.findByTrackingId(trackingId);
        LiveLocation liveLocation;
        if (existing.isPresent()) {
            liveLocation = existing.get();
            liveLocation.setLatitude(request.getLatitude());
            liveLocation.setLongitude(request.getLongitude());
            liveLocation.setTimestamp(now);
        } else {
            liveLocation = LiveLocation.builder()
                    .trackingId(trackingId)
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .timestamp(now)
                    .build();
        }
        liveLocationRepository.save(liveLocation);

        // Append to history trail
        LocationHistory history = LocationHistory.builder()
                .trackingId(trackingId)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .timestamp(now)
                .build();
        locationHistoryRepository.save(history);

        // Build broadcast payload
        LocationBroadcast broadcast = LocationBroadcast.builder()
                .trackingId(trackingId)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .timestamp(now)
                .build();

        // Broadcast to all subscribers on /topic/track/{trackingId}
        String destination = "/topic/track/" + trackingId;
        messagingTemplate.convertAndSend(destination, broadcast);
        log.debug("Broadcasted location [{}, {}] to {} subscribers on {}",
                request.getLatitude(), request.getLongitude(), trackingId, destination);

        return broadcast;
    }

    /**
     * Retrieves the latest location snapshot for a given tracking session.
     */
    @Transactional(readOnly = true)
    public Optional<LiveLocation> getLatestLocation(String trackingId) {
        return liveLocationRepository.findByTrackingId(trackingId);
    }
}
