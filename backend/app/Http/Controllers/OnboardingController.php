<?php

namespace App\Http\Controllers;

use App\Models\Automation;
use App\Models\Lead;
use App\Models\Task;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;

        $hasLead       = Lead::where('company_id', $companyId)->exists();
        $hasTask       = Task::where('company_id', $companyId)->exists();
        $hasAutomation = Automation::where('company_id', $companyId)->exists();

        $steps = [
            [
                'key'         => 'add_lead',
                'label'       => 'Add your first lead',
                'description' => 'Start filling your pipeline with a potential deal.',
                'done'        => $hasLead,
                'action'      => ['label' => 'Add Lead', 'path' => '/leads'],
            ],
            [
                'key'         => 'create_task',
                'label'       => 'Create a task',
                'description' => 'Stay organized by assigning follow-up tasks.',
                'done'        => $hasTask,
                'action'      => ['label' => 'Go to Tasks', 'path' => '/tasks'],
            ],
            [
                'key'         => 'setup_automation',
                'label'       => 'Set up an automation',
                'description' => 'Let Zentra work for you — automate repetitive actions.',
                'done'        => $hasAutomation,
                'action'      => ['label' => 'Create Automation', 'path' => '/automations'],
            ],
        ];

        $allDone = collect($steps)->every(fn($s) => $s['done']);

        return response()->json([
            'steps'    => $steps,
            'all_done' => $allDone,
        ]);
    }
}
