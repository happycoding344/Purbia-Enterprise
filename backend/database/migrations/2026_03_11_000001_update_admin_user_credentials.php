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
        // Update the admin user credentials
        DB::table('users')
            ->where('email', 'admin@purbia.com')
            ->orWhere('email', 'test@example.com')
            ->update([
                'email' => 'admin@purbiaenterprise.com',
                'name' => 'Purbia Admin',
                'password' => Hash::make('Purbia@!2026#'),
                'updated_at' => now(),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally restore old credentials (not recommended in production)
    }
};
