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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->string('invoice_no')->unique();
            $table->date('invoice_date');
            $table->string('po_number')->nullable();
            $table->string('state_name')->nullable();
            $table->string('state_code')->nullable();
            $table->date('due_date')->nullable();

            $table->string('purbia_gstin')->nullable();
            $table->string('purbia_pan')->nullable();

            $table->string('bank_name')->nullable();
            $table->string('branch')->nullable();
            $table->string('ifsc')->nullable();
            $table->string('account_number')->nullable();

            $table->decimal('subtotal_amount', 15, 2)->default(0);
            $table->decimal('cgst_amount', 15, 2)->default(0);
            $table->decimal('sgst_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
