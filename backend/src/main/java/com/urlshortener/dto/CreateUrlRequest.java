package com.urlshortener.dto;

import lombok.Data;

@Data
public class CreateUrlRequest {
    private String originalUrl;
    private String customAlias;
    private String title;
    private Integer expiryDays;
}
