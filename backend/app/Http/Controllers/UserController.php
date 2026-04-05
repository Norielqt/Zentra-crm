<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::where('company_id', $request->user()->company_id)
            ->select('id', 'name', 'email', 'role')
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Only admins can invite team members.');
        }

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name'       => $data['name'],
            'email'      => $data['email'],
            'password'   => Hash::make($data['password']),
            'company_id' => $request->user()->company_id,
            'role'       => 'member',
        ]);

    public function destroy(Request $request, User $user)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }
        if ($request->user()->id === $user->id) {
            abort(422, 'You cannot remove yourself.');
        }
        if ($user->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $user->delete();

        return response()->json(['message' => 'Member removed.']);
    }
}
