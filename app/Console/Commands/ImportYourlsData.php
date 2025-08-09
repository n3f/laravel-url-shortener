<?php

namespace App\Console\Commands;

use App\Services\YourlsImportService;
use Illuminate\Console\Command;

class ImportYourlsData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
        protected $signature = 'import:yourls
                             {--file= : Path to SQL file to import}
                             {--user-id= : Default user ID to assign imported URLs to}
                             {--table= : Table name to look for in SQL (default: auto-detect)}
                             {--dry-run : Show what would be imported without actually importing}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import YOURLS data from SQL file';

    /**
     * Execute the console command.
     */
    public function handle(YourlsImportService $importService): int
    {
        $filePath = $this->option('file');
        $userId = $this->option('user-id');
        $tableName = $this->option('table');
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No data will be imported');
        }

        try {
            if ($filePath) {
                $this->info("Importing from SQL file: {$filePath}");
                if ($tableName) {
                    $this->info("Using table name: {$tableName}");
                }
                $stats = $importService->importFromSqlFile($filePath, $userId, $tableName, $dryRun);
            } else {
                $this->error('Please provide --file option with path to SQL file');
                return 1;
            }

            $this->displayResults($stats);

        } catch (\Exception $e) {
            $this->error("Import failed: " . $e->getMessage());
            return 1;
        }

        return 0;
    }

    /**
     * Display import results
     */
    protected function displayResults(array $stats): void
    {
        $this->newLine();
        $this->info('Import completed!');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Imported', $stats['imported']],
                ['Skipped', $stats['skipped']],
                ['Errors', $stats['errors']],
            ]
        );
    }
}
