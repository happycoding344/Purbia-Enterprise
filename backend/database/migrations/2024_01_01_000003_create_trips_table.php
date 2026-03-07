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
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->nullable()->constrained()->onDelete('set null');

            $table->dateTime('inward_date')->nullable();
            $table->dateTime('outward_date')->nullable();

            $table->string('company')->nullable();
            $table->string('location')->nullable();
            $table->string('truck_no')->nullable();
            $table->string('lr_no')->nullable();
            $table->text('manifest_details')->nullable();

            $table->decimal('distance', 10, 2)->default(0);
            $table->decimal('rate', 10, 2)->default(0);

            $table->decimal('detention', 10, 2)->default(0);
            $table->decimal('detention_rate', 10, 2)->default(0);

            $table->decimal('total', 15, 2)->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
