<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UrlLog extends Model
{
    protected $fillable = [
        'request_path',
        'url_id',
        'target_url',
        'ip_address',
        'user_agent',
        'referer',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'status' => 'string',
    ];

    public const STATUS_SUCCESS = 'success';
    public const STATUS_NOT_FOUND = 'not_found';
    public const STATUS_ERROR = 'error';

    public function url(): BelongsTo
    {
        return $this->belongsTo(Url::class);
    }
}
