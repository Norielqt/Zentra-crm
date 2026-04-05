<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Lead;
use App\Models\Task;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $q         = trim($request->input('q', ''));
        $companyId = $request->user()->company_id;
        $user      = $request->user();

        if (strlen($q) < 2) {
            return response()->json(['leads' => [], 'clients' => [], 'tasks' => []]);
        }

        $like = "%{$q}%";

        $leadsQuery = Lead::where('company_id', $companyId)
            ->where(fn($query) => $query
                ->where('name', 'like', $like)
                ->orWhere('email', 'like', $like)
                ->orWhere('phone', 'like', $like)
            )->limit(5);

        if ($user->role === 'member') {
            $leadsQuery->where('assigned_user_id', $user->id);
        }

        $clientsQuery = Client::where('company_id', $companyId)
            ->where(fn($query) => $query
                ->where('name', 'like', $like)
                ->orWhere('email', 'like', $like)
                ->orWhere('phone', 'like', $like)
            )->limit(5);

        if ($user->role === 'member') {
            $clientsQuery->where('assigned_user_id', $user->id);
        }

        $tasksQuery = Task::where('company_id', $companyId)
            ->where(fn($query) => $query
                ->where('title', 'like', $like)
                ->orWhere('description', 'like', $like)
            )->with(['lead', 'client'])->limit(5);

        if ($user->role === 'member') {
            $tasksQuery->where('assigned_user_id', $user->id);
        }

        return response()->json([
            'leads'   => $leadsQuery->get(['id', 'name', 'email', 'status']),
            'clients' => $clientsQuery->get(['id', 'name', 'email']),
            'tasks'   => $tasksQuery->get(['id', 'title', 'status', 'lead_id', 'client_id']),
        ]);
    }
}
