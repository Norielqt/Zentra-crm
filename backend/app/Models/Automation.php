<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Automation extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'trigger_event',
        'trigger_value',
        'action_type',
        'action_config',
        'is_active',
        'run_count',
        'last_run_at',
    ];

    protected $casts = [
        'action_config' => 'array',
        'is_active'     => 'boolean',
        'last_run_at'   => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
