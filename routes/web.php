<?php

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
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
        // Validate the request params
        $validator = Validator::make(request()->all(), [
            'sort' => 'in:clicks,expires_at,short_url,url',
            'order' => 'in:asc,desc',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $order_by = request()->get('sort', 'created_at');
        $order_direction = request()->get('order', 'desc');

        // Configurable pagination size - can be set via PAGINATION_PER_PAGE env var
        $per_page = (int) config('app.pagination_per_page', 10);
        $urls = Url::where('user_id', Auth::user()->id)
            ->orderBy($order_by, $order_direction)
            ->paginate($per_page);
        return Inertia::render('dashboard', [
            'urls' => $urls,
        ]);
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// URL Shortener Routes
Route::middleware(['auth', 'verified', 'throttle:urls'])->group(function () {
    Route::post('/api/urls', [App\Http\Controllers\UrlController::class, 'store'])->name('urls.store');
    Route::patch('/api/urls/{id}', [App\Http\Controllers\UrlController::class, 'edit'])->name('urls.edit');
    Route::get('/api/urls/{id}/stats', [App\Http\Controllers\UrlController::class, 'stats'])->name('urls.stats');
    Route::delete('/api/urls/{id}', [App\Http\Controllers\UrlController::class, 'destroy'])->name('urls.destroy');
});
Route::middleware(['throttle:urls'])->group(function () {
    Route::get('/{code}', [App\Http\Controllers\UrlController::class, 'redirect'])->name('url.redirect');
});
