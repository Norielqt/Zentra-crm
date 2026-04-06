<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    private const STAGES = ['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Closed'];

    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;

        // Count + revenue per stage
        $byStage = Lead::where('company_id', $companyId)
            ->selectRaw('status, count(*) as count, COALESCE(SUM(deal_value), 0) as revenue')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $totalLeads = (int) $byStage->sum('count');

        // Pipeline funnel: count + revenue per stage
        $pipelineFunnel = collect(self::STAGES)->map(fn ($s) => [
            'stage'   => $s,
            'count'   => (int) ($byStage->get($s)?->count ?? 0),
            'revenue' => (float) ($byStage->get($s)?->revenue ?? 0),
        ]);

        // Conversion funnel: % of leads that reached each stage or beyond
        $conversionFunnel = collect(self::STAGES)->map(function ($stage) use ($byStage, $totalLeads) {
            $stageIndex  = array_search($stage, self::STAGES);
            $laterStages = array_slice(self::STAGES, $stageIndex);
            $count       = collect($laterStages)->sum(fn ($s) => (int) ($byStage->get($s)?->count ?? 0));

            return [
                'stage' => $stage,
                'count' => $count,
                'rate'  => $totalLeads > 0 ? round($count / $totalLeads * 100, 1) : 0,
            ];
        });

        // Revenue by month (last 6 months)
        $revenueByMonth = Lead::where('company_id', $companyId)
            ->whereNotNull('deal_value')
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
            ->selectRaw("DATE_FORMAT(created_at, '%b %Y') as month, DATE_FORMAT(created_at, '%Y-%m') as sort_key, SUM(deal_value) as revenue, COUNT(*) as count")
            ->groupBy('month', 'sort_key')
            ->orderBy('sort_key')
            ->get()
            ->map(fn ($r) => [
                'month'   => $r->month,
                'revenue' => (float) $r->revenue,
                'count'   => (int) $r->count,
            ])
            ->values();

        // Leads by source
        $leadsBySource = Lead::where('company_id', $companyId)
            ->selectRaw("COALESCE(NULLIF(source, ''), 'Unknown') as source, count(*) as count, COALESCE(SUM(deal_value), 0) as revenue")
            ->groupBy('source')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => [
                'source'  => $r->source,
                'count'   => (int) $r->count,
                'revenue' => (float) $r->revenue,
            ])
            ->values();

        // Summary KPIs
        $closedRevenue = (float) ($byStage->get('Closed')?->revenue ?? 0);
        $closedCount   = (int) ($byStage->get('Closed')?->count ?? 0);
        $allRevenue    = (float) $byStage->sum('revenue');
        $avgDeal       = $totalLeads > 0 ? round($allRevenue / $totalLeads) : 0;

        return response()->json([
            'total_leads'       => $totalLeads,
            'total_revenue'     => $allRevenue,
            'closed_revenue'    => $closedRevenue,
            'closed_count'      => $closedCount,
            'avg_deal_value'    => $avgDeal,
            'pipeline_funnel'   => $pipelineFunnel,
            'conversion_funnel' => $conversionFunnel,
            'revenue_by_month'  => $revenueByMonth,
            'leads_by_source'   => $leadsBySource,
        ]);
    }
}
