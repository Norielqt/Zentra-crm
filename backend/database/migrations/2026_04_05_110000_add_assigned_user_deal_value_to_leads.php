<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('assigned_user_id')->nullable()->after('company_id')->constrained('users')->nullOnDelete();
            $table->decimal('deal_value', 10, 2)->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_user_id');
            $table->dropColumn('deal_value');
        });
    }
};
