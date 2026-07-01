package com.tracker.repository;

import com.tracker.entity.LiveLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LiveLocationRepository extends JpaRepository<LiveLocation, Long> {

    Optional<LiveLocation> findByTrackingId(String trackingId);

    void deleteByTrackingId(String trackingId);
}
