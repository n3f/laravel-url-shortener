<?php

namespace Tests\Feature;

use App\Models\Url;
use App\Models\UrlLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UrlLogControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get('/logs')->assertRedirect('/login');
    }

    public function test_authenticated_users_can_visit_logs(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get('/logs')->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('logs/index')
                ->has('logs')
                ->where('sort', 'created_at')
                ->where('order', 'desc')
                ->where('logs.per_page', 50)
            );
    }

    public function test_logs_include_orphaned_rows_without_url_id(): void
    {
        $user = User::factory()->create();
        $url = Url::factory()->for($user)->create();

        UrlLog::factory()->create([
            'url_id' => $url->id,
            'request_path' => 'owned1',
            'created_at' => now()->subMinute(),
        ]);
        UrlLog::factory()->orphaned()->create([
            'request_path' => 'botscan',
            'created_at' => now(),
        ]);

        $response = $this->actingAs($user)->get('/logs');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('logs.total', 2)
                ->has('logs.data', 2)
                ->where('logs.data.0.request_path', 'botscan')
                ->where('logs.data.0.url_id', null)
                ->where('logs.data.1.request_path', 'owned1')
            );
    }

    public function test_logs_default_sort_is_created_at_desc(): void
    {
        $user = User::factory()->create();

        UrlLog::factory()->orphaned()->create([
            'request_path' => 'older',
            'created_at' => now()->subHour(),
        ]);
        UrlLog::factory()->orphaned()->create([
            'request_path' => 'newer',
            'created_at' => now(),
        ]);

        $this->actingAs($user)->get('/logs')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('logs.data.0.request_path', 'newer')
                ->where('logs.data.1.request_path', 'older')
                ->where('sort', 'created_at')
                ->where('order', 'desc')
            );
    }

    public function test_logs_can_be_sorted_by_request_path_asc(): void
    {
        $user = User::factory()->create();

        UrlLog::factory()->orphaned()->create(['request_path' => 'zebra']);
        UrlLog::factory()->orphaned()->create(['request_path' => 'alpha']);

        $this->actingAs($user)->get('/logs?sort=request_path&order=asc')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('sort', 'request_path')
                ->where('order', 'asc')
                ->where('logs.data.0.request_path', 'alpha')
                ->where('logs.data.1.request_path', 'zebra')
            );
    }

    public function test_logs_can_be_sorted_by_status_desc(): void
    {
        $user = User::factory()->create();

        UrlLog::factory()->orphaned()->create([
            'request_path' => 'ok',
            'status' => UrlLog::STATUS_SUCCESS,
        ]);
        UrlLog::factory()->orphaned()->create([
            'request_path' => 'missing',
            'status' => UrlLog::STATUS_NOT_FOUND,
        ]);

        $this->actingAs($user)->get('/logs?sort=status&order=desc')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('sort', 'status')
                ->where('order', 'desc')
            );
    }

    public function test_invalid_sort_falls_back_to_defaults(): void
    {
        $user = User::factory()->create();
        UrlLog::factory()->orphaned()->create();

        $this->actingAs($user)->get('/logs?sort=hacker_col&order=sideways')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('sort', 'created_at')
                ->where('order', 'desc')
            );
    }

    public function test_logs_pagination_preserves_sort_query_string(): void
    {
        $user = User::factory()->create();
        $perPage = 50;
        UrlLog::factory()->orphaned()->count($perPage + 3)->create();

        $this->actingAs($user)->get('/logs?sort=request_path&order=asc&page=2')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('logs.current_page', 2)
                ->where('sort', 'request_path')
                ->where('order', 'asc')
            );
    }
}
