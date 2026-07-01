# LiveTrack — Real-Time Person-to-Person Location Tracking

A production-ready, full-stack real-time location tracking system. Share your live GPS location with anyone via a private link — they see you move on a live OpenStreetMap in real time.

Built with **Spring Boot 3 + WebSocket/STOMP** (backend) and **React + Vite + Leaflet.js** (frontend).

---

## Architecture

```
Browser (Sender)                Browser (Viewer)
  watchPosition()                    Leaflet Map
       │ STOMP /app/location              │ /topic/track/{id}
       ▼                                  ▲
  ┌────────────────────────────────────────────┐
  │         Spring Boot Backend               │
  │  LocationMessageHandler → LocationService  │
  │       ↕ JPA              ↕ STOMP Broadcast │
  │    MySQL DB           SimpMessaging        │
  └────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Java 21, Spring Boot 3.2, Maven     |
| WebSocket | Spring WebSocket (STOMP) + SockJS   |
| Database  | MySQL 8.0, Spring Data JPA          |
| Frontend  | React 18, Vite 5                    |
| Map       | Leaflet.js + OpenStreetMap          |
| Infra     | Docker, Docker Compose, Nginx       |

---

## Quick Start (Docker)

### Prerequisites
- Docker Desktop installed and running

### Run everything with Docker Compose

```bash
# Clone / navigate to project
cd trackingapplication

# Start all services (MySQL on port 3305, backend on 8080, frontend on 3000)
docker-compose up --build
```

> **Note:** MySQL is mapped to host port **3305** to avoid conflict with a local MySQL on 3306.

Open **http://localhost:3000** in your browser.

---

## Development Setup (Without Docker)

### Prerequisites
- Java 21 (JDK)
- Maven 3.9+
- Node.js 20+
- MySQL 8.0 running locally

### 1. Database Setup

```sql
CREATE DATABASE trackingdb;
CREATE USER 'tracker'@'localhost' IDENTIFIED BY 'tracker_pass';
GRANT ALL PRIVILEGES ON trackingdb.* TO 'tracker'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend

```bash
cd backend

# Edit src/main/resources/application.yml if needed (or use env vars)
# DB_HOST=localhost DB_PORT=3306 (your local MySQL port)

mvn clean spring-boot:run
# Backend starts at http://localhost:8080
```

### 3. Frontend

```bash
cd frontend

npm install
npm run dev
# Frontend starts at http://localhost:3000 (proxies /api and /ws to :8080)
```

---

## User Flow

1. Open **http://localhost:3000**
2. Click **"Create Tracking Session"** — you get two links:
   - **Sender Link** (`/share/{id}`) — open this tab to share your location
   - **Viewer Link** (`/track/{id}`) — share this with anyone to track you
3. Open the **Sender Link** → grant location permission → see "LIVE" badge
4. Open the **Viewer Link** in another tab/device → watch the marker move in real time

---

## API Reference

### REST Endpoints

| Method   | Endpoint                              | Description                    |
|----------|---------------------------------------|--------------------------------|
| `POST`   | `/api/sessions`                       | Create new tracking session    |
| `GET`    | `/api/sessions/{trackingId}`          | Get session info + last location|
| `GET`    | `/api/sessions/{trackingId}/location` | Get latest location (REST)     |
| `DELETE` | `/api/sessions/{trackingId}`          | Expire a session               |

**Create Session Response:**
```json
{
  "trackingId": "F3X9K2BQ",
  "status": "ACTIVE",
  "shareUrl": "http://localhost:3000/share/F3X9K2BQ",
  "viewUrl": "http://localhost:3000/track/F3X9K2BQ",
  "createdAt": "2024-01-01T12:00:00"
}
```

### WebSocket (STOMP over SockJS)

**Endpoint:** `ws://localhost:8080/ws`

**Sender → Server** (`/app/location`):
```json
{
  "trackingId": "F3X9K2BQ",
  "latitude": 12.987654,
  "longitude": 80.234567
}
```

