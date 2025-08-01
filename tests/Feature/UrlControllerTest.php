<?php

namespace Tests\Feature;

use App\Models\Url;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;
use Carbon\Carbon;

class UrlControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    #[Test]
    public function it_can_create_a_short_url()
    {
        $response = $this->postJson('/api/shorten', [
            'url' => 'https://example.com/very/long/url/that/needs/shortening',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'short_url',
                'code',
                'original_url',
            ]);

        $this->assertDatabaseHas('urls', [
            'original_url' => 'https://example.com/very/long/url/that/needs/shortening',
        ]);
    }

    #[Test]
    public function it_can_create_a_short_url_with_expiration()
    {
        $expiresAt = Carbon::now()->addDays(7);

        $response = $this->postJson('/api/shorten', [
            'url' => 'https://example.com',
            'expires_at' => $expiresAt->toISOString(),
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'short_url',
                'code',
                'original_url',
                'expires_at',
            ])
            ->assertJson([
                'original_url' => 'https://example.com',
            ]);

        $this->assertDatabaseHas('urls', [
            'original_url' => 'https://example.com',
            'expires_at' => $expiresAt->toDateTimeString(),
        ]);
    }

    #[Test]
    public function it_validates_expiration_date_is_in_future()
    {
        $pastDate = Carbon::now()->subDay();

        $response = $this->postJson('/api/shorten', [
            'url' => 'https://example.com',
            'expires_at' => $pastDate->toISOString(),
        ]);

        $response->assertStatus(422);
    }

    #[Test]
    public function it_validates_expiration_date_format()
    {
        $response = $this->postJson('/api/shorten', [
            'url' => 'https://example.com',
            'expires_at' => 'invalid-date',
        ]);

        $response->assertStatus(422);
    }

    #[Test]
    public function it_redirects_expired_url_to_home_with_error()
    {
        $url = Url::factory()->create([
            'original_url' => 'https://google.com',
            'short_code' => 'abc123',
            'expires_at' => Carbon::now()->subDay(),
        ]);

        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        ])->get('/abc123');

        $response->assertRedirect(route('home'));
        $response->assertSessionHas('error', 'URL has expired');
    }

    #[Test]
    public function it_returns_410_for_expired_url_when_requesting_json()
    {
        $url = Url::factory()->create([
            'original_url' => 'https://google.com',
            'short_code' => 'abc123',
            'expires_at' => Carbon::now()->subDay(),
        ]);

        $response = $this->getJson('/abc123');

        $response->assertStatus(410);
    }

    #[Test]
    public function it_returns_410_for_expired_url_when_curl_user_agent()
    {
        $url = Url::factory()->create([
            'original_url' => 'https://google.com',
            'short_code' => 'abc123',
            'expires_at' => Carbon::now()->subDay(),
        ]);

        $response = $this->withHeaders([
            'User-Agent' => 'curl'
        ])->get('/abc123');

        $response->assertStatus(410);
    }

    #[Test]
    public function it_redirects_non_expired_url_normally()
    {
        $url = Url::factory()->create([
            'original_url' => 'https://google.com',
            'short_code' => 'abc123',
            'expires_at' => Carbon::now()->addDay(),
        ]);

        $response = $this->get('/abc123');

        $response->assertRedirect('https://google.com');
    }

    #[Test]
    public function it_includes_expiration_in_stats_response()
    {
        $expiresAt = Carbon::now()->addDays(7);
        $url = Url::factory()->create([
            'original_url' => 'https://google.com',
            'short_code' => 'abc123',
            'clicks' => 42,
            'expires_at' => $expiresAt,
        ]);

        $response = $this->getJson('/api/stats/abc123');

        $response->assertStatus(200)
            ->assertJson([
                'clicks' => 42,
                'short_code' => 'abc123',
                'original_url' => 'https://google.com',
                'is_expired' => false,
            ])
            ->assertJsonStructure([
                'clicks',
                'created_at',
                'expires_at',
                'is_expired',
                'short_code',
                'original_url',
            ]);
    }

    #[Test]
    public function it_shows_expired_status_in_stats_for_expired_url()
    {
        $url = Url::factory()->create([
            'original_url' => 'https://google.com',
            'short_code' => 'abc123',
            'clicks' => 42,
            'expires_at' => Carbon::now()->subDay(),
        ]);

        $response = $this->getJson('/api/stats/abc123');

        $response->assertStatus(200)
            ->assertJson([
                'is_expired' => true,
            ]);
    }

    #[Test]
    public function it_validates_url_format()
    {
        $response = $this->postJson('/api/shorten', [
            'url' => 'not-a-valid-url',
        ]);

        $response->assertStatus(422);
    }

    #[Test]
    public function it_requires_url_parameter()
    {
        $response = $this->postJson('/api/shorten', []);

        $response->assertStatus(422);
    }

    #[Test]
    public function it_validates_url_length()
    {
        $longUrl = 'https://example.com/' . str_repeat('a', 2048);

        $response = $this->postJson('/api/shorten', [
            'url' => $longUrl,
        ]);

        $response->assertStatus(422);
    }

    #[Test]
    public function it_redirects_short_code_to_original_url()
    {
        $url = Url::factory()->create([
            'original_url' => 'https://google.com',
            'short_code' => 'abc123',
        ]);

        $response = $this->get('/abc123');

        $response->assertRedirect('https://google.com');
    }

    #[Test]
    public function it_returns_404_for_invalid_short_code_when_requesting_json()
    {
        $response = $this->getJson('/invalid');

        $response->assertStatus(404);
    }

    #[Test]
    public function it_returns_404_for_invalid_short_code_when_curl_user_agent()
    {
        $response = $this->withHeaders([
            'User-Agent' => 'curl'
        ])->get('/invalid');

        $response->assertStatus(404);
    }

    #[Test]
    public function it_redirects_to_home_for_invalid_short_code_in_browser()
    {
        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        ])->get('/invalid');

        $response->assertRedirect(route('home'));
        $response->assertSessionHas('error', 'URL not found');
    }

    #[Test]
    public function it_increments_clicks_when_redirecting()
    {
        $url = Url::factory()->create([
            'original_url' => 'https://google.com',
            'short_code' => 'abc123',
            'clicks' => 5,
        ]);

        $this->get('/abc123');

        $this->assertDatabaseHas('urls', [
            'short_code' => 'abc123',
            'clicks' => 6,
        ]);
    }

    #[Test]
    public function it_returns_url_statistics()
    {
        $url = Url::factory()->create([
            'original_url' => 'https://google.com',
            'short_code' => 'abc123',
            'clicks' => 42,
        ]);

        $response = $this->getJson('/api/stats/abc123');

        $response->assertStatus(200)
            ->assertJson([
                'clicks' => 42,
                'short_code' => 'abc123',
                'original_url' => 'https://google.com',
            ])
            ->assertJsonStructure([
                'clicks',
                'created_at',
                'short_code',
                'original_url',
            ]);
    }

    #[Test]
    public function it_returns_404_for_stats_of_invalid_code()
    {
        $response = $this->getJson('/api/stats/invalid');

        $response->assertStatus(404)
            ->assertJson([
                'error' => 'URL not found',
                'code' => 'URL_NOT_FOUND',
            ]);
    }

    #[Test]
    public function it_associates_url_with_authenticated_user()
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->createOne();

        $response = $this->actingAs($user)->postJson('/api/shorten', [
            'url' => 'https://example.com',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('urls', [
            'original_url' => 'https://example.com',
            'user_id' => $user->id,
        ]);
    }

    #[Test]
    public function it_creates_url_without_user_when_not_authenticated()
    {
        $response = $this->postJson('/api/shorten', [
            'url' => 'https://example.com',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('urls', [
            'original_url' => 'https://example.com',
            'user_id' => null,
        ]);
    }

    #[Test]
    public function it_generates_unique_short_codes()
    {
        // Create first URL
        $response1 = $this->postJson('/api/shorten', [
            'url' => 'https://example1.com',
        ]);

        // Create second URL
        $response2 = $this->postJson('/api/shorten', [
            'url' => 'https://example2.com',
        ]);

        $code1 = $response1->json('code');
        $code2 = $response2->json('code');

        $this->assertNotEquals($code1, $code2);
        $this->assertEquals(6, strlen($code1));
        $this->assertEquals(6, strlen($code2));
    }

    #[Test]
    public function it_can_create_anonymous_urls_with_factory()
    {
        $url = Url::factory()->anonymous()->create();

        $this->assertNull($url->user_id);
        $this->assertNotNull($url->original_url);
        $this->assertNotNull($url->short_code);
    }

    #[Test]
    public function it_can_create_urls_for_specific_user_with_factory()
    {
        $user = User::factory()->create();
        $url = Url::factory()->forUser($user)->create();

        $this->assertEquals($user->id, $url->user_id);
        $this->assertTrue($url->user->is($user));
    }

    #[Test]
    public function it_can_create_expired_urls_with_factory()
    {
        $url = Url::factory()->expired()->create();

        $this->assertTrue($url->expires_at->isPast());
    }
}
