package com.urlshortener.repository;

import com.urlshortener.model.Click;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClickRepository extends JpaRepository<Click, Long> {
    List<Click> findByUrlIdOrderByClickedAtDesc(Long urlId);
    Long countByUrlId(Long urlId);
}
