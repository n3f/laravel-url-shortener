# Laravel URL Shortener

A modern, feature-rich URL shortener built with Laravel, React, and TypeScript. Create short URLs with analytics, expiration dates, and a beautiful responsive interface.

## Overview

This URL shortener provides a complete solution for creating and managing short URLs with a focus on user experience and functionality. Built with Laravel 12 on the backend and React with TypeScript on the frontend, it offers a modern, responsive interface with dark/light mode support.

### Tech Stack

- **Backend**: Laravel 12, PHP 8.2+
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Database**: SQLite (default), MySQL, PostgreSQL
- **Testing**: PHPUnit, Vitest
- **Build Tools**: Vite, Composer

## Features

### Core Functionality
- **URL Shortening**: Convert long URLs to short, memorable codes
- **Custom Aliases**: Create custom short codes for your URLs
- **Click Analytics**: Track clicks and view detailed statistics
- **Expiration Dates**: Set automatic expiration for temporary URLs
- **Rate Limiting**: Built-in protection against abuse

### User Management
- **Authentication**: Secure user registration and login
- **Profile Management**: Update profile information and settings
- **Password Reset**: Secure password recovery system
- **Email Verification**: Optional email verification support

### Data Migration
- **YOURLS Import**: Import data from existing YOURLS installations
- **SQL Dump Support**: Import from SQL files with automatic field mapping
- **Duplicate Detection**: Smart handling of existing URLs
- **Transaction Safety**: Safe imports with rollback capability

### User Interface
- **Responsive Design**: Works perfectly on desktop and mobile
- **Dark/Light Mode**: Toggle between appearance modes
- **Modern UI**: Clean, intuitive interface built with Radix UI
- **Real-time Updates**: Instant feedback and updates

### API Access
- **RESTful API**: Programmatic access to all features
- **JSON Responses**: Consistent API response format
- **Authentication**: Secure API endpoints with user authentication
- **Rate Limiting**: API rate limiting for security

## Building

### Prerequisites
- PHP 8.2 or higher
- Node.js 18 or higher
- Composer
- npm or yarn

### Development Setup

1. **Install Dependencies**
   ```bash
   composer install
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. **Database Setup**
   ```bash
   php artisan migrate
   ```

4. **Start Development Server**
   ```bash
   # Start all services (Laravel, Vite, Queue, Logs)
   composer run dev

   # Or start individually
   php artisan serve
   npm run dev
   ```

### Production Build

```bash
# Build frontend assets
npm run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Configuration

### Environment Variables

The application uses minimal configuration with sensible defaults:

```env
# App Configuration
APP_NAME="Laravel URL Shortener"
APP_ENV=production
APP_DEBUG=false
APP_URL=http://localhost

# Database (SQLite by default)
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

# Registration (optional)
APP_ALLOW_REGISTRATION=true

# Pagination
PAGINATION_PER_PAGE=10
```

### YOURLS Import Configuration

When importing from YOURLS, you can configure:

- **Table Name**: Specify custom table names with `--table` option
- **User Assignment**: Assign imported URLs to specific users
- **Dry Run**: Test imports without making changes

See [YOURLS Import](YOURLS_IMPORT.md) for more information.

```bash
>  php artisan import:yourls --help
Description:
  Import YOURLS data from SQL file

Usage:
  import:yourls [options]

Options:
      --file[=FILE]        Path to SQL file to import
      --user-id[=USER-ID]  Default user ID to assign imported URLs to
      --table[=TABLE]      Table name to look for in SQL (default: auto-detect)
      --dry-run            Show what would be imported without actually importing
  -h, --help               Display help for the given command. When no command is given display help for the list command
      --silent             Do not output any message
  -q, --quiet              Only errors are displayed. All other output is suppressed
  -V, --version            Display this application version
      --ansi|--no-ansi     Force (or disable --no-ansi) ANSI output
  -n, --no-interaction     Do not ask any interactive question
      --env[=ENV]          The environment the command should run under
  -v|vv|vvv, --verbose     Increase the verbosity of messages: 1 for normal output, 2 for more verbose output and 3 for debug
```

## Testing

### Backend Testing
```bash
# Run all PHP tests
composer test

# Run specific test suites
php artisan test --filter=UrlControllerTest
php artisan test --filter=YourlsImportTest
```

### Frontend Testing
```bash
# Run all frontend tests
npm test

# Run tests in watch mode
npm run test:ui

# Run tests once
npm run test:run
```

### Test Coverage

The application includes comprehensive test coverage for:

- **Feature Tests**: URL creation, redirection, analytics
- **Authentication Tests**: Registration, login, password reset
- **Import Tests**: YOURLS data import functionality
- **Component Tests**: React component behavior
- **API Tests**: RESTful endpoint functionality

## API Reference

### Authentication Required Endpoints

All API endpoints require authentication except for URL redirection.

#### Create Short URL
```http
POST /api/urls
Content-Type: application/json

{
  "url": "https://example.com/very/long/url",
  "short_code": "custom-alias", // optional
  "expires_at": "2024-12-31T23:59:59Z" // optional
}
```

#### Get URL Statistics
```http
GET /api/urls/{id}/stats
```

#### Update URL
```http
PATCH /api/urls/{id}
Content-Type: application/json

{
  "url": "https://new-url.com",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

#### Delete URL
```http
DELETE /api/urls/{id}
```

### Public Endpoints

#### Redirect Short URL
```http
GET /{short_code}
```

Returns a 302 redirect to the original URL.

## Deployment

### NearlyFreeSpeech.net

```bash
rsync -avz --exclude='public'--exclude='.git' --exclude='node_modules' --exclude='storage/logs/*' \
--exclude='storage/framework/cache/*' --exclude='storage/framework/sessions/*' \
--exclude='storage/framework/views/*' --exclude='.env' --exclude='vendor' \
--exclude='.DS_Store' --exclude='*.log' --exclude='database/*.sqlite' . \
$USERNAME@$SERVER:/home/protected/laravel-app/
```

- Check if public directory was transferred, re-softlink it was changed (should be `public -> ../../public`)
- Run `./scripts/adjust-nearlyfreespeech-permissions.sh`
- Run `php artisan optimize:clear`
- Run `php artisan migrate`
- Run `php artisan optimize`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
