<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Url extends Model
{
    use HasFactory;

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
    public static function generateShortCode(): string
    {
        $charset = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
        $length = 6;

        do {
            $code = '';
            for ($i = 0; $i < $length; $i++) {
                $code .= $charset[random_int(0, strlen($charset) - 1)];
            }
        } while (self::where('short_code', $code)->exists());

        return $code;
    }

    /**
     * Get the full short URL.
     */
    public function getShortUrlAttribute(): string
    {
        return url($this->short_code);
    }

    /**
     * Increment the click count.
     */
    public function incrementClicks(): void
    {
        $this->increment('clicks');
    }
}
