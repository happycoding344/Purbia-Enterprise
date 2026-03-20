<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lr_items', function (Blueprint $table) {
            $table->string('actual_qty')->nullable()->after('net_amount');
        });
    }

    public function down(): void
    {
        Schema::table('lr_items', function (Blueprint $table) {
            $table->dropColumn('actual_qty');
        });
    }
};
