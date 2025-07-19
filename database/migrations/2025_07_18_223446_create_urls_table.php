<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('urls', function (Blueprint $table) {
            $table->id();
            $table->text('original_url'); // Store the full original URL
            $table->string('short_code', 10)->unique(); // Short code for redirection
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade'); // Optional user ownership
            $table->integer('clicks')->default(0); // Basic analytics
            $table->timestamp('expires_at')->nullable(); // For future expiration feature
            $table->timestamps();

            // Indexes for performance
            $table->index('short_code');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('urls');
    }
};
