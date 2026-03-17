<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Change qty_display to string to accept values like '10 MT'
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE invoice_items MODIFY qty_display VARCHAR(255) NULL");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE invoice_items MODIFY qty_display DECIMAL(10,2) NULL");
    }
};
