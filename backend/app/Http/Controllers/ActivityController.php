<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = Activity::where('company_id', $request->user()->company_id)
            ->with('user')
            ->orderBy('created_at', 'desc');

        if ($request->has('related_type') && $request->has('related_id')) {
            $query->where('related_type', $request->related_type)
                ->where('related_id', $request->related_id);
        }

        $activities = $query->limit(100)->get();

        return response()->json($activities);
    }
}
