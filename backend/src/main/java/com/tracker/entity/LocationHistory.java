package com.tracker.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Stores the full location trail for a tracking session.
 * One record is appended for every location update received.
 * Designed for future route-history and ETA features.
 */
@Entity
@Table(name = "location_history", indexes = {
        @Index(name = "idx_history_tracking_id", columnList = "tracking_id"),
        @Index(name = "idx_history_timestamp", columnList = "timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tracking_id", nullable = false, length = 20)
    private String trackingId;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "timestamp", nullable = false)
    private Long timestamp;
}
