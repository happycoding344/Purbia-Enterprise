<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'locations',
            'cities',
            'states',
            'delivery_places',
            'billing_parties',
            'consignors',
            'consignees',
        ];

        foreach ($tables as $table) {
            Schema::create($table, function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'locations',
            'cities',
            'states',
            'delivery_places',
            'billing_parties',
            'consignors',
            'consignees',
        ];

        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }
    }
};
