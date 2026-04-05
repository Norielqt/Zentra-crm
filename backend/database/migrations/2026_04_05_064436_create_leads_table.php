<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// This file is intentionally a no-op to avoid conflict with 2026_04_05_064437_create_leads_table.php
return new class extends Migration
{
    public function up(): void
    {
        // Leads table is created in 2026_04_05_064437_create_leads_table.php
        // This duplicate file is kept only for migration history compatibility
        if (!Schema::hasTable('leads')) {
            Schema::create('leads', function (Blueprint $table) {
                $table->id();
                $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
                $table->string('name');
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->string('source')->nullable();
                $table->string('status')->default('New Lead');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        // Managed by 2026_04_05_064437_create_leads_table.php
    }
};
