package com.urlshortener.repository;

import com.urlshortener.model.Url;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface UrlRepository extends JpaRepository<Url, Long> {
    Optional<Url> findByShortCode(String shortCode);
    Optional<Url> findByCustomAlias(String customAlias);
    List<Url> findByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByShortCode(String shortCode);
    boolean existsByCustomAlias(String customAlias);

    @Query("SELECT SUM(u.clickCount) FROM Url u WHERE u.user.id = :userId")
    Long getTotalClicksByUserId(Long userId);
}
