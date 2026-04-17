# 🔗 LinkSnip — URL Shortener

A high-performance URL shortening service with Redis caching, click analytics, custom aliases, and QR code generation.

## Features

- Shorten any URL with custom aliases
- Redis caching for sub-millisecond redirects
- Click analytics with device and browser tracking
- Expiry dates for time-limited links
- Enable/Disable links anytime
- JWT Authentication
- React dashboard with charts
- Docker Compose deployment
- Swagger API documentation

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Java 17 | Core language |
| Spring Boot 3.2 | REST API |
| Spring Security + JWT | Authentication |
| Redis | Sub-millisecond caching |
| PostgreSQL | Primary database |
| React + TypeScript | Frontend dashboard |
| Docker Compose | Containerization |
| Swagger | API documentation |

## Quick Start

1. Start infrastructure
```bash
docker-compose up -d
```

2. Start Backend
```bash
cd backend
mvn spring-boot:run -DskipTests
```

3. Start Frontend
```bash
cd frontend
npm install
npm start
```

4. Open http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| POST | /api/urls | Create short URL |
| GET | /api/urls | Get all your URLs |
| DELETE | /api/urls/{id} | Delete URL |
| PUT | /api/urls/{id}/toggle | Enable/Disable URL |
| GET | /api/stats | Get click statistics |
| GET | /s/{shortCode} | Redirect to original URL |

## Author

Bhavishya Yarapathineni
- bhavishya123yarapathineni@gmail.com
- LinkedIn https://www.linkedin.com/in/bhavi-chowdary-748569403/
- GitHub https://github.com/bhavishyayarapathineni

## License

MIT License