**Server → Viewer** (`/topic/track/F3X9K2BQ`):
```json
{
  "trackingId": "F3X9K2BQ",
  "latitude": 12.987654,
  "longitude": 80.234567,
  "timestamp": 1750000000000
}
```

---

## Database Schema

```sql
-- tracking_session: one row per session
CREATE TABLE tracking_session (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  tracking_id VARCHAR(20) UNIQUE NOT NULL,
  status      VARCHAR(10) NOT NULL,   -- ACTIVE | EXPIRED
  created_at  DATETIME NOT NULL,
  expires_at  DATETIME
);

-- live_location: one row per session (upserted on every update)
CREATE TABLE live_location (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  tracking_id VARCHAR(20) UNIQUE NOT NULL,
  latitude    DOUBLE NOT NULL,
  longitude   DOUBLE NOT NULL,
  timestamp   BIGINT NOT NULL
);

-- location_history: one row per location update (full trail)
CREATE TABLE location_history (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  tracking_id VARCHAR(20) NOT NULL,
  latitude    DOUBLE NOT NULL,
  longitude   DOUBLE NOT NULL,
  timestamp   BIGINT NOT NULL,
  INDEX idx_tracking_id (tracking_id),
  INDEX idx_timestamp (timestamp)
);
```

> Tables are auto-created by Spring Data JPA (`ddl-auto: update`).

---

## Environment Variables

| Variable              | Default           | Description                         |
|-----------------------|-------------------|-------------------------------------|
| `DB_HOST`             | `localhost`       | MySQL host                          |
| `DB_PORT`             | `3306`            | MySQL port (inside container)       |
| `DB_NAME`             | `trackingdb`      | Database name                       |
| `DB_USERNAME`         | `root`            | DB username                         |
| `DB_PASSWORD`         | `root`            | DB password                         |
| `ALLOWED_ORIGINS`     | `http://localhost:3000` | CORS allowed origins          |
| `APP_BASE_URL`        | `http://localhost:3000` | Used for generating share URLs|
| `MYSQL_ROOT_PASSWORD` | `tracker_root`    | MySQL root password (Docker only)   |
| `MYSQL_USER`          | `tracker`         | MySQL app user (Docker only)        |
| `MYSQL_PASSWORD`      | `tracker_pass`    | MySQL app password (Docker only)    |

---

## Project Structure

```
trackingapplication/
├── backend/
│   ├── src/main/java/com/tracker/
│   │   ├── config/           # WebSocket & CORS config
│   │   ├── controller/       # REST endpoints
│   │   ├── websocket/        # STOMP message handlers
│   │   ├── service/          # Business logic
│   │   ├── repository/       # JPA repositories
│   │   ├── entity/           # JPA entities
│   │   ├── dto/              # Request/Response DTOs
│   │   ├── exception/        # Custom exceptions + global handler
│   │   └── util/             # TrackingIdGenerator
│   ├── src/main/resources/application.yml
│   ├── pom.xml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # Map, LiveBadge, CopyButton, StatusCard
│   │   ├── pages/            # HomePage, SenderPage, ViewerPage
│   │   ├── hooks/            # useGeolocation, useWebSocket
│   │   └── services/         # api.js, websocket.js
│   ├── nginx.conf
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env
└── README.md
```

---

## Future Features (Extensibility)

The codebase is already structured for these additions:

- **Route History** — `location_history` table is already populated; just add a `GET /api/sessions/{id}/history` endpoint and draw a Leaflet polyline
- **Speed Calculation** — compute distance delta between consecutive history records
- **ETA** — integrate with a routing API given destination coordinates
- **Session Expiry** — `expires_at` column already exists; a scheduled job can call `expireSession()`
- **Auth** — Add Spring Security JWT filter on top of the existing architecture

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3305 in use | Edit `docker-compose.yml` host port (`"XXXX:3306"`) |
| Backend can't connect to MySQL | Wait for healthcheck to pass (~30s on first run) |
| "Location permission denied" | Enable location in browser settings → reload |
| Map doesn't update | Check browser console for WebSocket errors |
| `CORS error` in console | Ensure `ALLOWED_ORIGINS` includes the frontend URL |
