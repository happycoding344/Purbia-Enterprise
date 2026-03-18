<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->string('manifest_no')->nullable()->after('lr_no');
            $table->string('vehicle_no')->nullable()->after('manifest_no');
            $table->date('lr_date')->nullable()->after('vehicle_no');
            $table->dateTime('inward_date')->nullable()->after('lr_date');
            $table->dateTime('outward_date')->nullable()->after('inward_date');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn(['manifest_no', 'vehicle_no', 'lr_date', 'inward_date', 'outward_date']);
        });
    }
};
