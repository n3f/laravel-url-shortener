<?php

namespace App\Services;

use App\Models\Url;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class YourlsImportService
{
    protected array $stats = [
        'imported' => 0,
        'skipped' => 0,
        'errors' => 0,
    ];

    protected array $fieldMapping = [
        'keyword' => 'short_code',
        'url' => 'original_url',
        'title' => 'title',
        'timestamp' => 'created_at',
        'ip' => 'ip',
        'clicks' => 'clicks',
    ];

    /**
     * Import YOURLS data from a SQL file
     */
    public function importFromSqlFile(string $filePath, ?int $defaultUserId = null, ?string $tableName = null, bool $dryRun = false): array
    {
        if (!file_exists($filePath)) {
            throw new \InvalidArgumentException("SQL file not found: {$filePath}");
        }

        $sql = file_get_contents($filePath);
        return $this->importFromSql($sql, $defaultUserId, $tableName, $dryRun);
    }

    /**
     * Import YOURLS data from SQL string
     */
    public function importFromSql(string $sql, ?int $defaultUserId = null, ?string $tableName = null, bool $dryRun = false): array
    {
        $this->resetStats();

        // Extract INSERT statements for the specified table or auto-detect
        if ($tableName) {
            preg_match_all('/INSERT INTO `?' . preg_quote($tableName, '/') . '`?.*?;/is', $sql, $matches);
        } else {
            // Auto-detect table names
            preg_match_all('/INSERT INTO `?YOURLS_DB_TABLE`?.*?;/is', $sql, $matches);

            if (empty($matches[0])) {
                preg_match_all('/INSERT INTO `?yourls_url`?.*?;/is', $sql, $matches);
            }

            if (empty($matches[0])) {
                preg_match_all('/INSERT INTO `?urls`?.*?;/is', $sql, $matches);
            }
        }

        if (empty($matches[0])) {
            $tableInfo = $tableName ? "table '{$tableName}'" : "any known YOURLS table";
            throw new \InvalidArgumentException("No valid INSERT statements found for {$tableInfo} in SQL");
        }

        if ($dryRun) {
            // In dry run mode, just count what would be imported without writing to database
            foreach ($matches[0] as $insertStatement) {
                $this->processInsertStatementDryRun($insertStatement, $defaultUserId);
            }
        } else {
            DB::beginTransaction();
            try {
                foreach ($matches[0] as $insertStatement) {
                    $this->processInsertStatement($insertStatement, $defaultUserId);
                }
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        }

        return $this->stats;
    }



    /**
     * Process a single INSERT statement
     */
    protected function processInsertStatement(string $statement, ?int $defaultUserId): void
    {
        // Extract all value groups from INSERT statement
        if (preg_match('/VALUES\s*\((.*)\)/is', $statement, $matches)) {
            $valuesString = $matches[1];

            // Split by '),(' to get individual value groups
            $valueGroups = preg_split('/\),\s*\(/', $valuesString);

            foreach ($valueGroups as $group) {
                // Clean up the group (remove leading/trailing parentheses)
                $group = trim($group, '()');

                // Parse the values
                $values = $this->parseInsertValues($group);

                if ($values) {
                    $this->importRow($values, $defaultUserId);
                }
            }
        } else {
            Log::warning("Could not parse VALUES from statement: " . substr($statement, 0, 100));
        }
    }

    /**
     * Process a single INSERT statement for dry run (no database writes)
     */
    protected function processInsertStatementDryRun(string $statement, ?int $defaultUserId): void
    {
        // Extract all value groups from INSERT statement
        if (preg_match('/VALUES\s*\((.*)\)/is', $statement, $matches)) {
            $valuesString = $matches[1];

            // Split by '),(' to get individual value groups
            $valueGroups = preg_split('/\),\s*\(/', $valuesString);

            foreach ($valueGroups as $group) {
                // Clean up the group (remove leading/trailing parentheses)
                $group = trim($group, '()');

                // Parse the values
                $values = $this->parseInsertValues($group);

                if ($values) {
                    $this->importRowDryRun($values, $defaultUserId);
                }
            }
        } else {
            Log::warning("Could not parse VALUES from statement: " . substr($statement, 0, 100));
        }
    }

    /**
     * Parse INSERT statement values
     */
    protected function parseInsertValues(string $valuesString): ?array
    {
        // This is a simplified parser - you might need to enhance it based on your SQL format
        $values = [];
        $current = '';
        $inQuotes = false;
        $quoteChar = null;

        for ($i = 0; $i < strlen($valuesString); $i++) {
            $char = $valuesString[$i];

            if (($char === "'" || $char === '"') && ($i === 0 || $valuesString[$i-1] !== '\\')) {
                if (!$inQuotes) {
                    $inQuotes = true;
                    $quoteChar = $char;
                } elseif ($char === $quoteChar) {
                    $inQuotes = false;
                    $quoteChar = null;
                } else {
                    $current .= $char;
                }
            } elseif ($char === ',' && !$inQuotes) {
                $values[] = trim($current, "'\"");
                $current = '';
            } else {
                $current .= $char;
            }
        }

        if ($current !== '') {
            $values[] = trim($current, "'\"");
        }

        return $values;
    }

    /**
     * Import a single row of data
     */
    protected function importRow(array $row, ?int $defaultUserId): void
    {
        try {
            // Map YOURLS fields to our fields
            $mappedData = $this->mapYourlsFields($row, $defaultUserId);

            if (!$mappedData) {
                $this->stats['skipped']++;
                return;
            }

            // Check if URL already exists
            $existingUrl = Url::where('short_code', $mappedData['short_code'])->first();
            if ($existingUrl) {
                $this->stats['skipped']++;
                return;
            }

            // Create the URL
            Url::create($mappedData);
            $this->stats['imported']++;

        } catch (\Exception $e) {
            $this->stats['errors']++;
            Log::error("Error importing row: " . $e->getMessage(), ['row' => $row]);
        }
    }

    /**
     * Import a single row of data for dry run (no database writes)
     */
    protected function importRowDryRun(array $row, ?int $defaultUserId): void
    {
        try {
            // Map YOURLS fields to our fields
            $mappedData = $this->mapYourlsFields($row, $defaultUserId);

            if (!$mappedData) {
                $this->stats['skipped']++;
                return;
            }

            // Check if URL already exists
            $existingUrl = Url::where('short_code', $mappedData['short_code'])->first();
            if ($existingUrl) {
                $this->stats['skipped']++;
                return;
            }

            // In dry run mode, just count what would be imported
            $this->stats['imported']++;

        } catch (\Exception $e) {
            $this->stats['errors']++;
            Log::error("Error processing row in dry run: " . $e->getMessage(), ['row' => $row]);
        }
    }

    /**
     * Map YOURLS fields to our model fields
     */
    protected function mapYourlsFields(array $row, ?int $defaultUserId): ?array
    {
        $mappedData = [
            'user_id' => $defaultUserId,
            'clicks' => 0,
        ];

        // Handle both associative arrays (from database) and indexed arrays (from SQL parsing)
        if (is_array($row) && !empty($row)) {
            // If it's an indexed array from SQL parsing, assume standard YOURLS order
            if (array_keys($row) === range(0, count($row) - 1)) {
                // Standard YOURLS order: keyword, url, title, timestamp, ip, clicks
                if (isset($row[0])) {
                    $mappedData['short_code'] = trim($row[0]);
                }
                // Only map as URL if it looks like a URL (starts with http)
                if (isset($row[1]) && (str_starts_with(trim($row[1]), 'http://') || str_starts_with(trim($row[1]), 'https://'))) {
                    $mappedData['original_url'] = trim($row[1]);
                }
                if (isset($row[5])) {
                    $mappedData['clicks'] = (int) trim($row[5]);
                }
                if (isset($row[3])) {
                    $mappedData['created_at'] = date('Y-m-d H:i:s', (int) trim($row[3]));
                    $mappedData['updated_at'] = date('Y-m-d H:i:s', (int) trim($row[3]));
                }
            } else {
                // Associative array from database
                if (isset($row['keyword'])) {
                    $mappedData['short_code'] = $row['keyword'];
                } elseif (isset($row['short_code'])) {
                    $mappedData['short_code'] = $row['short_code'];
                }

                if (isset($row['url'])) {
                    $mappedData['original_url'] = $row['url'];
                } elseif (isset($row['original_url'])) {
                    $mappedData['original_url'] = $row['original_url'];
                }

                if (isset($row['clicks'])) {
                    $mappedData['clicks'] = (int) $row['clicks'];
                }

                if (isset($row['timestamp'])) {
                    $mappedData['created_at'] = date('Y-m-d H:i:s', (int) $row['timestamp']);
                    $mappedData['updated_at'] = date('Y-m-d H:i:s', (int) $row['timestamp']);
                }
            }
        }

        // Check if we have the required fields
        if (!isset($mappedData['short_code']) || !isset($mappedData['original_url'])) {
            return null;
        }

        return $mappedData;
    }

    /**
     * Reset import statistics
     */
    protected function resetStats(): void
    {
        $this->stats = [
            'imported' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];
    }

    /**
     * Get import statistics
     */
    public function getStats(): array
    {
        return $this->stats;
    }
}
