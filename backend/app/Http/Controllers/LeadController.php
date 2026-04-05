<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Lead;
use App\Services\ActivityService;
use App\Services\AutomationService;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $leads = Lead::where('company_id', $request->user()->company_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($leads);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'   => 'required|string|max:255',
            'email'  => 'nullable|email|max:255',
            'phone'  => 'nullable|string|max:50',
            'source' => 'nullable|string|max:100',
            'notes'  => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $data['company_id'] = $request->user()->company_id;
        $data['status'] = $data['status'] ?? 'New Lead';

        $lead = Lead::create($data);

        ActivityService::log('lead_created', "Lead created: {$lead->name}", 'lead', $lead->id);
        AutomationService::evaluate('lead_created', $lead);

        return response()->json($lead, 201);
    }

    public function show(Request $request, Lead $lead)
    {
        $this->authorizeCompany($request, $lead->company_id);

        return response()->json($lead->load(['tasks.assignedUser', 'files', 'client']));
    }

    public function update(Request $request, Lead $lead)
    {
        $this->authorizeCompany($request, $lead->company_id);

        $data = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'email'  => 'sometimes|nullable|email|max:255',
            'phone'  => 'sometimes|nullable|string|max:50',
            'source' => 'sometimes|nullable|string|max:100',
            'notes'  => 'sometimes|nullable|string',
            'status' => 'sometimes|string',
        ]);

        $oldStatus = $lead->status;
        $lead->update($data);

        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            ActivityService::log('status_updated', "Lead moved to {$lead->status}", 'lead', $lead->id);
            AutomationService::evaluate('lead_status_changed', $lead, ['new_status' => $lead->status]);
        }

        return response()->json($lead);
    }

    public function destroy(Request $request, Lead $lead)
    {
        $this->authorizeCompany($request, $lead->company_id);
        $lead->delete();

        return response()->json(['message' => 'Lead deleted.']);
    }

    public function convert(Request $request, Lead $lead)
    {
        $this->authorizeCompany($request, $lead->company_id);

        if ($lead->client) {
            return response()->json(['message' => 'Lead already converted.'], 422);
        }

        $client = Client::create([
            'company_id' => $lead->company_id,
            'lead_id'    => $lead->id,
            'name'       => $lead->name,
            'email'      => $lead->email,
            'phone'      => $lead->phone,
            'notes'      => $lead->notes,
        ]);

        $lead->update(['status' => 'Closed']);

        ActivityService::log('client_created', "Lead converted to client: {$client->name}", 'client', $client->id);
        AutomationService::evaluate('client_created', $client);

        return response()->json($client, 201);
    }

    private function authorizeCompany(Request $request, int $companyId): void
    {
        if ($request->user()->company_id !== $companyId) {
            abort(403);
        }
    }
}
