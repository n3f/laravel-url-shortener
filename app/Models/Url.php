<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Sqids\Sqids;

class Url extends Model
{
    use HasFactory;

    const CHARSET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

    protected $fillable = [
        'original_url',
        'short_code',
        'user_id',
        'clicks',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'clicks' => 'integer',
    ];

    protected $appends = [
        'short_url',
    ];

    /**
     * Get the user that owns the URL.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate a unique short code.
     */
    public function generateShortCode(): string
    {
        $sqids = new Sqids( self::CHARSET );
        return $sqids->encode( [$this->id] );
    }

    /**
     * Get the full short URL.
     */
    protected function shortUrl(): Attribute
    {
        return Attribute::get(fn () => url($this->short_code));
    }

    /**
     * Increment the click count.
     */
    public function incrementClicks(): void
    {
        $this->increment('clicks');
    }
}
