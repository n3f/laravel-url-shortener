<?php

namespace Database\Factories;

use App\Models\Url;
use App\Models\UrlLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UrlLog>
 */
class UrlLogFactory extends Factory
{
    protected $model = UrlLog::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'request_path' => fake()->regexify('[A-Za-z0-9]{6}'),
            'url_id' => Url::factory(),
            'target_url' => fake()->url(),
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'referer' => fake()->optional()->url(),
            'status' => UrlLog::STATUS_SUCCESS,
        ];
    }

    public function orphaned(): static
    {
        return $this->state(fn (array $attributes) => [
            'url_id' => null,
            'target_url' => null,
            'status' => UrlLog::STATUS_NOT_FOUND,
        ]);
    }

    public function notFound(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => UrlLog::STATUS_NOT_FOUND,
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => UrlLog::STATUS_EXPIRED,
        ]);
    }

    public function error(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => UrlLog::STATUS_ERROR,
        ]);
    }
}
