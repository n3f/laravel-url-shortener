<?php

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    Log::info('Home page visited');
    return Inertia::render('welcome', [
        'error' => session('error'),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// URL Shortener Routes
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/api/shorten', [App\Http\Controllers\UrlController::class, 'shorten'])->name('url.shorten');
    Route::get('/api/stats/{code}', [App\Http\Controllers\UrlController::class, 'stats'])->name('url.stats');
});
Route::get('/{code}', [App\Http\Controllers\UrlController::class, 'redirect'])->name('url.redirect');
