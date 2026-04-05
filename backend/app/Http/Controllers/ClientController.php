<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Services\ActivityService;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Client::where('company_id', $user->company_id)
            ->with('lead')
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
            'notes'            => 'nullable|string',
            'lead_id'          => 'nullable|exists:leads,id',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $user = $request->user();
        $data['company_id'] = $user->company_id;
        if ($user->role === 'member') {
            $data['assigned_user_id'] = $user->id;
        }
        $client = Client::create($data);

        ActivityService::log('client_created', "Client created: {$client->name}", 'client', $client->id);

        return response()->json($client, 201);
    }

    public function show(Request $request, Client $client)
    {
        $this->authorizeCompany($request, $client->company_id);

        return response()->json($client->load(['lead', 'tasks.assignedUser', 'files']));
    }

    public function update(Request $request, Client $client)
    {
        $this->authorizeCompany($request, $client->company_id);

        $data = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'email' => 'sometimes|nullable|email|max:255',
            'phone' => 'sometimes|nullable|string|max:50',
            'notes' => 'sometimes|nullable|string',
        ]);

        $client->update($data);

        return response()->json($client);
    }

    public function destroy(Request $request, Client $client)
    {
        $this->authorizeCompany($request, $client->company_id);
        $client->delete();

        return response()->json(['message' => 'Client deleted.']);
    }

    private function authorizeCompany(Request $request, int $companyId): void
    {
        if ($request->user()->company_id !== $companyId) {
            abort(403);
        }
    }
}
