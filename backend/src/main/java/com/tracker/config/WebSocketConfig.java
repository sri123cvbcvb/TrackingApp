package com.tracker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration enabling STOMP messaging with SockJS fallback.
 * Clients connect to /ws, send to /app/*, subscribe to /topic/*.
 *
 * In production, ALLOWED_ORIGINS env var on Render should be set to the
 * exact Vercel deployment URL, e.g.: https://tracking-app.vercel.app
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // Comma-separated list of allowed origins.
    // Dev default: localhost. Prod: set ALLOWED_ORIGINS env var on Render.
    @Value("${tracker.websocket.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOriginsRaw;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple in-memory broker for /topic and /queue destinations
        config.enableSimpleBroker("/topic", "/queue");
        // Messages from clients destined to /app/* will route to @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Split comma-separated origins and trim whitespace
        String[] origins = allowedOriginsRaw.split(",");
        for (int i = 0; i < origins.length; i++) {
            origins[i] = origins[i].trim();
        }

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins)
                .withSockJS(); // SockJS fallback for non-WebSocket environments
    }
}
