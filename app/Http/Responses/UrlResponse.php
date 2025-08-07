<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class UrlResponse
{
    public static function success($data = null, $message = null, $statusCode = 200): JsonResponse|RedirectResponse
    {
        if (request()->expectsJson() || request()->header('User-Agent') === 'curl') {
            $response = [];
            if ($data) {
                $response = array_merge($response, $data);
            }
            if ($message) {
                $response['success'] = $message;
            }
            return response()->json($response, $statusCode);
        }

        return redirect()->back()->with('success', $message);
    }

    public static function created($data = null, $message = null): JsonResponse|RedirectResponse
    {
        if (request()->expectsJson() || request()->header('User-Agent') === 'curl') {
            $response = [];
            if ($data) {
                $response = array_merge($response, $data);
            }
            if ($message) {
                $response['success'] = $message;
            }
            return response()->json($response, 201);
        }

        return redirect()->back()->with('success', $message);
    }

    public static function error($message, $code = 400, $errorCode = null): JsonResponse|RedirectResponse
    {
        if (request()->expectsJson() || request()->header('User-Agent') === 'curl') {
            $response = ['error' => $message];
            if ($errorCode) {
                $response['code'] = $errorCode;
            }
            return response()->json($response, $code);
        }

        return redirect()->back()->with('error', $message);
    }

    public static function notFound($message = 'URL not found', $errorCode = 'URL_NOT_FOUND'): JsonResponse|RedirectResponse
    {
        return self::error($message, 404, $errorCode);
    }

    public static function gone($message = 'URL has expired', $errorCode = 'URL_EXPIRED'): JsonResponse|RedirectResponse
    {
        return self::error($message, 410, $errorCode);
    }

    public static function serverError($message = 'Failed to delete URL', $errorCode = 'FAILED_TO_DELETE_URL'): JsonResponse|RedirectResponse
    {
        return self::error($message, 500, $errorCode);
    }
}
