<?php

namespace App\Http\Controllers;

use App\Models\Url;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class UrlController extends Controller
{
    /**
     * Create a new short URL.
     */
    public function shorten(Request $request): JsonResponse
    {
        $request->validate([
            'url' => 'required|url|max:2048',
        ]);

        $url = Url::create([
            'original_url' => $request->url,
            'short_code' => Url::generateShortCode(),
            'user_id' => Auth::check() ? Auth::user()->id : null, // Will be null if not authenticated
        ]);

        return response()->json([
            'short_url' => $url->short_url,
            'code' => $url->short_code,
            'original_url' => $url->original_url,
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
            'short_code' => $url->short_code,
            'original_url' => $url->original_url,
        ]);
    }
}
