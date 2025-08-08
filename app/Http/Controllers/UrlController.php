<?php

namespace App\Http\Controllers;

use App\Models\Url;
use App\Http\Responses\UrlResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Inertia\Inertia;

class UrlController extends Controller
{
    /**
     * Create a new short URL.
     */
    public function store(Request $request)
    {
        $request->validate([
            'url' => 'required|url|max:2048',
            'short_code' => 'nullable|string|between:4,255|unique:urls,short_code',
            'expires_at' => 'nullable|date',
        ]);

        $data = [
            'original_url' => $request->url,
            'expires_at' => $request->expires_at ? Carbon::parse($request->expires_at) : null,
            'user_id' => Auth::check() ? Auth::user()->id : null,
        ];

        // Add expiration if provided
        if ($request->filled('expires_at')) {
            $data['expires_at'] = Carbon::parse($request->expires_at);
        }

        // Create with temporary short code first
        $data['short_code'] = $request->short_code ?? Str::uuid()->toString();
        $url = Url::create($data);

        // Generate proper short code from ID and update
        if (!$request->short_code) {
            $url->short_code = $url->generateShortCode();
            $url->save();
        }

        $response = [
            'short_url' => $url->short_url,
            'code' => $url->short_code,
            'original_url' => $url->original_url,
            'expires_at' => $url->expires_at?->toISOString(),
        ];

        return UrlResponse::created($response);
    }

    /**
     * Redirect short code to original URL.
     */
    public function redirect(string $code, Request $request): RedirectResponse|JsonResponse
    {
        $url = Url::where('short_code', $code)->first();

        if (!$url) {
            return UrlResponse::notFound();
        }

        // Check if URL has expired
        if ($url->expires_at && $url->expires_at->isPast()) {
            return UrlResponse::gone();
        }

        // Increment click count
        $url->incrementClicks();

        return redirect($url->original_url);
    }

    /**
     * Get URL statistics (if analytics enabled).
     */
    public function stats(int $id): JsonResponse
    {
        $url = Url::where('id', $id)
        ->where('user_id', Auth::user()->id)
        ->first();

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

    /**
     * Update an existing short URL.
     */
    public function edit(int $id, Request $request): JsonResponse
    {
        $url = Url::where('id', $id)
            ->where('user_id', Auth::user()->id)
            ->first();

        if (!$url) {
            return UrlResponse::notFound();
        }

        $request->validate([
            'url' => 'sometimes|required|url|max:2048',
            'short_code' => 'sometimes|nullable|string|between:4,255|unique:urls,short_code,' . $id,
            'expires_at' => 'sometimes|nullable|date',
        ]);

        $data = [];

        // Update original URL if provided
        if ($request->filled('url')) {
            $data['original_url'] = $request->url;
        }

        // Update short code if provided
        if ($request->filled('short_code')) {
            $data['short_code'] = $request->short_code;
        }

        // Update expiration
        $data['expires_at'] = $request->filled('expires_at') ? Carbon::parse($request->expires_at) : null;

        // Only update if there are changes
        if (!empty($data)) {
            $url->update($data);
        }

        $response = [
            'short_url' => $url->short_url,
            'code' => $url->short_code,
            'original_url' => $url->original_url,
            'expires_at' => $url->expires_at?->toISOString(),
        ];

        return UrlResponse::success($response, 'URL updated successfully');
    }

    public function destroy(int $id) {
        // Validate that the code exists in the database
        $url = Url::where('id', $id)->where('user_id', Auth::user()->id)->first();

        if (!$url) {
            return UrlResponse::notFound();
        }

        $success = $url->delete();

        if (!$success) {
            return UrlResponse::serverError();
        }

        return UrlResponse::created(['code' => 'URL_DELETED'], 'URL deleted');
    }
}
