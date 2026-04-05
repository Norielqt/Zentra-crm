<?php

namespace App\Services;

use App\Models\Activity;
use Illuminate\Support\Facades\Auth;

class ActivityService
{
    public static function log(
        string $type,
        string $message,
        string $relatedType = null,
        int $relatedId = null
    ): void {
        $user = Auth::user();

        Activity::create([
            'company_id'   => $user->company_id,
            'user_id'      => $user->id,
            'type'         => $type,
            'message'      => $message,
            'related_type' => $relatedType,
            'related_id'   => $relatedId,
            'created_at'   => now(),
        ]);
    }

    /**
     * Log an activity without an authenticated user (e.g. from scheduler or automation).
     */
    public static function logSystem(
        string $message,
        string $relatedType = null,
        int $relatedId = null,
        int $companyId = null
    ): void {
        Activity::create([
            'company_id'   => $companyId,
            'user_id'      => null,
            'type'         => 'automation',
            'message'      => $message,
            'related_type' => $relatedType,
            'related_id'   => $relatedId,
            'created_at'   => now(),
        ]);
    }
}
