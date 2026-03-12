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
        Schema::table('invoice_items', function (Blueprint $table) {
            // PI Industries specific fields
            $table->unsignedBigInteger('lr_id')->nullable()->after('invoice_id');
            $table->string('lr_no')->nullable()->after('lr_id');
            $table->string('distance_range')->nullable()->after('lr_no');
            $table->decimal('qty_display', 10, 2)->nullable()->after('qty'); // Display quantity for PI
            $table->decimal('actual_qty', 10, 2)->nullable()->after('qty_display'); // Actual quantity used in calculation
            $table->decimal('detention_days', 10, 2)->nullable()->after('total');
            $table->decimal('detention_rate', 15, 2)->nullable()->after('detention_days');
            $table->decimal('detention_amount', 15, 2)->nullable()->after('detention_rate');

            // Add foreign key for LR
            $table->foreign('lr_id')->references('id')->on('lrs')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropForeign(['lr_id']);
            $table->dropColumn([
                'lr_id',
                'lr_no',
                'distance_range',
                'qty_display',
                'actual_qty',
                'detention_days',
                'detention_rate',
                'detention_amount',
            ]);
        });
    }
};
