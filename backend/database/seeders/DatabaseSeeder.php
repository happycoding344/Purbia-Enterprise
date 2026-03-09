<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@purbiaenterprise.com'],
            [
                'name' => 'Purbia Admin',
                'password' => Hash::make('Purbia@!2026#'),
            ]
        );

        $this->call(MasterDataSeeder::class);
    }
}
