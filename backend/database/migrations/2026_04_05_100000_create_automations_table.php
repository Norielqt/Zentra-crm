<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('automations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');

            // Trigger: what event fires this rule
            $table->enum('trigger_event', [
                'lead_created',
                'lead_status_changed',
                'client_created',
                'task_overdue',
            ]);
            // Optional: the specific value to match (e.g. "Proposal" for status_changed)
            $table->string('trigger_value')->nullable();

            // Action: what to do
            $table->enum('action_type', [
                'create_task',
                'log_note',
                'update_lead_status',
            ]);
            // JSON config for the action
            $table->json('action_config');

            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('run_count')->default(0);
            $table->timestamp('last_run_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('automations');
    }
};
