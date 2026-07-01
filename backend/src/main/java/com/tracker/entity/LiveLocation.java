package com.tracker.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Stores the most recent (live) location for a tracking session.
 * Only one record per trackingId — upserted on every location update.
 */
@Entity
@Table(name = "live_location", indexes = {
        @Index(name = "idx_live_tracking_id", columnList = "tracking_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LiveLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tracking_id", nullable = false, unique = true, length = 20)
    private String trackingId;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "timestamp", nullable = false)
    private Long timestamp;
}
