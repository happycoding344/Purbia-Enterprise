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
        Schema::create('lrs', function (Blueprint $table) {
            $table->id();
            $table->string('financial_year');
            $table->date('lr_date');
            $table->foreignId('location_from_id')->constrained('locations');
            $table->string('lr_no')->unique();
            $table->foreignId('to_city_id')->constrained('cities');
            $table->foreignId('from_city_id')->constrained('cities');
            $table->foreignId('state_id')->constrained('states');
            $table->foreignId('delivery_place_id')->constrained('delivery_places');
            $table->string('tax_paid_by');
            $table->foreignId('billing_party_id')->constrained('billing_parties');
            $table->foreignId('consignor_id')->constrained('consignors');
            $table->foreignId('consignee_id')->constrained('consignees');
            $table->foreignId('vehicle_id')->constrained('vehicles');
            $table->string('receipt_type');
            $table->string('pref_no')->unique();

            // Part 2
            $table->string('manifest_no')->nullable();
            $table->date('manifest_date')->nullable();
            $table->dateTime('inward_time')->nullable();
            $table->dateTime('outward_time')->nullable();
            $table->decimal('distance', 10, 2)->nullable();
            $table->integer('delay_hours')->nullable();
            $table->decimal('detention_days', 10, 2)->nullable();
            $table->decimal('detention_rate', 15, 2)->nullable();
            $table->decimal('total_detention_amount', 15, 2)->nullable();

            // Part 4
            $table->decimal('gross_amount', 15, 2)->nullable();
            $table->decimal('gst_percent', 5, 2)->nullable();
            $table->decimal('sgst_amount', 15, 2)->nullable();
            $table->decimal('cgst_amount', 15, 2)->nullable();
            $table->decimal('total_amount', 15, 2)->nullable();

            $table->timestamps();
        });

        Schema::create('lr_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lr_id')->constrained('lrs')->onDelete('cascade');
            $table->string('item_name');
            $table->string('unit');
            $table->string('rate_type'); // Qty or Weight
            $table->decimal('qty', 10, 2)->nullable();
            $table->decimal('weight', 10, 2)->nullable();
            $table->decimal('rate', 15, 2)->nullable();
            $table->decimal('net_amount', 15, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('lr_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lr_id')->constrained('lrs')->onDelete('cascade');
            $table->string('file_path');
            $table->string('file_name');
            $table->bigInteger('file_size');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lr_attachments');
        Schema::dropIfExists('lr_items');
        Schema::dropIfExists('lrs');
    }
};
