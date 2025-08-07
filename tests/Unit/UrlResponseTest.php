<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Http\Responses\UrlResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UrlResponseTest extends TestCase
{
    public function test_success_returns_json_for_api_requests()
    {
        $request = $this->createRequest(['Accept' => 'application/json']);

        $response = UrlResponse::success(['id' => 1], 'URL created');

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals([
            'success' => 'URL created',
            'id' => 1
        ], json_decode($response->getContent(), true));
    }

    public function test_success_returns_redirect_for_web_requests()
    {
        $request = $this->createRequest();

        $response = UrlResponse::success(['id' => 1], 'URL created');

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertTrue(session()->has('success'));
        $this->assertEquals('URL created', session('success'));
    }

    public function test_created_returns_201_status_for_api_requests()
    {
        $request = $this->createRequest(['Accept' => 'application/json']);

        $response = UrlResponse::created(['id' => 1], 'URL created');

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(201, $response->getStatusCode());
    }

    public function test_error_returns_json_for_api_requests()
    {
        $request = $this->createRequest(['Accept' => 'application/json']);

        $response = UrlResponse::error('Something went wrong', 400, 'ERROR_CODE');

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(400, $response->getStatusCode());
        $this->assertEquals([
            'error' => 'Something went wrong',
            'code' => 'ERROR_CODE'
        ], json_decode($response->getContent(), true));
    }

    public function test_error_returns_redirect_for_web_requests()
    {
        $request = $this->createRequest();

        $response = UrlResponse::error('Something went wrong', 400, 'ERROR_CODE');

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertTrue(session()->has('error'));
        $this->assertEquals('Something went wrong', session('error'));
    }

    public function test_not_found_returns_404_status()
    {
        $request = $this->createRequest(['Accept' => 'application/json']);

        $response = UrlResponse::notFound();

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals([
            'error' => 'URL not found',
            'code' => 'URL_NOT_FOUND'
        ], json_decode($response->getContent(), true));
    }

    public function test_gone_returns_410_status()
    {
        $request = $this->createRequest(['Accept' => 'application/json']);

        $response = UrlResponse::gone();

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(410, $response->getStatusCode());
        $this->assertEquals([
            'error' => 'URL has expired',
            'code' => 'URL_EXPIRED'
        ], json_decode($response->getContent(), true));
    }

    public function test_server_error_returns_500_status()
    {
        $request = $this->createRequest(['Accept' => 'application/json']);

        $response = UrlResponse::serverError();

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(500, $response->getStatusCode());
        $this->assertEquals([
            'error' => 'Failed to delete URL',
            'code' => 'FAILED_TO_DELETE_URL'
        ], json_decode($response->getContent(), true));
    }

    public function test_custom_error_codes_work()
    {
        $request = $this->createRequest(['Accept' => 'application/json']);

        $response = UrlResponse::notFound('Custom message', 'CUSTOM_CODE');

        $this->assertEquals([
            'error' => 'Custom message',
            'code' => 'CUSTOM_CODE'
        ], json_decode($response->getContent(), true));
    }

    public function test_success_returns_json_for_curl_user_agent()
    {
        $request = $this->createRequest(['User-Agent' => 'curl']);

        $response = UrlResponse::success(['id' => 1], 'URL created');

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals([
            'success' => 'URL created',
            'id' => 1
        ], json_decode($response->getContent(), true));
    }

    public function test_created_returns_json_for_curl_user_agent()
    {
        $request = $this->createRequest(['User-Agent' => 'curl']);

        $response = UrlResponse::created(['id' => 1], 'URL created');

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(201, $response->getStatusCode());
        $this->assertEquals([
            'success' => 'URL created',
            'id' => 1
        ], json_decode($response->getContent(), true));
    }

    public function test_error_returns_json_for_curl_user_agent()
    {
        $request = $this->createRequest(['User-Agent' => 'curl']);

        $response = UrlResponse::error('Something went wrong', 400, 'ERROR_CODE');

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(400, $response->getStatusCode());
        $this->assertEquals([
            'error' => 'Something went wrong',
            'code' => 'ERROR_CODE'
        ], json_decode($response->getContent(), true));
    }

    public function test_success_with_data_only_returns_correct_structure()
    {
        $request = $this->createRequest(['Accept' => 'application/json']);

        $response = UrlResponse::success(['short_url' => 'https://example.com/abc123', 'code' => 'abc123']);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals([
            'short_url' => 'https://example.com/abc123',
            'code' => 'abc123'
        ], json_decode($response->getContent(), true));
    }

    public function test_success_with_message_only_returns_correct_structure()
    {
        $request = $this->createRequest(['Accept' => 'application/json']);

        $response = UrlResponse::success(null, 'Operation completed');

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals([
            'success' => 'Operation completed'
        ], json_decode($response->getContent(), true));
    }

    public function test_created_with_data_and_message_returns_correct_structure()
    {
        $request = $this->createRequest(['Accept' => 'application/json']);

        $response = UrlResponse::created(['code' => 'URL_DELETED'], 'URL deleted');

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(201, $response->getStatusCode());
        $this->assertEquals([
            'success' => 'URL deleted',
            'code' => 'URL_DELETED'
        ], json_decode($response->getContent(), true));
    }

    private function createRequest(array $headers = [])
    {
        $request = request();

        foreach ($headers as $key => $value) {
            $request->headers->set($key, $value);
        }

        return $request;
    }
}
