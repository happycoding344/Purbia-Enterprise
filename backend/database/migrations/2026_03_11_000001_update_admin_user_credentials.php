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
        // First, delete any duplicate admin@purbiaenterprise.com if it exists
        DB::table('users')
            ->where('email', 'admin@purbiaenterprise.com')
            ->delete();

        // Then update the old admin user credentials
        DB::table('users')
            ->where(function($query) {
                $query->where('email', 'admin@purbia.com')
                      ->orWhere('email', 'test@example.com');
            })
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
