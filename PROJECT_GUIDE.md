# URL Shortener Development Guide

## Project Overview

This guide provides a structured approach to building a URL shortener API across different languages and frameworks. The project is designed to be built iteratively, allowing for skill development and gradual feature expansion.

## AI Assistant Instructions

### Core Principles

- **Iterative Development**: Build in small, manageable steps
- **Idiomatic Code**: Use language/framework best practices and conventions
- **Educational Focus**: Explain decisions, patterns, and trade-offs
- **Incremental Complexity**: Start simple, add features progressively

### Response Guidelines

- Provide code for ONE feature/step at a time
- Explain the "why" behind architectural decisions
- Include relevant comments in code
- Suggest testing approaches for each step
- Point out language/framework-specific patterns
- Ask clarifying questions before implementing complex features

## Project Specification

### Core Features (MVP)

1. **URL Shortening**: Convert long URLs to short codes
2. **URL Redirection**: Redirect short codes to original URLs
3. **Basic Validation**: Ensure URLs are valid before shortening
4. **Storage**: Persist URL mappings

### Progressive Features (Expansion)

- [ ] Custom short codes
- [ ] Analytics (click tracking, timestamps)
- [ ] Expiration dates
- [ ] Rate limiting
- [ ] User authentication
- [ ] Bulk operations
- [ ] QR code generation
- [ ] Admin dashboard

## Technical Constraints

### Current Settings

```yaml
# Adjust these as needed for different implementations
short_code_length: 6
short_code_charset: "abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
max_url_length: 2048
enable_custom_codes: false
enable_analytics: false
enable_expiration: false
```

### Architecture Requirements

- RESTful API design
- Environment-based configuration
- Proper error handling and HTTP status codes
- Input validation and sanitization
- Database abstraction (where applicable)

## Development Steps

### Phase 1: Foundation

1. **Project Setup**
    - Initialize project structure
    - Set up basic dependencies
    - Create configuration system
    - Set up basic routing
2. **Core Data Model**
    - Define URL mapping structure
    - Set up database/storage layer
    - Create basic CRUD operations
3. **Basic API Endpoints**
    - POST /shorten - Create short URL
    - GET /{code} - Redirect to original URL
    - Basic error handling

### Phase 2: Enhancement

4. **Validation & Error Handling**
    - URL validation
    - Duplicate handling
    - Comprehensive error responses
5. **Configuration & Environment**
    - Environment variables
    - Configurable settings
    - Logging setup

### Phase 3: Advanced Features

6. **Analytics** (if enabled)
    - Click tracking
    - Timestamp logging
    - Basic statistics endpoint
7. **Custom Features** (if enabled)
    - Custom short codes
    - Expiration handling
    - Rate limiting

## Implementation Templates

### Standard API Endpoints

```
POST /api/shorten
Body: { "url": "https://example.com/very/long/url" }
Response: { "short_url": "http://short.ly/abc123", "code": "abc123" }

GET /{code}
Response: 302 redirect to original URL

GET /api/stats/{code} (if analytics enabled)
Response: { "clicks": 42, "created_at": "2024-01-01T00:00:00Z" }
```

### Error Response Format

```json
{
  "error": "Invalid URL",
  "code": "INVALID_URL",
  "message": "The provided URL is not valid"
}
```

## Language/Framework Specific Notes

### When implementing, consider:

- **Go**: Use gorilla/mux or gin for routing, proper middleware patterns
- **Python**: FastAPI for modern async, Flask for simplicity, proper virtual environments
- **Node.js**: Express.js patterns, async/await, proper error middleware
- **Rust**: Actix-web or Axum, proper error handling with Result types
- **Java**: Spring Boot, proper dependency injection, exception handling
- **C#**: ASP.NET Core, proper dependency injection, async patterns

## Development Workflow

### For each step:

1. **Plan**: Discuss the current step and approach
2. **Implement**: Write code for the specific feature
3. **Test**: Suggest testing approach and examples
4. **Review**: Explain what was built and why
5. **Next**: Identify the next logical step

### Questions to Guide Development:

- What's the minimal implementation for this step?
- What language/framework patterns should we follow?
- What potential issues should we consider?
- How can we test this feature?
- What's the next logical step?

## Usage Instructions

### For the AI Assistant:

1. Always start by asking which language/framework to use
2. Confirm the current phase/step before implementing
3. Provide code for ONE specific feature at a time
4. Explain architectural decisions and patterns
5. Suggest testing approaches
6. Ask if constraints need adjustment before complex features

### For the Developer:

1. Choose your target language/framework
2. Specify which step/feature to implement next
3. Adjust constraints in this document as needed
4. Ask for explanations of unfamiliar patterns
5. Request testing examples when needed

## Current Status

- [x] Language/Framework: PHP, Laravel
- [ ] Phase: 1
- [ ] Last completed step: 1

---

**Note**: Update this document as you progress through different implementations to track your learning and maintain consistency across different technology stacks.
