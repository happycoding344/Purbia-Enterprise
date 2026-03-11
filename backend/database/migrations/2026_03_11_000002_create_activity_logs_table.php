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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('action'); // created, updated, deleted
            $table->string('model_type'); // LR, Invoice, Vehicle, etc.
            $table->unsignedBigInteger('model_id')->nullable();
            $table->string('description'); // Human-readable description
            $table->json('metadata')->nullable(); // Additional context (old values, new values, etc.)
            $table->timestamps();

            // Index for faster queries
            $table->index(['model_type', 'model_id']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
