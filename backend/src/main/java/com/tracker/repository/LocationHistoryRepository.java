package com.tracker.repository;

import com.tracker.entity.LocationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationHistoryRepository extends JpaRepository<LocationHistory, Long> {

    List<LocationHistory> findByTrackingIdOrderByTimestampAsc(String trackingId);

    void deleteByTrackingId(String trackingId);

    long countByTrackingId(String trackingId);
}
