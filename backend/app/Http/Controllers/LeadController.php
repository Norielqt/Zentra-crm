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
        $user  = $request->user();
        $query = Lead::where('company_id', $user->company_id)
            ->with('assignedUser')
            ->orderBy('created_at', 'desc');

        if ($user->role === 'member') {
            $query->where('assigned_user_id', $user->id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'email'            => 'nullable|email|max:255',
            'phone'            => 'nullable|string|max:50',
            'source'           => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
            'status'           => 'nullable|string',
            'assigned_user_id' => 'nullable|exists:users,id',
            'deal_value'       => 'nullable|numeric|min:0',
        ]);

        $user = $request->user();
        $data['company_id'] = $user->company_id;
        $data['status'] = $data['status'] ?? 'New Lead';

        // Members are always assigned to themselves
        if ($user->role === 'member') {
            $data['assigned_user_id'] = $user->id;
        }

        $lead = Lead::create($data);

        ActivityService::log('lead_created', "Lead created: {$lead->name}", 'lead', $lead->id);
        AutomationService::evaluate('lead_created', $lead);

        return response()->json($lead->load('assignedUser'), 201);
    }

    public function show(Request $request, Lead $lead)
    {
        $this->authorizeCompany($request, $lead->company_id);
        $this->authorizeMember($request, $lead);

        return response()->json($lead->load(['assignedUser', 'tasks.assignedUser', 'files', 'client']));
    }

    public function update(Request $request, Lead $lead)
    {
        $this->authorizeCompany($request, $lead->company_id);
        $this->authorizeMember($request, $lead);

        $data = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'email'            => 'sometimes|nullable|email|max:255',
            'phone'            => 'sometimes|nullable|string|max:50',
            'source'           => 'sometimes|nullable|string|max:100',
            'notes'            => 'sometimes|nullable|string',
            'status'           => 'sometimes|string',
            'assigned_user_id' => 'sometimes|nullable|exists:users,id',
            'deal_value'       => 'sometimes|nullable|numeric|min:0',
        ]);

        // Members cannot reassign leads
        if ($request->user()->role === 'member') {
            unset($data['assigned_user_id']);
        }

        $oldStatus = $lead->status;
        $lead->update($data);

        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            ActivityService::log('status_updated', "Lead moved to {$lead->status}", 'lead', $lead->id);
            AutomationService::evaluate('lead_status_changed', $lead, ['new_status' => $lead->status]);
        }

        return response()->json($lead->load('assignedUser'));
    }

    public function destroy(Request $request, Lead $lead)
    {
        $this->authorizeCompany($request, $lead->company_id);
        $this->authorizeMember($request, $lead);
        $lead->delete();

        return response()->json(['message' => 'Lead deleted.']);
    }

    public function convert(Request $request, Lead $lead)
    {
        $this->authorizeCompany($request, $lead->company_id);
        $this->authorizeMember($request, $lead);

        if ($lead->client) {
            return response()->json(['message' => 'Lead already converted.'], 422);
        }

        $client = Client::create([
            'company_id'       => $lead->company_id,
            'assigned_user_id' => $lead->assigned_user_id,
            'lead_id'          => $lead->id,
            'name'             => $lead->name,
            'email'            => $lead->email,
            'phone'            => $lead->phone,
            'notes'            => $lead->notes,
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

    private function authorizeMember(Request $request, Lead $lead): void
    {
        $user = $request->user();
        if ($user->role === 'member' && $lead->assigned_user_id !== $user->id) {
            abort(403);
        }
    }

    public function exportCsv(Request $request)
    {
        $user  = $request->user();
        $query = Lead::where('company_id', $user->company_id)
            ->with('assignedUser')
            ->orderBy('created_at', 'desc');

        if ($user->role === 'member') {
            $query->where('assigned_user_id', $user->id);
        }

        $leads = $query->get();

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="leads.csv"',
        ];

        $callback = function () use ($leads) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Name', 'Email', 'Phone', 'Source', 'Status', 'Deal Value', 'Assigned To', 'Created']);
            foreach ($leads as $lead) {
                fputcsv($handle, [
                    $lead->id,
                    $lead->name,
                    $lead->email ?? '',
                    $lead->phone ?? '',
                    $lead->source ?? '',
                    $lead->status,
                    $lead->deal_value ?? '',
                    $lead->assignedUser?->name ?? '',
                    $lead->created_at->toDateString(),
                ]);
            }
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
