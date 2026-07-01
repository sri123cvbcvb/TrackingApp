package com.tracker.websocket;

import com.tracker.dto.LocationBroadcast;
import com.tracker.dto.LocationUpdateRequest;
import com.tracker.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

/**
 * STOMP message handler for inbound location updates from Sender clients.
 * Clients send to: /app/location
 * Server broadcasts to: /topic/track/{trackingId}
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class LocationMessageHandler {

    private final LocationService locationService;

    /**
     * Handles location update messages sent by Sender to /app/location.
     * Delegates to LocationService which persists and broadcasts.
     */
    @MessageMapping("/location")
    public void handleLocationUpdate(@Payload @Valid LocationUpdateRequest request) {
        log.debug("Received location update from sender - trackingId: {}, lat: {}, lng: {}",
                request.getTrackingId(), request.getLatitude(), request.getLongitude());

        LocationBroadcast broadcast = locationService.processLocationUpdate(request);
        log.debug("Location processed and broadcasted: trackingId={}, timestamp={}",
                broadcast.getTrackingId(), broadcast.getTimestamp());
    }
}
