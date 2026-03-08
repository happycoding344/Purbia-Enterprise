<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'business_type')) {
                $table->string('business_type')->default('BEIL')->after('id');
            }
            if (!Schema::hasColumn('invoices', 'billing_party_id')) {
                $table->unsignedBigInteger('billing_party_id')->nullable();
                $table->foreign('billing_party_id')->references('id')->on('billing_parties')->onDelete('set null');
            }
            if (!Schema::hasColumn('invoices', 'delivery_address')) {
                $table->text('delivery_address')->nullable();
            }
            if (!Schema::hasColumn('invoices', 'state_id')) {
                $table->unsignedBigInteger('state_id')->nullable();
                $table->foreign('state_id')->references('id')->on('states')->onDelete('set null');
            }
            if (!Schema::hasColumn('invoices', 'state_code')) {
                $table->string('state_code')->nullable();
            }
            if (!Schema::hasColumn('invoices', 'gst_number')) {
                $table->string('gst_number')->nullable();
            }
            if (!Schema::hasColumn('invoices', 'payment_due_date')) {
                $table->date('payment_due_date')->nullable();
            }
            if (!Schema::hasColumn('invoices', 'subject')) {
                $table->string('subject')->nullable();
            }
            if (!Schema::hasColumn('invoices', 'hsn_code')) {
                $table->string('hsn_code')->nullable();
            }
            if (!Schema::hasColumn('invoices', 'amount')) {
                $table->decimal('amount', 15, 2)->default(0);
            }
            if (!Schema::hasColumn('invoices', 'gst_amount')) {
                $table->decimal('gst_amount', 15, 2)->default(0);
            }
            if (!Schema::hasColumn('invoices', 'sgst_amount')) {
                $table->decimal('sgst_amount', 15, 2)->default(0);
            }
            if (!Schema::hasColumn('invoices', 'cgst_amount')) {
                $table->decimal('cgst_amount', 15, 2)->default(0);
            }
            if (!Schema::hasColumn('invoices', 'total_amount')) {
                $table->decimal('total_amount', 15, 2)->default(0);
            }
            if (!Schema::hasColumn('invoices', 'total_amount_words')) {
                $table->string('total_amount_words')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Only drop if they exist
            $cols = ['billing_party_id', 'state_id'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('invoices', $col)) {
                    $table->dropForeign([$col]);
                }
            }
            $dropCols = [
                'business_type',
                'billing_party_id',
                'delivery_address',
                'state_id',
                'state_code',
                'gst_number',
                'payment_due_date',
                'subject',
                'hsn_code',
                'amount',
                'gst_amount',
                'sgst_amount',
                'cgst_amount',
                'total_amount',
                'total_amount_words'
            ];
            foreach ($dropCols as $col) {
                if (Schema::hasColumn('invoices', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
