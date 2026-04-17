package com.urlshortener.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UrlResponse {
    private Long id;
    private String shortCode;
    private String shortUrl;
    private String originalUrl;
    private String title;
    private Long clickCount;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean active;
}
