<?php

namespace App\Console\Commands;

use App\Models\Automation;
use App\Models\Task;
use App\Services\ActivityService;
use Illuminate\Console\Command;

class ScanOverdueTasks extends Command
{
    protected $signature   = 'crm:scan-overdue-tasks';
    protected $description = 'Flag overdue tasks and fire task_overdue automation rules';

    public function handle(): void
    {
        $overdueTasks = Task::where('status', '!=', 'Done')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->get();

        $this->info("Found {$overdueTasks->count()} overdue task(s).");

        foreach ($overdueTasks as $task) {
            // Log an activity entry for the overdue task
            ActivityService::logSystem(
                "Task overdue: \"{$task->title}\"",
                'task',
                $task->id,
                $task->company_id
            );

            // Fire task_overdue automation rules
            $rules = Automation::where('company_id', $task->company_id)
                ->where('trigger_event', 'task_overdue')
                ->where('is_active', true)
                ->get();

            foreach ($rules as $rule) {
                \App\Services\AutomationService::evaluate('task_overdue', $task);
                $rule->increment('run_count');
                $rule->update(['last_run_at' => now()]);
            }
        }

        $this->info('Overdue task scan complete.');
    }
}
