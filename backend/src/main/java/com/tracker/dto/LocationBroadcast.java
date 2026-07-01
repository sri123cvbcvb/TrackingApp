package com.tracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Outbound WebSocket broadcast payload sent to all subscribers on
 * /topic/track/{trackingId} whenever the sender's location updates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationBroadcast {

    private String trackingId;
    private Double latitude;
    private Double longitude;
    private Long timestamp;   // epoch milliseconds
}
