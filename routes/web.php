<?php

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Url;

Route::get('/', function () {
    Log::info('Home page visited');
    return Inertia::render('welcome', [
        'error' => session('error'),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $urls = Url::where('user_id', Auth::user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        return Inertia::render('dashboard', [
            'urls' => $urls,
        ]);
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// URL Shortener Routes
Route::middleware(['auth', 'verified', 'throttle:10,1'])->group(function () {
    Route::post('/api/shorten', [App\Http\Controllers\UrlController::class, 'shorten'])->name('url.shorten');
    Route::get('/api/stats/{code}', [App\Http\Controllers\UrlController::class, 'stats'])->name('url.stats');
    Route::delete('/api/url/{id}', [App\Http\Controllers\UrlController::class, 'delete'])->name('url.delete');
});
Route::get('/{code}', [App\Http\Controllers\UrlController::class, 'redirect'])->name('url.redirect');
