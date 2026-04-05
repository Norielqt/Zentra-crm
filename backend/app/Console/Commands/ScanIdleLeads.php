<?php

namespace App\Console\Commands;

use App\Models\Activity;
use App\Models\Lead;
use App\Services\ActivityService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ScanIdleLeads extends Command
{
    protected $signature   = 'crm:scan-idle-leads {--days=7 : Days of inactivity before flagging}';
    protected $description = 'Flag leads with no activity in the last N days';

    public function handle(): void
    {
        $days = (int) $this->option('days');

        // Find open leads where no activity has been logged in the last N days
        $openLeads = Lead::whereNotIn('status', ['Closed'])->get();

        $flagged = 0;

        foreach ($openLeads as $lead) {
            $lastActivity = Activity::where('related_type', 'lead')
                ->where('related_id', $lead->id)
                ->latest()
                ->first();

            $cutoff = now()->subDays($days);

            // No activity at all, or last activity older than cutoff
            if (!$lastActivity || $lastActivity->created_at->lt($cutoff)) {
                // Only log once per day (avoid duplicate idle alerts)
                $alreadyLogged = Activity::where('related_type', 'lead')
                    ->where('related_id', $lead->id)
                    ->where('type', 'idle_alert')
                    ->where('created_at', '>=', now()->startOfDay())
                    ->exists();

                if (!$alreadyLogged) {
                    ActivityService::logSystem(
                        "Lead \"{$lead->name}\" has had no activity for {$days}+ days.",
                        'lead',
                        $lead->id,
                        $lead->company_id
                    );

                    // Override type to idle_alert
                    Activity::where('related_type', 'lead')
                        ->where('related_id', $lead->id)
                        ->where('type', 'automation')
                        ->latest()
                        ->first()
                        ?->update(['type' => 'idle_alert']);

                    $flagged++;
                }
            }
        }

        $this->info("Idle lead scan complete. Flagged {$flagged} lead(s).");
    }
}
