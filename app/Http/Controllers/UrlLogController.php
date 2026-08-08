<?php

namespace App\Http\Controllers;

use App\Models\UrlLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UrlLogController extends Controller
{
    private const ALLOWED_SORTS = [
        'created_at',
        'request_path',
        'target_url',
        'status',
        'ip_address',
    ];

    public function index(Request $request): Response
    {
        $sort = $request->get('sort', 'created_at');
        $order = $request->get('order', 'desc');

        if (! in_array($sort, self::ALLOWED_SORTS, true)) {
            $sort = 'created_at';
        }

        if (! in_array($order, ['asc', 'desc'], true)) {
            $order = 'desc';
        }

        $logs = UrlLog::query()
            ->orderBy($sort, $order)
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('logs/index', [
            'logs' => $logs,
            'sort' => $sort,
            'order' => $order,
        ]);
    }
}
