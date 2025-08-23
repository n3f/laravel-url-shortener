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
        Schema::create('url_logs', function (Blueprint $table) {
            $table->id();
            $table->string('request_path', 255);
            $table->foreignId('url_id')->nullable()->constrained()->onDelete('set null');
            $table->text('target_url')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('referer', 2048)->nullable();
            $table->enum('status', ['success', 'not_found', 'error'])->default('success');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('url_logs');
    }
};
