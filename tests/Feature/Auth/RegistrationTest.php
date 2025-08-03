<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Enable registration by default for tests
        config(['app.allow_registration' => true]);
    }

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register()
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_registration_routes_are_available_when_enabled()
    {
        config(['app.allow_registration' => true]);

        $response = $this->get('/register');
        $response->assertStatus(200);

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_registration_routes_return_404_when_disabled()
    {
        config(['app.allow_registration' => false]);

        $response = $this->get('/register');
        $response->assertStatus(404);

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);
        $response->assertStatus(404);
    }

    public function test_login_page_shows_registration_link_when_enabled()
    {
        config(['app.allow_registration' => true]);

        $response = $this->get('/login');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('auth/login')
            ->where('canRegister', true)
        );
    }

    public function test_login_page_hides_registration_link_when_disabled()
    {
        config(['app.allow_registration' => false]);

        $response = $this->get('/login');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('auth/login')
            ->where('canRegister', false)
        );
    }

    public function test_registration_controller_returns_404_when_disabled()
    {
        config(['app.allow_registration' => false]);

        // Test the controller methods directly
        $controller = app(\App\Http\Controllers\Auth\RegisteredUserController::class);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class);
        $controller->create();
    }

    public function test_registration_controller_store_returns_404_when_disabled()
    {
        config(['app.allow_registration' => false]);

        $controller = app(\App\Http\Controllers\Auth\RegisteredUserController::class);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class);
        $controller->store(request());
    }

    public function test_registration_controller_works_when_enabled()
    {
        config(['app.allow_registration' => true]);

        $controller = app(\App\Http\Controllers\Auth\RegisteredUserController::class);

        $response = $controller->create();
        $this->assertInstanceOf(\Inertia\Response::class, $response);
    }
}
