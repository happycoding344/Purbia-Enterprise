<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->string('lr_date')->nullable()->change();
            $table->string('inward_date')->nullable()->change();
            $table->string('outward_date')->nullable()->change();
            $table->string('detention_qty_display')->nullable()->after('detention_amount');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            // Reverting back to dates (may cause data truncation if strings are arbitrary)
            $table->date('lr_date')->nullable()->change();
            $table->dateTime('inward_date')->nullable()->change();
            $table->dateTime('outward_date')->nullable()->change();
            $table->dropColumn('detention_qty_display');
        });
    }
};
