# YOURLS Data Import

This application includes functionality to import data from YOURLS (Your Own URL Shortener) installations.

## Features

- Import from SQL dump files
- Automatic field mapping
- Duplicate detection and skipping
- Transaction safety
- Detailed import statistics

## Usage

### Import from SQL File

```bash
# Basic import
php artisan import:yourls --file=/path/to/yourls_dump.sql

# Import with default user assignment
php artisan import:yourls --file=/path/to/yourls_dump.sql --user-id=1

# Import with specific table name
php artisan import:yourls --file=/path/to/yourls_dump.sql --table=yourls_url

# Dry run to see what would be imported
php artisan import:yourls --file=/path/to/yourls_dump.sql --dry-run
```



## Field Mapping

The import service automatically maps YOURLS fields to your application's fields:

| YOURLS Field | Application Field | Notes |
|--------------|-------------------|-------|
| `keyword` | `short_code` | Required |
| `url` | `original_url` | Required |
| `clicks` | `clicks` | Optional, defaults to 0 |
| `timestamp` | `created_at` | Optional, converted from Unix timestamp |

## SQL File Format

The import expects SQL files with INSERT statements. Common YOURLS table names are supported:

- `YOURLS_DB_TABLE` (default YOURLS table name)
- `yourls_url` (common YOURLS table name)
- `urls`
- `yourls_urls`

You can also specify a custom table name using the `--table` option.

Example SQL format:
```sql
INSERT INTO `YOURLS_DB_TABLE` (`keyword`, `url`, `title`, `timestamp`, `ip`, `clicks`) VALUES
('abc123', 'https://example.com', 'Example Site', 1640995200, '127.0.0.1', 5),
('def456', 'https://google.com', 'Google', 1640995300, '127.0.0.1', 10);
```

## Import Statistics

After each import, you'll see a summary:

```
Import completed!
+----------+-------+
| Metric   | Count |
+----------+-------+
| Imported | 150   |
| Skipped  | 5     |
| Errors   | 0     |
+----------+-------+
```

- **Imported**: Successfully imported URLs
- **Skipped**: URLs that were skipped (duplicates, missing required fields)
- **Errors**: URLs that failed to import due to errors

## Error Handling

- Duplicate short codes are automatically skipped
- Missing required fields (short_code, original_url) are skipped
- Database errors are logged and counted
- All imports use database transactions for safety

## Production Considerations

When moving to production:

1. **Database Type**: The import works with both SQLite and MySQL/PostgreSQL
2. **File Copy**: You can copy your SQLite database file directly
3. **Large Imports**: For large datasets, consider running imports during low-traffic periods
4. **Backup**: Always backup your database before importing

## Testing

Run the import tests:

```bash
php artisan test --filter=YourlsImportTest
```
