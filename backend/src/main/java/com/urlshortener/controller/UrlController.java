package com.urlshortener.controller;

import com.urlshortener.dto.CreateUrlRequest;
import com.urlshortener.dto.UrlResponse;
import com.urlshortener.service.UrlService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UrlController {

    private final UrlService urlService;

    @PostMapping("/api/urls")
    public ResponseEntity<UrlResponse> createUrl(
            @RequestBody CreateUrlRequest request,
            Authentication auth) {
        return ResponseEntity.ok(urlService.createShortUrl(request, auth.getName()));
    }

    @GetMapping("/api/urls")
    public ResponseEntity<List<UrlResponse>> getMyUrls(Authentication auth) {
        return ResponseEntity.ok(urlService.getUserUrls(auth.getName()));
    }

    @DeleteMapping("/api/urls/{id}")
    public ResponseEntity<Void> deleteUrl(@PathVariable Long id, Authentication auth) {
        urlService.deleteUrl(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/api/urls/{id}/toggle")
    public ResponseEntity<Void> toggleUrl(@PathVariable Long id, Authentication auth) {
        urlService.toggleUrl(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/stats")
    public ResponseEntity<Map<String, Object>> getStats(Authentication auth) {
        List<UrlResponse> urls = urlService.getUserUrls(auth.getName());
        Long totalClicks = urlService.getTotalClicks(auth.getName());
        return ResponseEntity.ok(Map.of(
            "totalUrls", urls.size(),
            "totalClicks", totalClicks,
            "activeUrls", urls.stream().filter(UrlResponse::isActive).count()
        ));
    }

    @GetMapping("/s/{shortCode}")
    public ResponseEntity<Void> redirect(
            @PathVariable String shortCode,
            HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        String device = userAgent != null && userAgent.contains("Mobile") ? "Mobile" : "Desktop";
        String browser = detectBrowser(userAgent);
        String originalUrl = urlService.redirect(shortCode, ip, device, browser);
        return ResponseEntity.status(302)
            .header("Location", originalUrl)
            .build();
    }

    private String detectBrowser(String userAgent) {
        if (userAgent == null) return "Unknown";
        if (userAgent.contains("Chrome")) return "Chrome";
        if (userAgent.contains("Firefox")) return "Firefox";
        if (userAgent.contains("Safari")) return "Safari";
        if (userAgent.contains("Edge")) return "Edge";
        return "Other";
    }
}
