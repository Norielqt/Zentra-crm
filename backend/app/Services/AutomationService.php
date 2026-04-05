<?php

namespace App\Services;

use App\Models\Automation;
use App\Models\Task;

class AutomationService
{
    /**
     * Evaluate all active automation rules for a given event.
     *
     * @param string $event     e.g. 'lead_status_changed'
     * @param mixed  $model     The Eloquent model that triggered the event
     * @param array  $context   Extra data (e.g. ['new_status' => 'Proposal'])
     */
    public static function evaluate(string $event, $model, array $context = []): void
    {
        $rules = Automation::where('company_id', $model->company_id)
            ->where('trigger_event', $event)
            ->where('is_active', true)
            ->get();

        foreach ($rules as $rule) {
            if (!self::conditionMatches($rule, $context)) {
                continue;
            }

            self::executeAction($rule, $model);

            $rule->increment('run_count');
            $rule->update(['last_run_at' => now()]);
        }
    }

    private static function conditionMatches(Automation $rule, array $context): bool
    {
        // No specific value required → always matches
        if (empty($rule->trigger_value)) {
            return true;
        }

        // For status_changed events, match against the new status
        if (isset($context['new_status'])) {
            return $rule->trigger_value === $context['new_status'];
        }

        return true;
    }

    private static function executeAction(Automation $rule, $model): void
    {
        $config = $rule->action_config;

        switch ($rule->action_type) {
            case 'create_task':
                self::createTask($rule, $model, $config);
                break;

            case 'log_note':
                $message = $config['message'] ?? "Automation triggered: {$rule->name}";
                ActivityService::logSystem($message, self::modelType($model), $model->id, $model->company_id);
                break;

            case 'update_lead_status':
                if ($model instanceof \App\Models\Lead && !empty($config['status'])) {
                    $model->update(['status' => $config['status']]);
                    ActivityService::logSystem(
                        "Lead auto-moved to {$config['status']} by automation: {$rule->name}",
                        'lead',
                        $model->id,
                        $model->company_id
                    );
                }
                break;
        }
    }

    private static function createTask(Automation $rule, $model, array $config): void
    {
        $title = $config['title'] ?? "Task from automation: {$rule->name}";
        $dueDays = isset($config['due_days']) ? (int) $config['due_days'] : null;

        $taskData = [
            'company_id'  => $model->company_id,
            'title'       => $title,
            'description' => $config['description'] ?? '',
            'status'      => 'To Do',
            'due_date'    => $dueDays ? now()->addDays($dueDays)->toDateString() : null,
        ];

        // Link to the triggering model
        if ($model instanceof \App\Models\Lead) {
            $taskData['lead_id'] = $model->id;
        } elseif ($model instanceof \App\Models\Client) {
            $taskData['client_id'] = $model->id;
        }

        $task = Task::create($taskData);

        ActivityService::logSystem(
            "Auto-created task \"{$task->title}\" by automation: {$rule->name}",
            self::modelType($model),
            $model->id,
            $model->company_id
        );
    }

    private static function modelType($model): string
    {
        if ($model instanceof \App\Models\Lead) return 'lead';
        if ($model instanceof \App\Models\Client) return 'client';
        if ($model instanceof \App\Models\Task) return 'task';
        return 'unknown';
    }
}
