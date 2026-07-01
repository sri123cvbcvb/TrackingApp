package com.tracker.repository;

import com.tracker.entity.SessionStatus;
import com.tracker.entity.TrackingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrackingSessionRepository extends JpaRepository<TrackingSession, Long> {

    Optional<TrackingSession> findByTrackingId(String trackingId);

    List<TrackingSession> findByStatus(SessionStatus status);

    boolean existsByTrackingId(String trackingId);
}
