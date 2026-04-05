<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Services\ActivityService;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Task::where('company_id', $user->company_id)
            ->with(['assignedUser', 'lead', 'client']);

        if ($request->has('lead_id')) {
            $query->where('lead_id', $request->lead_id);
        } elseif ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        } elseif ($user->role === 'member') {
            // Members only see their own assigned tasks on the main tasks page
            $query->where('assigned_user_id', $user->id);
        }

        return response()->json($query->orderBy('due_date')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'status'           => 'nullable|string',
            'due_date'         => 'nullable|date',
            'assigned_user_id' => 'nullable|exists:users,id',
            'lead_id'          => 'nullable|exists:leads,id',
            'client_id'        => 'nullable|exists:clients,id',
        ]);

        $data['company_id'] = $request->user()->company_id;
        $data['status'] = $data['status'] ?? 'To Do';

        $task = Task::create($data);

        ActivityService::log('task_created', "Task created: {$task->title}", 'task', $task->id);

        if ($task->assigned_user_id) {
            ActivityService::log('task_assigned', "Task assigned: {$task->title}", 'task', $task->id);
        }

        return response()->json($task->load(['assignedUser', 'lead', 'client']), 201);
    }

    public function show(Request $request, Task $task)
    {
        $this->authorizeCompany($request, $task->company_id);

        return response()->json($task->load(['assignedUser', 'lead', 'client']));
    }

    public function update(Request $request, Task $task)
    {
        $this->authorizeCompany($request, $task->company_id);

        $data = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'description'      => 'sometimes|nullable|string',
            'status'           => 'sometimes|string',
            'due_date'         => 'sometimes|nullable|date',
            'assigned_user_id' => 'sometimes|nullable|exists:users,id',
            'lead_id'          => 'sometimes|nullable|exists:leads,id',
            'client_id'        => 'sometimes|nullable|exists:clients,id',
        ]);

        $oldStatus = $task->status;
        $task->update($data);

        if (isset($data['status']) && $data['status'] === 'Done' && $oldStatus !== 'Done') {
            ActivityService::log('task_completed', "Task completed: {$task->title}", 'task', $task->id);
        }

        return response()->json($task->load(['assignedUser', 'lead', 'client']));
    }

    public function destroy(Request $request, Task $task)
    {
        $this->authorizeCompany($request, $task->company_id);
        $task->delete();

        return response()->json(['message' => 'Task deleted.']);
    }

    private function authorizeCompany(Request $request, int $companyId): void
    {
        if ($request->user()->company_id !== $companyId) {
            abort(403);
        }
    }
}
