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
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('type')->nullable()->after('id');
            $table->string('party_name')->nullable()->after('registration_no');
            $table->string('owner_name')->nullable()->after('party_name');
            $table->string('mobile_number')->nullable()->after('owner_name');

            // Fitness Date
            $table->date('fitness_initial')->nullable();
            $table->date('fitness_expiry')->nullable();

            // PUC Date
            $table->date('puc_initial')->nullable();
            $table->date('puc_expiry')->nullable();

            // Insurance
            $table->string('insurance_number')->nullable();
            $table->date('insurance_initial')->nullable();
            $table->date('insurance_expiry')->nullable();

            // National Permit
            $table->date('national_permit_initial')->nullable();
            $table->date('national_permit_expiry')->nullable();

            // State Permit
            $table->date('state_permit_initial')->nullable();
            $table->date('state_permit_expiry')->nullable();

            // GPS Details
            $table->date('gps_initial')->nullable();
            $table->date('gps_expiry')->nullable();

            // Tax Lifetime
            $table->boolean('tax_lifetime')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn([
                'type',
                'party_name',
                'owner_name',
                'mobile_number',
                'fitness_initial',
                'fitness_expiry',
                'puc_initial',
                'puc_expiry',
                'insurance_number',
                'insurance_initial',
                'insurance_expiry',
                'national_permit_initial',
                'national_permit_expiry',
                'state_permit_initial',
                'state_permit_expiry',
                'gps_initial',
                'gps_expiry',
                'tax_lifetime'
            ]);
        });
    }
};
