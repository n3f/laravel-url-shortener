<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\YourlsImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class YourlsImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_import_yourls_data_from_sql_string(): void
    {
        $user = User::factory()->create();

        $sql = "INSERT INTO `YOURLS_DB_TABLE` (`keyword`, `url`, `title`, `timestamp`, `ip`, `clicks`) VALUES
                ('abc123', 'https://example.com', 'Example Site', 1640995200, '127.0.0.1', 5),
                ('def456', 'https://google.com', 'Google', 1640995300, '127.0.0.1', 10);";

        $importService = new YourlsImportService();
        $stats = $importService->importFromSql($sql, $user->id);

        $this->assertEquals(2, $stats['imported']);
        $this->assertEquals(0, $stats['errors']);

        // Verify the URLs were created
        $this->assertDatabaseHas('urls', [
            'short_code' => 'abc123',
            'original_url' => 'https://example.com',
            'user_id' => $user->id,
            'clicks' => 5,
        ]);

        $this->assertDatabaseHas('urls', [
            'short_code' => 'def456',
            'original_url' => 'https://google.com',
            'user_id' => $user->id,
            'clicks' => 10,
        ]);
    }

    public function test_skips_duplicate_short_codes(): void
    {
        $user = User::factory()->create();

        $sql = "INSERT INTO `YOURLS_DB_TABLE` (`keyword`, `url`, `timestamp`) VALUES
                ('abc123', 'https://example.com', 1640995200);";

        $importService = new YourlsImportService();

        // Import the same data twice
        $stats1 = $importService->importFromSql($sql, $user->id);
        $stats2 = $importService->importFromSql($sql, $user->id);

        $this->assertEquals(1, $stats1['imported']);
        $this->assertEquals(0, $stats1['skipped']);

        $this->assertEquals(0, $stats2['imported']);
        $this->assertEquals(1, $stats2['skipped']);
    }

    public function test_handles_missing_required_fields(): void
    {
        $user = User::factory()->create();

        $sql = "INSERT INTO `YOURLS_DB_TABLE` (`keyword`, `title`, `timestamp`) VALUES
                ('abc123', 'Example Site', 1640995200);";

        $importService = new YourlsImportService();
        $stats = $importService->importFromSql($sql, $user->id);

        $this->assertEquals(0, $stats['imported']);
        $this->assertEquals(1, $stats['skipped']);
    }
}
