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
        $validator = Validator::make($request->all(), [
            'url' => 'required|url|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Invalid URL',
                'code' => 'INVALID_URL',
                'message' => $validator->errors()->first('url'),
            ], 422);
        }

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
    public function redirect(string $code): RedirectResponse
    {
        $url = Url::where('short_code', $code)->first();

        if (!$url) {
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
