<?php

namespace App\Http\Controllers;

use App\Models\Automation;
use Illuminate\Http\Request;

class AutomationController extends Controller
{
    public function index(Request $request)
    {
        $automations = Automation::where('company_id', $request->user()->company_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($automations);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'trigger_event' => 'required|in:lead_created,lead_status_changed,client_created,task_overdue',
            'trigger_value' => 'nullable|string|max:100',
            'action_type'   => 'required|in:create_task,log_note,update_lead_status',
            'action_config' => 'required|array',
        ]);

        $data['company_id'] = $request->user()->company_id;

        $automation = Automation::create($data);

        return response()->json($automation, 201);
    }

    public function update(Request $request, Automation $automation)
    {
        $this->authorizeCompany($request, $automation->company_id);

        $data = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'trigger_event' => 'sometimes|in:lead_created,lead_status_changed,client_created,task_overdue',
            'trigger_value' => 'sometimes|nullable|string|max:100',
            'action_type'   => 'sometimes|in:create_task,log_note,update_lead_status',
            'action_config' => 'sometimes|array',
            'is_active'     => 'sometimes|boolean',
        ]);

        $automation->update($data);

        return response()->json($automation);
    }

    public function destroy(Request $request, Automation $automation)
    {
        $this->authorizeCompany($request, $automation->company_id);
        $automation->delete();

        return response()->json(['message' => 'Automation deleted.']);
    }

    private function authorizeCompany(Request $request, int $companyId): void
    {
        if ($request->user()->company_id !== $companyId) {
            abort(403);
        }
    }
}
