<?php

namespace App\Http\Controllers;

use App\Models\Url;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class UrlController extends Controller
{
    /**
     * Create a new short URL.
     */
    public function shorten(Request $request): JsonResponse
    {
        $request->validate([
            'url' => 'required|url|max:2048',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $data = [
            'original_url' => $request->url,
            'short_code' => Url::generateShortCode(),
            'user_id' => Auth::check() ? Auth::user()->id : null,
        ];

        // Add expiration if provided
        if ($request->filled('expires_at')) {
            $data['expires_at'] = Carbon::parse($request->expires_at);
        }

        $url = Url::create($data);

        return response()->json([
            'short_url' => $url->short_url,
            'code' => $url->short_code,
            'original_url' => $url->original_url,
            'expires_at' => $url->expires_at?->toISOString(),
        ], 201);
    }

    /**
     * Redirect short code to original URL.
     */
    public function redirect(string $code, Request $request): RedirectResponse
    {
        $url = Url::where('short_code', $code)->first();

        if (!$url) {
            // Return 404 for API clients (curl, etc.) and redirect for browsers
            if ($request->expectsJson() || $request->header('User-Agent') === 'curl') {
                abort(404, 'URL not found');
            }

            return redirect()->route('home')->with('error', 'URL not found');
        }

        // Check if URL has expired
        if ($url->expires_at && $url->expires_at->isPast()) {
            if ($request->expectsJson() || $request->header('User-Agent') === 'curl') {
                abort(410, 'URL has expired');
            }

            return redirect()->route('home')->with('error', 'URL has expired');
        }

        // Increment click count
        $url->incrementClicks();

        return redirect($url->original_url);
    }

    /**
     * Get URL statistics (if analytics enabled).
     */
    public function stats(string $code): JsonResponse
    {
        $url = Url::where('short_code', $code)->first();

        if (!$url) {
            return response()->json([
                'error' => 'URL not found',
                'code' => 'URL_NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'clicks' => $url->clicks,
            'created_at' => $url->created_at->toISOString(),
            'expires_at' => $url->expires_at?->toISOString(),
            'is_expired' => $url->expires_at ? $url->expires_at->isPast() : false,
            'short_code' => $url->short_code,
            'original_url' => $url->original_url,
        ]);
    }
}
