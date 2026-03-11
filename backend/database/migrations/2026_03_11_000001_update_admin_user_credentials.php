<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get the hashed password
        $hashedPassword = Hash::make('Purbia@!2026#');
        $now = now()->format('Y-m-d H:i:s');

        // Use raw SQL for more control
        DB::statement("
            UPDATE users
            SET email = 'admin@purbiaenterprise.com',
                name = 'Purbia Admin',
                password = ?,
                updated_at = ?
            WHERE id = 1
        ", [$hashedPassword, $now]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally restore old credentials (not recommended in production)
    }
};
