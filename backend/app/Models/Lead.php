<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'assigned_user_id',
        'name',
        'email',
        'phone',
        'source',
        'status',
        'notes',
        'deal_value',
    ];

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function client()
    {
        return $this->hasOne(Client::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function activities()
    {
        return $this->morphMany(Activity::class, 'related');
    }

    public function files()
    {
        return $this->morphMany(File::class, 'related');
    }
}
