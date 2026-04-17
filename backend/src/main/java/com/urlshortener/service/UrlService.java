package com.urlshortener.service;

import com.urlshortener.dto.CreateUrlRequest;
import com.urlshortener.dto.UrlResponse;
import com.urlshortener.model.Click;
import com.urlshortener.model.Url;
import com.urlshortener.model.User;
import com.urlshortener.repository.ClickRepository;
import com.urlshortener.repository.UrlRepository;
import com.urlshortener.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UrlService {

    private final UrlRepository urlRepository;
    private final UserRepository userRepository;
    private final ClickRepository clickRepository;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final String BASE_URL = "http://localhost:8081/s/";

    public UrlResponse createShortUrl(CreateUrlRequest request, String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        String shortCode;
        if (request.getCustomAlias() != null && !request.getCustomAlias().isEmpty()) {
            if (urlRepository.existsByCustomAlias(request.getCustomAlias())) {
                throw new RuntimeException("Custom alias already taken!");
            }
            shortCode = request.getCustomAlias();
        } else {
            shortCode = generateShortCode();
        }

        Url url = new Url();
        url.setShortCode(shortCode);
        url.setOriginalUrl(request.getOriginalUrl());
        url.setTitle(request.getTitle() != null ? request.getTitle() : request.getOriginalUrl());
        url.setCustomAlias(request.getCustomAlias());
        url.setUser(user);
        url.setClickCount(0L);
        url.setActive(true);
        url.setCreatedAt(LocalDateTime.now());

        if (request.getExpiryDays() != null && request.getExpiryDays() > 0) {
            url.setExpiresAt(LocalDateTime.now().plusDays(request.getExpiryDays()));
        }

        Url saved = urlRepository.save(url);

        // Cache in Redis for fast redirects
        redisTemplate.opsForValue().set("url:" + shortCode, request.getOriginalUrl(), 24, TimeUnit.HOURS);

        log.info("Created short URL: {} -> {}", shortCode, request.getOriginalUrl());
        return toResponse(saved);
    }

    public String redirect(String shortCode, String ip, String device, String browser) {
        // Check Redis cache first
        String cached = redisTemplate.opsForValue().get("url:" + shortCode);
        if (cached != null) {
            trackClick(shortCode, ip, device, browser);
            return cached;
        }

        Url url = urlRepository.findByShortCode(shortCode)
            .orElseGet(() -> urlRepository.findByCustomAlias(shortCode)
            .orElseThrow(() -> new RuntimeException("URL not found")));

        if (!url.isActive()) throw new RuntimeException("URL is disabled");
        if (url.getExpiresAt() != null && url.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("URL has expired");
        }

        // Cache it
        redisTemplate.opsForValue().set("url:" + shortCode, url.getOriginalUrl(), 24, TimeUnit.HOURS);

        trackClick(shortCode, ip, device, browser);
        return url.getOriginalUrl();
    }

    private void trackClick(String shortCode, String ip, String device, String browser) {
        urlRepository.findByShortCode(shortCode).ifPresent(url -> {
            url.setClickCount(url.getClickCount() + 1);
            urlRepository.save(url);

            Click click = new Click();
            click.setUrl(url);
            click.setIpAddress(ip);
            click.setDevice(device);
            click.setBrowser(browser);
            click.setClickedAt(LocalDateTime.now());
            clickRepository.save(click);
        });
    }

    public List<UrlResponse> getUserUrls(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return urlRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public void deleteUrl(Long id, String email) {
        Url url = urlRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("URL not found"));
        if (!url.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized");
        }
        redisTemplate.delete("url:" + url.getShortCode());
        urlRepository.delete(url);
    }

    public void toggleUrl(Long id, String email) {
        Url url = urlRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("URL not found"));
        if (!url.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized");
        }
        url.setActive(!url.isActive());
        urlRepository.save(url);
        if (!url.isActive()) {
            redisTemplate.delete("url:" + url.getShortCode());
        }
    }

    public Long getTotalClicks(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Long total = urlRepository.getTotalClicksByUserId(user.getId());
        return total != null ? total : 0L;
    }

    private String generateShortCode() {
        Random random = new Random();
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
            }
            code = sb.toString();
        } while (urlRepository.existsByShortCode(code));
        return code;
    }

    private UrlResponse toResponse(Url url) {
        UrlResponse response = new UrlResponse();
        response.setId(url.getId());
        response.setShortCode(url.getShortCode());
        response.setShortUrl(BASE_URL + url.getShortCode());
        response.setOriginalUrl(url.getOriginalUrl());
        response.setTitle(url.getTitle());
        response.setClickCount(url.getClickCount());
        response.setCreatedAt(url.getCreatedAt());
        response.setExpiresAt(url.getExpiresAt());
        response.setActive(url.isActive());
        return response;
    }
}
