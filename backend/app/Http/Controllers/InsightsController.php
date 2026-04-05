<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class InsightsController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;
        $now       = Carbon::now();
        $today     = $now->toDateString();
        $insights  = [];

        // ── 1. Overdue tasks ──
        $overdueCount = Task::where('company_id', $companyId)
            ->whereNotIn('status', ['Done'])
            ->whereNotNull('due_date')
            ->where('due_date', '<', $today)
            ->count();

        if ($overdueCount > 0) {
            $insights[] = [
                'type'     => 'urgent',
                'title'    => "{$overdueCount} overdue " . ($overdueCount === 1 ? 'task' : 'tasks'),
                'message'  => $overdueCount === 1
                    ? 'You have 1 task past its due date. Address it now to keep momentum.'
                    : "You have {$overdueCount} tasks past their due date. Clear these to unblock your pipeline.",
                'priority' => 1,
                'action'   => ['label' => 'View Tasks', 'path' => '/tasks'],
            ];
        }

        // ── 2. Tasks due today ──
        $dueTodayCount = Task::where('company_id', $companyId)
            ->whereNotIn('status', ['Done'])
            ->where('due_date', $today)
            ->count();

        if ($dueTodayCount > 0) {
            $insights[] = [
                'type'     => 'warning',
                'title'    => "{$dueTodayCount} " . ($dueTodayCount === 1 ? 'task' : 'tasks') . " due today",
                'message'  => "Stay on top of your day — {$dueTodayCount} " . ($dueTodayCount === 1 ? 'task is' : 'tasks are') . " due by end of day.",
                'priority' => 2,
                'action'   => ['label' => 'View Tasks', 'path' => '/tasks'],
            ];
        }

        // ── 3. Leads in Proposal stage (close them) ──
        $proposalLeads = Lead::where('company_id', $companyId)
            ->where('status', 'Proposal')
            ->count();

        if ($proposalLeads > 0) {
            $insights[] = [
                'type'     => 'action',
                'title'    => "{$proposalLeads} " . ($proposalLeads === 1 ? 'lead' : 'leads') . " at Proposal stage",
                'message'  => $proposalLeads === 1
                    ? '1 lead is ready for closing. Follow up now to push them over the line.'
                    : "{$proposalLeads} leads are at the Proposal stage. These are your best conversion opportunities right now.",
                'priority' => 2,
                'action'   => ['label' => 'View Pipeline', 'path' => '/leads'],
            ];
        }

        // ── 4. New Leads with no tasks (no follow-up) ──
        $newLeadsNoTasks = Lead::where('company_id', $companyId)
            ->where('status', 'New Lead')
            ->whereDoesntHave('tasks')
            ->count();

        if ($newLeadsNoTasks > 0) {
            $insights[] = [
                'type'     => 'warning',
                'title'    => "{$newLeadsNoTasks} new " . ($newLeadsNoTasks === 1 ? 'lead' : 'leads') . " with no follow-up",
                'message'  => $newLeadsNoTasks === 1
                    ? '1 new lead has no tasks assigned. Create a follow-up task to keep things moving.'
                    : "{$newLeadsNoTasks} new leads have no tasks or follow-ups. Assign tasks to avoid losing them.",
                'priority' => 2,
                'action'   => ['label' => 'View Leads', 'path' => '/leads'],
            ];
        }

        // ── 5. Stale leads (no activity in 5+ days, not closed) ──
        $staleLeads = Lead::where('company_id', $companyId)
            ->whereNotIn('status', ['Closed'])
            ->get()
            ->filter(function ($lead) use ($now) {
                $lastActivity = Activity::where('related_type', 'lead')
                    ->where('related_id', $lead->id)
                    ->latest('created_at')
                    ->value('created_at');

                if (!$lastActivity) {
                    return $lead->created_at->lt($now->copy()->subDays(5));
                }

                return Carbon::parse($lastActivity)->lt($now->copy()->subDays(5));
            })
            ->count();

        if ($staleLeads > 0) {
            $insights[] = [
                'type'     => 'warning',
                'title'    => "{$staleLeads} " . ($staleLeads === 1 ? 'lead' : 'leads') . " going cold",
                'message'  => $staleLeads === 1
                    ? '1 lead has had no activity for 5+ days. Re-engage before they go cold.'
                    : "{$staleLeads} leads have had no activity for 5+ days. Reach out before they lose interest.",
                'priority' => 2,
                'action'   => ['label' => 'View Pipeline', 'path' => '/leads'],
            ];
        }

        // ── 6. Clients with no tasks (no onboarding) ──
        $clientsNoTasks = Client::where('company_id', $companyId)
            ->whereDoesntHave('tasks')
            ->count();

        if ($clientsNoTasks > 0) {
            $insights[] = [
                'type'     => 'info',
                'title'    => "{$clientsNoTasks} " . ($clientsNoTasks === 1 ? 'client' : 'clients') . " with no active tasks",
                'message'  => $clientsNoTasks === 1
                    ? '1 client has no tasks. Consider adding onboarding or follow-up tasks.'
                    : "{$clientsNoTasks} clients have no tasks assigned. Use tasks to track ongoing work and keep relationships strong.",
                'priority' => 3,
                'action'   => ['label' => 'View Clients', 'path' => '/clients'],
            ];
        }

        // ── 7. Pipeline conversion rate ──
        $totalLeads     = Lead::where('company_id', $companyId)->count();
        $closedLeads    = Lead::where('company_id', $companyId)->where('status', 'Closed')->count();
        $totalClients   = Client::where('company_id', $companyId)->count();

        if ($totalLeads >= 5 && $totalLeads > 0) {
            $conversionPct = round(($totalClients / $totalLeads) * 100);

            if ($conversionPct >= 30) {
                $insights[] = [
                    'type'     => 'success',
                    'title'    => "{$conversionPct}% pipeline conversion rate",
                    'message'  => "Great work! {$totalClients} of your {$totalLeads} leads have converted. Your pipeline is performing well.",
                    'priority' => 3,
                    'action'   => null,
                ];
            } elseif ($totalLeads >= 10 && $conversionPct < 15) {
                $insights[] = [
                    'type'     => 'info',
                    'title'    => "Low conversion rate ({$conversionPct}%)",
                    'message'  => "Only {$totalClients} of {$totalLeads} leads have converted. Consider reviewing your qualification process or follow-up cadence.",
                    'priority' => 3,
                    'action'   => ['label' => 'View Pipeline', 'path' => '/leads'],
                ];
            }
        }

        // ── 8. Tasks completed this week (positive reinforcement) ──
        $completedThisWeek = Task::where('company_id', $companyId)
            ->where('status', 'Done')
            ->where('updated_at', '>=', $now->copy()->startOfWeek())
            ->count();

        if ($completedThisWeek >= 3) {
            $insights[] = [
                'type'     => 'success',
                'title'    => "{$completedThisWeek} tasks completed this week",
                'message'  => "You're on a roll! {$completedThisWeek} tasks completed so far this week. Keep the momentum going.",
                'priority' => 3,
                'action'   => null,
            ];
        }

        // ── 9. Empty state (all good) ──
        if (empty($insights)) {
            $insights[] = [
                'type'     => 'success',
                'title'    => 'Everything looks great!',
                'message'  => 'No urgent actions right now. Your pipeline is healthy and tasks are on track.',
                'priority' => 3,
                'action'   => null,
            ];
        }

        // Sort by priority ascending (1 = most urgent first)
        usort($insights, fn($a, $b) => $a['priority'] <=> $b['priority']);

        return response()->json($insights);
    }
}
