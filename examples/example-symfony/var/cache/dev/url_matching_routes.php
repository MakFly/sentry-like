<?php

/**
 * This file has been auto-generated
 * by the Symfony Routing Component.
 */

return [
    false, // $matchHost
    [ // $staticRoutes
        '/' => [[['_route' => 'app_home', '_controller' => 'App\\Controller\\TestController::home'], null, null, null, false, false, null]],
        '/dashboard' => [[['_route' => 'app_analytics', '_controller' => 'App\\Controller\\TestController::analytics'], null, null, null, false, false, null]],
        '/tests' => [[['_route' => 'app_tests', '_controller' => 'App\\Controller\\TestController::tests'], null, null, null, false, false, null]],
        '/api/scenarios' => [[['_route' => 'app_scenarios', '_controller' => 'App\\Controller\\TestController::getScenarios'], null, ['GET' => 0], null, false, false, null]],
        '/test/runtime' => [[['_route' => 'test_runtime', '_controller' => 'App\\Controller\\TestController::testRuntime'], null, null, null, false, false, null]],
        '/test/logic' => [[['_route' => 'test_logic', '_controller' => 'App\\Controller\\TestController::testLogic'], null, null, null, false, false, null]],
        '/test/invalid-arg' => [[['_route' => 'test_invalid_arg', '_controller' => 'App\\Controller\\TestController::testInvalidArg'], null, null, null, false, false, null]],
        '/test/type-error' => [[['_route' => 'test_type_error', '_controller' => 'App\\Controller\\TestController::testTypeError'], null, null, null, false, false, null]],
        '/test/division' => [[['_route' => 'test_division', '_controller' => 'App\\Controller\\TestController::testDivision'], null, null, null, false, false, null]],
        '/test/http/400' => [[['_route' => 'test_http_400', '_controller' => 'App\\Controller\\TestController::testHttp400'], null, null, null, false, false, null]],
        '/test/http/401' => [[['_route' => 'test_http_401', '_controller' => 'App\\Controller\\TestController::testHttp401'], null, null, null, false, false, null]],
        '/test/http/403' => [[['_route' => 'test_http_403', '_controller' => 'App\\Controller\\TestController::testHttp403'], null, null, null, false, false, null]],
        '/test/http/404' => [[['_route' => 'test_http_404', '_controller' => 'App\\Controller\\TestController::testHttp404'], null, null, null, false, false, null]],
        '/test/http/500' => [[['_route' => 'test_http_500', '_controller' => 'App\\Controller\\TestController::testHttp500'], null, null, null, false, false, null]],
        '/test/http/503' => [[['_route' => 'test_http_503', '_controller' => 'App\\Controller\\TestController::testHttp503'], null, null, null, false, false, null]],
        '/test/ecommerce/payment-failed' => [[['_route' => 'test_payment_failed', '_controller' => 'App\\Controller\\TestController::testPaymentFailed'], null, null, null, false, false, null]],
        '/test/ecommerce/out-of-stock' => [[['_route' => 'test_out_of_stock', '_controller' => 'App\\Controller\\TestController::testOutOfStock'], null, null, null, false, false, null]],
        '/test/ecommerce/invalid-coupon' => [[['_route' => 'test_invalid_coupon', '_controller' => 'App\\Controller\\TestController::testInvalidCoupon'], null, null, null, false, false, null]],
        '/test/ecommerce/shipping-error' => [[['_route' => 'test_shipping_error', '_controller' => 'App\\Controller\\TestController::testShippingError'], null, null, null, false, false, null]],
        '/test/db/connection' => [[['_route' => 'test_db_connection', '_controller' => 'App\\Controller\\TestController::testDbConnection'], null, null, null, false, false, null]],
        '/test/db/timeout' => [[['_route' => 'test_db_timeout', '_controller' => 'App\\Controller\\TestController::testDbTimeout'], null, null, null, false, false, null]],
        '/test/db/deadlock' => [[['_route' => 'test_db_deadlock', '_controller' => 'App\\Controller\\TestController::testDbDeadlock'], null, null, null, false, false, null]],
        '/test/db/constraint' => [[['_route' => 'test_db_constraint', '_controller' => 'App\\Controller\\TestController::testDbConstraint'], null, null, null, false, false, null]],
        '/test/api/timeout' => [[['_route' => 'test_api_timeout', '_controller' => 'App\\Controller\\TestController::testApiTimeout'], null, null, null, false, false, null]],
        '/test/api/rate-limit' => [[['_route' => 'test_api_rate_limit', '_controller' => 'App\\Controller\\TestController::testApiRateLimit'], null, null, null, false, false, null]],
        '/test/api/invalid-response' => [[['_route' => 'test_api_invalid_response', '_controller' => 'App\\Controller\\TestController::testApiInvalidResponse'], null, null, null, false, false, null]],
        '/test/auth/invalid-token' => [[['_route' => 'test_auth_invalid_token', '_controller' => 'App\\Controller\\TestController::testAuthInvalidToken'], null, null, null, false, false, null]],
        '/test/auth/expired-token' => [[['_route' => 'test_auth_expired_token', '_controller' => 'App\\Controller\\TestController::testAuthExpiredToken'], null, null, null, false, false, null]],
        '/test/auth/account-locked' => [[['_route' => 'test_auth_account_locked', '_controller' => 'App\\Controller\\TestController::testAuthAccountLocked'], null, null, null, false, false, null]],
        '/test/auth/session-hijack' => [[['_route' => 'test_auth_session_hijack', '_controller' => 'App\\Controller\\TestController::testAuthSessionHijack'], null, null, null, false, false, null]],
        '/test/replay/demo' => [[['_route' => 'test_replay_demo', '_controller' => 'App\\Controller\\TestController::testReplayDemo'], null, null, null, false, false, null]],
        '/test/replay/error' => [[['_route' => 'test_replay_error', '_controller' => 'App\\Controller\\TestController::testReplayError'], null, null, null, false, false, null]],
        '/banking' => [[['_route' => 'app_banking', '_controller' => 'App\\Controller\\TestController::banking'], null, null, null, false, false, null]],
        '/banking/api/transfer' => [[['_route' => 'banking_api_transfer', '_controller' => 'App\\Controller\\TestController::bankingApiTransfer'], null, ['POST' => 0], null, false, false, null]],
    ],
    [ // $regexpList
    ],
    [ // $dynamicRoutes
    ],
    null, // $checkCondition
];
