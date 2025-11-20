<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:8081',
        // Add specific Expo dev server URLs as needed
        // 'exp://192.168.1.100:8081',
    ],

    'allowed_origins_patterns' => [
        // Allow all Expo dev server URLs on local network
        '/^exp:\/\/192\.168\.\d+\.\d+:8081$/',
        '/^exp:\/\/10\.\d+\.\d+\.\d+:8081$/',
        '/^exp:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:8081$/',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
