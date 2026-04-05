<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Lead;
use App\Models\Task;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;

        $totalLeads = Lead::where('company_id', $companyId)->count();

        $leadsByStatus = Lead::where('company_id', $companyId)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $revenueByStatus = Lead::where('company_id', $companyId)
            ->whereNotNull('deal_value')
            ->selectRaw('status, SUM(deal_value) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $totalClients = Client::where('company_id', $companyId)->count();

        $totalRevenuePipeline = Lead::where('company_id', $companyId)
            ->whereNotIn('status', ['Closed'])
            ->sum('deal_value');

        $tasksPending = Task::where('company_id', $companyId)
            ->whereIn('status', ['To Do', 'In Progress'])
            ->count();

        $tasksCompleted = Task::where('company_id', $companyId)
            ->where('status', 'Done')
            ->count();

        return response()->json([
            'total_leads'            => $totalLeads,
            'leads_by_status'        => $leadsByStatus,
            'revenue_by_status'      => $revenueByStatus,
            'total_revenue_pipeline' => (float) $totalRevenuePipeline,
            'total_clients'          => $totalClients,
            'tasks_pending'          => $tasksPending,
            'tasks_completed'        => $tasksCompleted,
        ]);
    }
}
