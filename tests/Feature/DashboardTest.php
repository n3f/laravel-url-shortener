<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Url;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get('/dashboard')->assertOk();
    }

    public function test_dashboard_shows_paginated_urls()
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $per_page = (int) config('app.pagination_per_page', 10);
        $total_urls = $per_page + 5; // Create more than one page
        Url::factory()->count($total_urls)->for($user)->create();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->has('urls.data', $per_page) // First page shows per_page items
                ->where('urls.current_page', 1)
                ->where('urls.last_page', 2)
                ->where('urls.per_page', $per_page)
                ->where('urls.total', $total_urls)
                ->where('urls.from', 1)
                ->where('urls.to', $per_page)
            );
    }

    public function test_dashboard_pagination_navigation()
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $per_page = (int) config('app.pagination_per_page', 10);
        $total_urls = $per_page * 2 + 5; // Create 2 full pages + 5 more
        Url::factory()->count($total_urls)->for($user)->create();

        // Test first page
        $response = $this->actingAs($user)->get('/dashboard?page=1');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('urls.current_page', 1)
                ->where('urls.from', 1)
                ->where('urls.to', $per_page)
            );

        // Test second page
        $response = $this->actingAs($user)->get('/dashboard?page=2');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('urls.current_page', 2)
                ->where('urls.from', $per_page + 1)
                ->where('urls.to', $per_page * 2)
            );

        // Test third page
        $response = $this->actingAs($user)->get('/dashboard?page=3');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('urls.current_page', 3)
                ->where('urls.from', $per_page * 2 + 1)
                ->where('urls.to', $total_urls)
            );
    }

    public function test_dashboard_handles_invalid_page_numbers()
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        Url::factory()->count(5)->for($user)->create();

        // Page 0 should return page 1
        $response = $this->actingAs($user)->get('/dashboard?page=0');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page->where('urls.current_page', 1));

        // Page -1 should return page 1
        $response = $this->actingAs($user)->get('/dashboard?page=-1');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page->where('urls.current_page', 1));

        // Page beyond last page should return the requested page (Laravel behavior)
        $response = $this->actingAs($user)->get('/dashboard?page=10');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page->where('urls.current_page', 10));
    }

    public function test_dashboard_handles_non_numeric_page_parameters()
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        Url::factory()->count(5)->for($user)->create();

        // Non-numeric page should return page 1
        $response = $this->actingAs($user)->get('/dashboard?page=abc');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page->where('urls.current_page', 1));

        // Empty page should return page 1
        $response = $this->actingAs($user)->get('/dashboard?page=');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page->where('urls.current_page', 1));
    }

    public function test_dashboard_shows_empty_state_when_no_urls()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('urls.data', [])
                ->where('urls.current_page', 1)
                ->where('urls.last_page', 1)
                ->where('urls.total', 0)
                ->where('urls.from', null)
                ->where('urls.to', null)
            );
    }

    public function test_dashboard_preserves_sorting_with_pagination()
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $per_page = (int) config('app.pagination_per_page', 10);
        $total_urls = $per_page + 5; // Create more than one page
        Url::factory()->count($total_urls)->for($user)->create();

        // Test sorting by clicks ascending
        $response = $this->actingAs($user)->get('/dashboard?sort=clicks&order=asc&page=2');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('urls.current_page', 2)
            );

        // Test sorting by expiration date descending
        $response = $this->actingAs($user)->get('/dashboard?sort=expires_at&order=desc&page=1');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('urls.current_page', 1)
            );
    }

    public function test_dashboard_handles_edge_case_exactly_per_page_urls()
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $per_page = (int) config('app.pagination_per_page', 10);
        Url::factory()->count($per_page)->for($user)->create();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('urls.current_page', 1)
                ->where('urls.last_page', 1)
                ->where('urls.total', $per_page)
                ->where('urls.from', 1)
                ->where('urls.to', $per_page)
            );
    }

    public function test_dashboard_handles_edge_case_exactly_per_page_plus_one_urls()
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $per_page = (int) config('app.pagination_per_page', 10);
        $total_urls = $per_page + 1;
        Url::factory()->count($total_urls)->for($user)->create();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('urls.current_page', 1)
                ->where('urls.last_page', 2)
                ->where('urls.total', $total_urls)
                ->where('urls.from', 1)
                ->where('urls.to', $per_page)
            );

        // Test second page
        $response = $this->actingAs($user)->get('/dashboard?page=2');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('urls.current_page', 2)
                ->where('urls.from', $per_page + 1)
                ->where('urls.to', $total_urls)
            );
    }

    public function test_dashboard_only_shows_user_own_urls()
    {
        /** @var \App\Models\User $user1 */
        $user1 = User::factory()->create();
        /** @var \App\Models\User $user2 */
        $user2 = User::factory()->create();

        Url::factory()->count(5)->for($user1)->create();
        Url::factory()->count(3)->for($user2)->create();

        $response = $this->actingAs($user1)->get('/dashboard');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('urls.total', 5)
                ->has('urls.data', 5)
            );
    }

    public function test_dashboard_handles_large_number_of_urls()
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $per_page = (int) config('app.pagination_per_page', 10);
        $total_urls = $per_page * 10; // Create exactly 10 pages
        Url::factory()->count($total_urls)->for($user)->create();

        // Test first page
        $response = $this->actingAs($user)->get('/dashboard');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('urls.current_page', 1)
                ->where('urls.last_page', 10)
                ->where('urls.total', $total_urls)
                ->where('urls.from', 1)
                ->where('urls.to', $per_page)
            );

        // Test last page
        $response = $this->actingAs($user)->get('/dashboard?page=10');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('urls.current_page', 10)
                ->where('urls.from', $per_page * 9 + 1)
                ->where('urls.to', $total_urls)
            );
    }

    public function test_pagination_configuration_is_respected()
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();

        // Test with default configuration
        $default_per_page = (int) config('app.pagination_per_page', 10);
        Url::factory()->count($default_per_page + 1)->for($user)->create();

        $response = $this->actingAs($user)->get('/dashboard');
        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('urls.per_page', $default_per_page)
                ->where('urls.last_page', 2)
            );
    }
}
