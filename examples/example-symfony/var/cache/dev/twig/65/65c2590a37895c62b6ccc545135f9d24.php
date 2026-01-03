<?php

use Twig\Environment;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Extension\CoreExtension;
use Twig\Extension\SandboxExtension;
use Twig\Markup;
use Twig\Sandbox\SecurityError;
use Twig\Sandbox\SecurityNotAllowedTagError;
use Twig\Sandbox\SecurityNotAllowedFilterError;
use Twig\Sandbox\SecurityNotAllowedFunctionError;
use Twig\Source;
use Twig\Template;
use Twig\TemplateWrapper;

/* banking/dashboard.html.twig */
class __TwigTemplate_207c41be14dbefec6f3df0a451f97c5e extends Template
{
    private Source $source;
    /**
     * @var array<string, Template>
     */
    private array $macros = [];

    public function __construct(Environment $env)
    {
        parent::__construct($env);

        $this->source = $this->getSourceContext();

        $this->parent = false;

        $this->blocks = [
        ];
    }

    protected function doDisplay(array $context, array $blocks = []): iterable
    {
        $macros = $this->macros;
        $__internal_6f47bbe9983af81f1e7450e9a3e3768f = $this->extensions["Symfony\\Bridge\\Twig\\Extension\\ProfilerExtension"];
        $__internal_6f47bbe9983af81f1e7450e9a3e3768f->enter($__internal_6f47bbe9983af81f1e7450e9a3e3768f_prof = new \Twig\Profiler\Profile($this->getTemplateName(), "template", "banking/dashboard.html.twig"));

        // line 1
        yield "<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>SecureBank - Online Banking</title>
    <script src=\"https://cdn.tailwindcss.com\"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'bank-blue': '#0052A5',
                        'bank-blue-dark': '#003D7A',
                        'bank-blue-light': '#E6F0FA',
                        'bank-accent': '#00A4E0',
                        'bank-success': '#00A86B',
                        'bank-warning': '#FFA500',
                        'bank-error': '#D32F2F',
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background: linear-gradient(135deg, #0052A5 0%, #003D7A 100%);
            min-height: 100vh;
        }
        .card-shadow {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
        }
        .card-hover:hover {
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
        }
        .input-focus:focus {
            outline: none;
            border-color: #0052A5;
            box-shadow: 0 0 0 3px rgba(0, 82, 165, 0.1);
        }
        .btn-primary {
            background: linear-gradient(135deg, #0052A5 0%, #003D7A 100%);
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            box-shadow: 0 4px 12px rgba(0, 82, 165, 0.4);
            transform: translateY(-1px);
        }
        .btn-primary:active {
            transform: translateY(0);
        }
        .transaction-item {
            transition: background-color 0.2s ease;
        }
        .transaction-item:hover {
            background-color: #F9FAFB;
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        .toast-enter {
            animation: slideIn 0.3s ease;
        }
        .security-badge {
            background: linear-gradient(135deg, #00A86B 0%, #008A5A 100%);
            box-shadow: 0 2px 8px rgba(0, 168, 107, 0.3);
        }
        .loading-spinner {
            border: 3px solid rgba(0, 82, 165, 0.2);
            border-top-color: #0052A5;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body class=\"font-sans antialiased\">
    <!-- Top Navigation -->
    <nav class=\"bg-white border-b border-gray-200 shadow-sm\">
        <div class=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
            <div class=\"flex justify-between items-center h-16\">
                <div class=\"flex items-center gap-3\">
                    <svg class=\"w-8 h-8 text-bank-blue\" fill=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path d=\"M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z\"/>
                    </svg>
                    <div>
                        <h1 class=\"text-xl font-bold text-bank-blue\">SecureBank</h1>
                        <p class=\"text-xs text-gray-500\">Online Banking</p>
                    </div>
                </div>
                <!-- Navigation -->
                <nav class=\"hidden md:flex items-center gap-4\">
                    <a href=\"";
        // line 102
        yield $this->extensions['Symfony\Bridge\Twig\Extension\RoutingExtension']->getPath("app_home");
        yield "\" class=\"text-sm font-medium text-gray-600 hover:text-bank-blue transition-colors\">TechStore</a>
                    <a href=\"";
        // line 103
        yield $this->extensions['Symfony\Bridge\Twig\Extension\RoutingExtension']->getPath("app_analytics");
        yield "\" class=\"text-sm font-medium text-gray-600 hover:text-bank-blue transition-colors\">Analytics</a>
                    <a href=\"";
        // line 104
        yield $this->extensions['Symfony\Bridge\Twig\Extension\RoutingExtension']->getPath("app_banking");
        yield "\" class=\"text-sm font-medium text-bank-blue border-b-2 border-bank-blue pb-0.5\">Banking</a>
                    <a href=\"";
        // line 105
        yield $this->extensions['Symfony\Bridge\Twig\Extension\RoutingExtension']->getPath("app_tests");
        yield "\" class=\"text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1\">
                        <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2\"/></svg>
                        Tests
                    </a>
                </nav>
                <div class=\"flex items-center gap-4\">
                    <div class=\"security-badge text-white text-xs px-3 py-1 rounded-full flex items-center gap-1\">
                        <svg class=\"w-3 h-3\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                            <path fill-rule=\"evenodd\" d=\"M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z\" clip-rule=\"evenodd\"/>
                        </svg>
                        <span>Secure Connection</span>
                    </div>
                    <div class=\"text-right hidden sm:block\">
                        <p class=\"text-sm font-medium text-gray-900\">John Anderson</p>
                        <p class=\"text-xs text-gray-500\">Account: ****8742</p>
                    </div>
                    <button onclick=\"logout()\" class=\"text-sm text-gray-600 hover:text-bank-blue transition-colors\">
                        Logout
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <div class=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        <div class=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">
            <!-- Main Content -->
            <div class=\"lg:col-span-2 space-y-6\">
                <!-- Account Overview Card -->
                <div class=\"bg-white rounded-xl card-shadow p-6\">
                    <div class=\"flex justify-between items-start mb-6\">
                        <div>
                            <p class=\"text-gray-600 text-sm mb-1\">Available Balance</p>
                            <h2 class=\"text-4xl font-bold text-bank-blue\" id=\"account-balance\">\$12,487.50</h2>
                            <p class=\"text-xs text-gray-500 mt-1\">Checking Account ****8742</p>
                        </div>
                        <div class=\"text-right\">
                            <div class=\"inline-flex items-center gap-1 text-bank-success text-sm font-medium\">
                                <svg class=\"w-4 h-4\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                    <path fill-rule=\"evenodd\" d=\"M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z\" clip-rule=\"evenodd\"/>
                                </svg>
                                <span>+2.3% this month</span>
                            </div>
                        </div>
                    </div>
                    <div class=\"grid grid-cols-3 gap-4 pt-4 border-t border-gray-100\">
                        <div>
                            <p class=\"text-xs text-gray-500 mb-1\">Savings</p>
                            <p class=\"text-lg font-semibold text-gray-900\">\$45,280.00</p>
                        </div>
                        <div>
                            <p class=\"text-xs text-gray-500 mb-1\">Credit Available</p>
                            <p class=\"text-lg font-semibold text-gray-900\">\$8,500.00</p>
                        </div>
                        <div>
                            <p class=\"text-xs text-gray-500 mb-1\">Investments</p>
                            <p class=\"text-lg font-semibold text-gray-900\">\$23,456.78</p>
                        </div>
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div class=\"bg-white rounded-xl card-shadow p-6\">
                    <div class=\"flex justify-between items-center mb-4\">
                        <h3 class=\"text-lg font-semibold text-gray-900\">Recent Transactions</h3>
                        <button class=\"text-sm text-bank-blue hover:underline\">View All</button>
                    </div>
                    <div class=\"space-y-1\">
                        <div class=\"transaction-item flex justify-between items-center p-3 rounded-lg\">
                            <div class=\"flex items-center gap-3\">
                                <div class=\"w-10 h-10 rounded-full bg-red-50 flex items-center justify-center\">
                                    <svg class=\"w-5 h-5 text-red-600\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                        <path d=\"M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z\"/>
                                    </svg>
                                </div>
                                <div>
                                    <p class=\"font-medium text-gray-900\">Amazon.com</p>
                                    <p class=\"text-xs text-gray-500\">Dec 26, 2025 • 14:32</p>
                                </div>
                            </div>
                            <div class=\"text-right\">
                                <p class=\"font-semibold text-red-600\">-\$89.99</p>
                                <p class=\"text-xs text-gray-500\">Shopping</p>
                            </div>
                        </div>
                        <div class=\"transaction-item flex justify-between items-center p-3 rounded-lg\">
                            <div class=\"flex items-center gap-3\">
                                <div class=\"w-10 h-10 rounded-full bg-green-50 flex items-center justify-center\">
                                    <svg class=\"w-5 h-5 text-green-600\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                        <path fill-rule=\"evenodd\" d=\"M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z\" clip-rule=\"evenodd\"/>
                                    </svg>
                                </div>
                                <div>
                                    <p class=\"font-medium text-gray-900\">Salary Deposit</p>
                                    <p class=\"text-xs text-gray-500\">Dec 25, 2025 • 09:00</p>
                                </div>
                            </div>
                            <div class=\"text-right\">
                                <p class=\"font-semibold text-green-600\">+\$4,500.00</p>
                                <p class=\"text-xs text-gray-500\">Income</p>
                            </div>
                        </div>
                        <div class=\"transaction-item flex justify-between items-center p-3 rounded-lg\">
                            <div class=\"flex items-center gap-3\">
                                <div class=\"w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center\">
                                    <svg class=\"w-5 h-5 text-blue-600\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                        <path d=\"M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z\"/>
                                    </svg>
                                </div>
                                <div>
                                    <p class=\"font-medium text-gray-900\">Electric Bill</p>
                                    <p class=\"text-xs text-gray-500\">Dec 23, 2025 • 16:45</p>
                                </div>
                            </div>
                            <div class=\"text-right\">
                                <p class=\"font-semibold text-red-600\">-\$127.38</p>
                                <p class=\"text-xs text-gray-500\">Utilities</p>
                            </div>
                        </div>
                        <div class=\"transaction-item flex justify-between items-center p-3 rounded-lg\">
                            <div class=\"flex items-center gap-3\">
                                <div class=\"w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center\">
                                    <svg class=\"w-5 h-5 text-purple-600\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                        <path d=\"M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z\"/><path d=\"M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z\"/>
                                    </svg>
                                </div>
                                <div>
                                    <p class=\"font-medium text-gray-900\">Uber Eats</p>
                                    <p class=\"text-xs text-gray-500\">Dec 22, 2025 • 19:15</p>
                                </div>
                            </div>
                            <div class=\"text-right\">
                                <p class=\"font-semibold text-red-600\">-\$34.50</p>
                                <p class=\"text-xs text-gray-500\">Food & Dining</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- New Transfer Form -->
                <div class=\"bg-white rounded-xl card-shadow p-6\">
                    <h3 class=\"text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2\">
                        <svg class=\"w-5 h-5 text-bank-blue\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                            <path d=\"M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z\"/>
                        </svg>
                        New Transfer
                    </h3>
                    <form id=\"transfer-form\" class=\"space-y-4\">
                        <div>
                            <label for=\"iban\" class=\"block text-sm font-medium text-gray-700 mb-1\">Recipient IBAN</label>
                            <input
                                type=\"text\"
                                id=\"iban\"
                                name=\"iban\"
                                placeholder=\"GB29 NWBK 6016 1331 9268 19\"
                                class=\"w-full px-4 py-2.5 border border-gray-300 rounded-lg input-focus transition-all\"
                                required
                            />
                        </div>
                        <div>
                            <label for=\"amount\" class=\"block text-sm font-medium text-gray-700 mb-1\">Amount (\$)</label>
                            <input
                                type=\"number\"
                                id=\"amount\"
                                name=\"amount\"
                                placeholder=\"0.00\"
                                step=\"0.01\"
                                min=\"0.01\"
                                class=\"w-full px-4 py-2.5 border border-gray-300 rounded-lg input-focus transition-all\"
                                required
                            />
                        </div>
                        <div>
                            <label for=\"description\" class=\"block text-sm font-medium text-gray-700 mb-1\">Description</label>
                            <input
                                type=\"text\"
                                id=\"description\"
                                name=\"description\"
                                placeholder=\"Payment reference\"
                                class=\"w-full px-4 py-2.5 border border-gray-300 rounded-lg input-focus transition-all\"
                                required
                            />
                        </div>
                        <button
                            type=\"submit\"
                            class=\"w-full btn-primary text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2\"
                        >
                            <svg class=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                <path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z\" clip-rule=\"evenodd\"/>
                            </svg>
                            <span>Send Transfer</span>
                        </button>
                    </form>
                </div>
            </div>

            <!-- Sidebar -->
            <div class=\"space-y-6\">
                <!-- Login Simulation (Error Testing) -->
                <div class=\"bg-white rounded-xl card-shadow p-6\">
                    <h3 class=\"text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2\">
                        <svg class=\"w-5 h-5 text-bank-blue\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                            <path fill-rule=\"evenodd\" d=\"M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z\" clip-rule=\"evenodd\"/>
                        </svg>
                        Security Testing
                    </h3>
                    <div class=\"space-y-3\">
                        <div>
                            <label for=\"test-password\" class=\"block text-sm font-medium text-gray-700 mb-1\">Test Password</label>
                            <input
                                type=\"password\"
                                id=\"test-password\"
                                placeholder=\"Enter wrong password 3x\"
                                class=\"w-full px-3 py-2 border border-gray-300 rounded-lg input-focus text-sm\"
                            />
                            <p class=\"text-xs text-gray-500 mt-1\">Attempts: <span id=\"login-attempts\">0</span>/3</p>
                        </div>
                        <button
                            onclick=\"testLogin()\"
                            class=\"w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 rounded-lg transition-colors text-sm\"
                        >
                            Test Login
                        </button>

                        <div class=\"border-t border-gray-200 pt-3 mt-3\">
                            <label for=\"test-2fa\" class=\"block text-sm font-medium text-gray-700 mb-1\">2FA Code</label>
                            <input
                                type=\"text\"
                                id=\"test-2fa\"
                                placeholder=\"123456\"
                                maxlength=\"6\"
                                class=\"w-full px-3 py-2 border border-gray-300 rounded-lg input-focus text-sm\"
                            />
                            <button
                                onclick=\"test2FA()\"
                                class=\"w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 rounded-lg transition-colors text-sm\"
                            >
                                Verify 2FA
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class=\"bg-white rounded-xl card-shadow p-6\">
                    <h3 class=\"text-lg font-semibold text-gray-900 mb-4\">Quick Actions</h3>
                    <div class=\"space-y-2\">
                        <button class=\"w-full text-left px-4 py-3 rounded-lg bg-bank-blue-light hover:bg-blue-100 transition-colors flex items-center gap-3 card-hover\">
                            <svg class=\"w-5 h-5 text-bank-blue\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                <path d=\"M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z\"/><path fill-rule=\"evenodd\" d=\"M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z\" clip-rule=\"evenodd\"/>
                            </svg>
                            <div>
                                <p class=\"font-medium text-gray-900\">Pay Bills</p>
                                <p class=\"text-xs text-gray-500\">Quick bill payment</p>
                            </div>
                        </button>
                        <button class=\"w-full text-left px-4 py-3 rounded-lg bg-bank-blue-light hover:bg-blue-100 transition-colors flex items-center gap-3 card-hover\">
                            <svg class=\"w-5 h-5 text-bank-blue\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                <path fill-rule=\"evenodd\" d=\"M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z\" clip-rule=\"evenodd\"/>
                            </svg>
                            <div>
                                <p class=\"font-medium text-gray-900\">Statements</p>
                                <p class=\"text-xs text-gray-500\">Download statements</p>
                            </div>
                        </button>
                        <button class=\"w-full text-left px-4 py-3 rounded-lg bg-bank-blue-light hover:bg-blue-100 transition-colors flex items-center gap-3 card-hover\">
                            <svg class=\"w-5 h-5 text-bank-blue\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                <path fill-rule=\"evenodd\" d=\"M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z\" clip-rule=\"evenodd\"/>
                            </svg>
                            <div>
                                <p class=\"font-medium text-gray-900\">Settings</p>
                                <p class=\"text-xs text-gray-500\">Account preferences</p>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Support -->
                <div class=\"bg-gradient-to-br from-bank-blue to-bank-blue-dark rounded-xl p-6 text-white\">
                    <h3 class=\"text-lg font-semibold mb-2\">Need Help?</h3>
                    <p class=\"text-sm text-blue-100 mb-4\">Our support team is available 24/7</p>
                    <button class=\"w-full bg-white text-bank-blue font-semibold py-2 rounded-lg hover:bg-blue-50 transition-colors\">
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id=\"toast-container\" class=\"fixed bottom-4 right-4 flex flex-col gap-2 z-50\" style=\"max-width: 400px;\"></div>

    <!-- Session Replay Script -->
    ";
        // line 398
        yield $this->extensions['Makfly\ErrorMonitoringBundle\Twig\ReplayExtension']->getReplayScript();
        yield "

    <script>
        // State management
        let loginAttempts = 0;
        const currentBalance = 12487.50;

        // Form submission - Transfer validation
        document.getElementById('transfer-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const iban = document.getElementById('iban').value.trim();
            const amount = parseFloat(document.getElementById('amount').value);
            const description = document.getElementById('description').value.trim();

            // Show loading state
            const submitBtn = e.target.querySelector('button[type=\"submit\"]');
            const originalHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<div class=\"loading-spinner w-5 h-5 rounded-full mx-auto\"></div>';
            submitBtn.disabled = true;

            try {
                // Check for suspicious IBAN (fraud detection)
                const suspiciousIbans = ['RU', 'KP', 'IR', 'SY'];
                const ibanCountry = iban.replace(/\\s/g, '').substring(0, 2).toUpperCase();

                if (suspiciousIbans.includes(ibanCountry)) {
                    await fetch('/banking/api/fraud-check', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ iban, amount, description })
                    });
                    return;
                }

                // Check for insufficient funds
                if (amount > currentBalance) {
                    await fetch('/banking/api/transfer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ iban, amount, description })
                    });
                    return;
                }

                // Successful transfer (demo)
                showToast('Transfer initiated successfully!', 'success');
                e.target.reset();
            } catch (error) {
                showToast('Transfer failed. Please try again.', 'error');
            } finally {
                submitBtn.innerHTML = originalHtml;
                submitBtn.disabled = false;
            }
        });

        // Login attempt testing
        async function testLogin() {
            const password = document.getElementById('test-password').value;

            if (!password) {
                showToast('Please enter a password', 'warning');
                return;
            }

            loginAttempts++;
            document.getElementById('login-attempts').textContent = loginAttempts;

            if (loginAttempts >= 3) {
                try {
                    await fetch('/banking/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            password,
                            attempts: loginAttempts
                        })
                    });
                } catch (error) {
                    showToast('Account locked after 3 failed attempts', 'error');
                    document.getElementById('test-password').disabled = true;
                    loginAttempts = 0;
                    setTimeout(() => {
                        document.getElementById('test-password').disabled = false;
                        document.getElementById('login-attempts').textContent = '0';
                    }, 5000);
                }
            } else {
                showToast(`Invalid password (\${3 - loginAttempts} attempts remaining)`, 'warning');
            }
        }

        // 2FA verification testing
        async function test2FA() {
            const code = document.getElementById('test-2fa').value;

            if (!code || code.length !== 6) {
                showToast('Please enter a 6-digit code', 'warning');
                return;
            }

            const correctCode = '123456';

            if (code !== correctCode) {
                try {
                    await fetch('/banking/api/verify-2fa', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code })
                    });
                } catch (error) {
                    showToast('Invalid 2FA code', 'error');
                }
            } else {
                showToast('2FA verification successful', 'success');
                document.getElementById('test-2fa').value = '';
            }
        }

        // Logout
        function logout() {
            showToast('Logging out...', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }

        // Toast notification system
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');

            const icons = {
                success: `<svg class=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 20 20\"><path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z\" clip-rule=\"evenodd\"/></svg>`,
                error: `<svg class=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 20 20\"><path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z\" clip-rule=\"evenodd\"/></svg>`,
                warning: `<svg class=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 20 20\"><path fill-rule=\"evenodd\" d=\"M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z\" clip-rule=\"evenodd\"/></svg>`,
                info: `<svg class=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 20 20\"><path fill-rule=\"evenodd\" d=\"M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z\" clip-rule=\"evenodd\"/></svg>`,
            };

            const colors = {
                success: 'bg-green-50 border-green-200 text-green-800',
                error: 'bg-red-50 border-red-200 text-red-800',
                warning: 'bg-amber-50 border-amber-200 text-amber-800',
                info: 'bg-blue-50 border-blue-200 text-blue-800',
            };

            toast.className = `toast-enter \${colors[type]} border rounded-lg shadow-lg p-4 flex items-start gap-3`;
            toast.innerHTML = `
                <div class=\"flex-shrink-0\">\${icons[type]}</div>
                <div class=\"flex-1\">
                    <p class=\"text-sm font-medium\">\${message}</p>
                </div>
                <button onclick=\"this.parentElement.remove()\" class=\"flex-shrink-0 text-gray-400 hover:text-gray-600\">
                    <svg class=\"w-4 h-4\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                        <path fill-rule=\"evenodd\" d=\"M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z\" clip-rule=\"evenodd\"/>
                    </svg>
                </button>
            `;

            container.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        }

        // Welcome message
        setTimeout(() => {
            showToast('Welcome back, John! Your session is secure.', 'success');
        }, 500);

        // Debug panel functions
        function toggleDebugPanel() {
            const content = document.getElementById('debug-content');
            const text = document.getElementById('debug-toggle-text');
            content.classList.toggle('hidden');
            text.textContent = content.classList.contains('hidden') ? 'Test Errors' : 'Hide';
        }

        async function triggerBankingError(path, body = {}) {
            showToast('Triggering error...', 'info');
            try {
                await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                showToast('Error triggered! Check ErrorWatch dashboard.', 'success');
            } catch (e) {
                showToast('Error sent with replay!', 'success');
            }
        }

        // Display session ID
        setTimeout(() => {
            const sessionId = window.ErrorMonitoringReplay?.getSessionId?.() || 'N/A';
            const display = document.getElementById('session-id-display');
            if (display) display.textContent = sessionId.substring(0, 8) + '...';
        }, 1000);
    </script>

    <!-- Debug Panel (Error Testing) -->
    <div id=\"debug-panel\" class=\"fixed bottom-4 left-4 z-50\">
        <button onclick=\"toggleDebugPanel()\" class=\"bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2\">
            <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4\"/></svg>
            <span id=\"debug-toggle-text\">Test Errors</span>
        </button>
        <div id=\"debug-content\" class=\"hidden mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-72\">
            <h4 class=\"font-semibold text-gray-900 mb-3 flex items-center gap-2\">
                <span class=\"w-2 h-2 rounded-full bg-purple-500 animate-pulse\"></span>
                Trigger Test Errors
            </h4>
            <div class=\"space-y-2\">
                <button onclick=\"triggerBankingError('/banking/api/login', {attempts: 3})\" class=\"w-full text-left px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors\">
                    🔐 Account Locked (3 attempts)
                </button>
                <button onclick=\"triggerBankingError('/banking/api/transfer', {amount: 99999, iban: 'FR76123456', description: 'Test transfer'})\" class=\"w-full text-left px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium transition-colors\">
                    💸 Insufficient Funds
                </button>
                <button onclick=\"triggerBankingError('/banking/api/fraud-check', {iban: 'RU1234567890', amount: 5000})\" class=\"w-full text-left px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors\">
                    🚨 Fraud Detection
                </button>
                <button onclick=\"triggerBankingError('/banking/api/verify-2fa', {code: '000000'})\" class=\"w-full text-left px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-medium transition-colors\">
                    🔑 Invalid 2FA Code
                </button>
            </div>
            <div class=\"mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500\">
                Session: <code class=\"bg-gray-100 px-1 rounded\" id=\"session-id-display\">loading...</code>
            </div>
        </div>
    </div>
</body>
</html>
";
        
        $__internal_6f47bbe9983af81f1e7450e9a3e3768f->leave($__internal_6f47bbe9983af81f1e7450e9a3e3768f_prof);

        yield from [];
    }

    /**
     * @codeCoverageIgnore
     */
    public function getTemplateName(): string
    {
        return "banking/dashboard.html.twig";
    }

    /**
     * @codeCoverageIgnore
     */
    public function isTraitable(): bool
    {
        return false;
    }

    /**
     * @codeCoverageIgnore
     */
    public function getDebugInfo(): array
    {
        return array (  456 => 398,  160 => 105,  156 => 104,  152 => 103,  148 => 102,  45 => 1,);
    }

    public function getSourceContext(): Source
    {
        return new Source("<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>SecureBank - Online Banking</title>
    <script src=\"https://cdn.tailwindcss.com\"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'bank-blue': '#0052A5',
                        'bank-blue-dark': '#003D7A',
                        'bank-blue-light': '#E6F0FA',
                        'bank-accent': '#00A4E0',
                        'bank-success': '#00A86B',
                        'bank-warning': '#FFA500',
                        'bank-error': '#D32F2F',
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background: linear-gradient(135deg, #0052A5 0%, #003D7A 100%);
            min-height: 100vh;
        }
        .card-shadow {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
        }
        .card-hover:hover {
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
        }
        .input-focus:focus {
            outline: none;
            border-color: #0052A5;
            box-shadow: 0 0 0 3px rgba(0, 82, 165, 0.1);
        }
        .btn-primary {
            background: linear-gradient(135deg, #0052A5 0%, #003D7A 100%);
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            box-shadow: 0 4px 12px rgba(0, 82, 165, 0.4);
            transform: translateY(-1px);
        }
        .btn-primary:active {
            transform: translateY(0);
        }
        .transaction-item {
            transition: background-color 0.2s ease;
        }
        .transaction-item:hover {
            background-color: #F9FAFB;
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        .toast-enter {
            animation: slideIn 0.3s ease;
        }
        .security-badge {
            background: linear-gradient(135deg, #00A86B 0%, #008A5A 100%);
            box-shadow: 0 2px 8px rgba(0, 168, 107, 0.3);
        }
        .loading-spinner {
            border: 3px solid rgba(0, 82, 165, 0.2);
            border-top-color: #0052A5;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body class=\"font-sans antialiased\">
    <!-- Top Navigation -->
    <nav class=\"bg-white border-b border-gray-200 shadow-sm\">
        <div class=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
            <div class=\"flex justify-between items-center h-16\">
                <div class=\"flex items-center gap-3\">
                    <svg class=\"w-8 h-8 text-bank-blue\" fill=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path d=\"M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z\"/>
                    </svg>
                    <div>
                        <h1 class=\"text-xl font-bold text-bank-blue\">SecureBank</h1>
                        <p class=\"text-xs text-gray-500\">Online Banking</p>
                    </div>
                </div>
                <!-- Navigation -->
                <nav class=\"hidden md:flex items-center gap-4\">
                    <a href=\"{{ path('app_home') }}\" class=\"text-sm font-medium text-gray-600 hover:text-bank-blue transition-colors\">TechStore</a>
                    <a href=\"{{ path('app_analytics') }}\" class=\"text-sm font-medium text-gray-600 hover:text-bank-blue transition-colors\">Analytics</a>
                    <a href=\"{{ path('app_banking') }}\" class=\"text-sm font-medium text-bank-blue border-b-2 border-bank-blue pb-0.5\">Banking</a>
                    <a href=\"{{ path('app_tests') }}\" class=\"text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1\">
                        <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2\"/></svg>
                        Tests
                    </a>
                </nav>
                <div class=\"flex items-center gap-4\">
                    <div class=\"security-badge text-white text-xs px-3 py-1 rounded-full flex items-center gap-1\">
                        <svg class=\"w-3 h-3\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                            <path fill-rule=\"evenodd\" d=\"M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z\" clip-rule=\"evenodd\"/>
                        </svg>
                        <span>Secure Connection</span>
                    </div>
                    <div class=\"text-right hidden sm:block\">
                        <p class=\"text-sm font-medium text-gray-900\">John Anderson</p>
                        <p class=\"text-xs text-gray-500\">Account: ****8742</p>
                    </div>
                    <button onclick=\"logout()\" class=\"text-sm text-gray-600 hover:text-bank-blue transition-colors\">
                        Logout
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <div class=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        <div class=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">
            <!-- Main Content -->
            <div class=\"lg:col-span-2 space-y-6\">
                <!-- Account Overview Card -->
                <div class=\"bg-white rounded-xl card-shadow p-6\">
                    <div class=\"flex justify-between items-start mb-6\">
                        <div>
                            <p class=\"text-gray-600 text-sm mb-1\">Available Balance</p>
                            <h2 class=\"text-4xl font-bold text-bank-blue\" id=\"account-balance\">\$12,487.50</h2>
                            <p class=\"text-xs text-gray-500 mt-1\">Checking Account ****8742</p>
                        </div>
                        <div class=\"text-right\">
                            <div class=\"inline-flex items-center gap-1 text-bank-success text-sm font-medium\">
                                <svg class=\"w-4 h-4\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                    <path fill-rule=\"evenodd\" d=\"M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z\" clip-rule=\"evenodd\"/>
                                </svg>
                                <span>+2.3% this month</span>
                            </div>
                        </div>
                    </div>
                    <div class=\"grid grid-cols-3 gap-4 pt-4 border-t border-gray-100\">
                        <div>
                            <p class=\"text-xs text-gray-500 mb-1\">Savings</p>
                            <p class=\"text-lg font-semibold text-gray-900\">\$45,280.00</p>
                        </div>
                        <div>
                            <p class=\"text-xs text-gray-500 mb-1\">Credit Available</p>
                            <p class=\"text-lg font-semibold text-gray-900\">\$8,500.00</p>
                        </div>
                        <div>
                            <p class=\"text-xs text-gray-500 mb-1\">Investments</p>
                            <p class=\"text-lg font-semibold text-gray-900\">\$23,456.78</p>
                        </div>
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div class=\"bg-white rounded-xl card-shadow p-6\">
                    <div class=\"flex justify-between items-center mb-4\">
                        <h3 class=\"text-lg font-semibold text-gray-900\">Recent Transactions</h3>
                        <button class=\"text-sm text-bank-blue hover:underline\">View All</button>
                    </div>
                    <div class=\"space-y-1\">
                        <div class=\"transaction-item flex justify-between items-center p-3 rounded-lg\">
                            <div class=\"flex items-center gap-3\">
                                <div class=\"w-10 h-10 rounded-full bg-red-50 flex items-center justify-center\">
                                    <svg class=\"w-5 h-5 text-red-600\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                        <path d=\"M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z\"/>
                                    </svg>
                                </div>
                                <div>
                                    <p class=\"font-medium text-gray-900\">Amazon.com</p>
                                    <p class=\"text-xs text-gray-500\">Dec 26, 2025 • 14:32</p>
                                </div>
                            </div>
                            <div class=\"text-right\">
                                <p class=\"font-semibold text-red-600\">-\$89.99</p>
                                <p class=\"text-xs text-gray-500\">Shopping</p>
                            </div>
                        </div>
                        <div class=\"transaction-item flex justify-between items-center p-3 rounded-lg\">
                            <div class=\"flex items-center gap-3\">
                                <div class=\"w-10 h-10 rounded-full bg-green-50 flex items-center justify-center\">
                                    <svg class=\"w-5 h-5 text-green-600\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                        <path fill-rule=\"evenodd\" d=\"M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z\" clip-rule=\"evenodd\"/>
                                    </svg>
                                </div>
                                <div>
                                    <p class=\"font-medium text-gray-900\">Salary Deposit</p>
                                    <p class=\"text-xs text-gray-500\">Dec 25, 2025 • 09:00</p>
                                </div>
                            </div>
                            <div class=\"text-right\">
                                <p class=\"font-semibold text-green-600\">+\$4,500.00</p>
                                <p class=\"text-xs text-gray-500\">Income</p>
                            </div>
                        </div>
                        <div class=\"transaction-item flex justify-between items-center p-3 rounded-lg\">
                            <div class=\"flex items-center gap-3\">
                                <div class=\"w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center\">
                                    <svg class=\"w-5 h-5 text-blue-600\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                        <path d=\"M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z\"/>
                                    </svg>
                                </div>
                                <div>
                                    <p class=\"font-medium text-gray-900\">Electric Bill</p>
                                    <p class=\"text-xs text-gray-500\">Dec 23, 2025 • 16:45</p>
                                </div>
                            </div>
                            <div class=\"text-right\">
                                <p class=\"font-semibold text-red-600\">-\$127.38</p>
                                <p class=\"text-xs text-gray-500\">Utilities</p>
                            </div>
                        </div>
                        <div class=\"transaction-item flex justify-between items-center p-3 rounded-lg\">
                            <div class=\"flex items-center gap-3\">
                                <div class=\"w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center\">
                                    <svg class=\"w-5 h-5 text-purple-600\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                        <path d=\"M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z\"/><path d=\"M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z\"/>
                                    </svg>
                                </div>
                                <div>
                                    <p class=\"font-medium text-gray-900\">Uber Eats</p>
                                    <p class=\"text-xs text-gray-500\">Dec 22, 2025 • 19:15</p>
                                </div>
                            </div>
                            <div class=\"text-right\">
                                <p class=\"font-semibold text-red-600\">-\$34.50</p>
                                <p class=\"text-xs text-gray-500\">Food & Dining</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- New Transfer Form -->
                <div class=\"bg-white rounded-xl card-shadow p-6\">
                    <h3 class=\"text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2\">
                        <svg class=\"w-5 h-5 text-bank-blue\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                            <path d=\"M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z\"/>
                        </svg>
                        New Transfer
                    </h3>
                    <form id=\"transfer-form\" class=\"space-y-4\">
                        <div>
                            <label for=\"iban\" class=\"block text-sm font-medium text-gray-700 mb-1\">Recipient IBAN</label>
                            <input
                                type=\"text\"
                                id=\"iban\"
                                name=\"iban\"
                                placeholder=\"GB29 NWBK 6016 1331 9268 19\"
                                class=\"w-full px-4 py-2.5 border border-gray-300 rounded-lg input-focus transition-all\"
                                required
                            />
                        </div>
                        <div>
                            <label for=\"amount\" class=\"block text-sm font-medium text-gray-700 mb-1\">Amount (\$)</label>
                            <input
                                type=\"number\"
                                id=\"amount\"
                                name=\"amount\"
                                placeholder=\"0.00\"
                                step=\"0.01\"
                                min=\"0.01\"
                                class=\"w-full px-4 py-2.5 border border-gray-300 rounded-lg input-focus transition-all\"
                                required
                            />
                        </div>
                        <div>
                            <label for=\"description\" class=\"block text-sm font-medium text-gray-700 mb-1\">Description</label>
                            <input
                                type=\"text\"
                                id=\"description\"
                                name=\"description\"
                                placeholder=\"Payment reference\"
                                class=\"w-full px-4 py-2.5 border border-gray-300 rounded-lg input-focus transition-all\"
                                required
                            />
                        </div>
                        <button
                            type=\"submit\"
                            class=\"w-full btn-primary text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2\"
                        >
                            <svg class=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                <path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z\" clip-rule=\"evenodd\"/>
                            </svg>
                            <span>Send Transfer</span>
                        </button>
                    </form>
                </div>
            </div>

            <!-- Sidebar -->
            <div class=\"space-y-6\">
                <!-- Login Simulation (Error Testing) -->
                <div class=\"bg-white rounded-xl card-shadow p-6\">
                    <h3 class=\"text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2\">
                        <svg class=\"w-5 h-5 text-bank-blue\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                            <path fill-rule=\"evenodd\" d=\"M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z\" clip-rule=\"evenodd\"/>
                        </svg>
                        Security Testing
                    </h3>
                    <div class=\"space-y-3\">
                        <div>
                            <label for=\"test-password\" class=\"block text-sm font-medium text-gray-700 mb-1\">Test Password</label>
                            <input
                                type=\"password\"
                                id=\"test-password\"
                                placeholder=\"Enter wrong password 3x\"
                                class=\"w-full px-3 py-2 border border-gray-300 rounded-lg input-focus text-sm\"
                            />
                            <p class=\"text-xs text-gray-500 mt-1\">Attempts: <span id=\"login-attempts\">0</span>/3</p>
                        </div>
                        <button
                            onclick=\"testLogin()\"
                            class=\"w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 rounded-lg transition-colors text-sm\"
                        >
                            Test Login
                        </button>

                        <div class=\"border-t border-gray-200 pt-3 mt-3\">
                            <label for=\"test-2fa\" class=\"block text-sm font-medium text-gray-700 mb-1\">2FA Code</label>
                            <input
                                type=\"text\"
                                id=\"test-2fa\"
                                placeholder=\"123456\"
                                maxlength=\"6\"
                                class=\"w-full px-3 py-2 border border-gray-300 rounded-lg input-focus text-sm\"
                            />
                            <button
                                onclick=\"test2FA()\"
                                class=\"w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 rounded-lg transition-colors text-sm\"
                            >
                                Verify 2FA
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class=\"bg-white rounded-xl card-shadow p-6\">
                    <h3 class=\"text-lg font-semibold text-gray-900 mb-4\">Quick Actions</h3>
                    <div class=\"space-y-2\">
                        <button class=\"w-full text-left px-4 py-3 rounded-lg bg-bank-blue-light hover:bg-blue-100 transition-colors flex items-center gap-3 card-hover\">
                            <svg class=\"w-5 h-5 text-bank-blue\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                <path d=\"M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z\"/><path fill-rule=\"evenodd\" d=\"M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z\" clip-rule=\"evenodd\"/>
                            </svg>
                            <div>
                                <p class=\"font-medium text-gray-900\">Pay Bills</p>
                                <p class=\"text-xs text-gray-500\">Quick bill payment</p>
                            </div>
                        </button>
                        <button class=\"w-full text-left px-4 py-3 rounded-lg bg-bank-blue-light hover:bg-blue-100 transition-colors flex items-center gap-3 card-hover\">
                            <svg class=\"w-5 h-5 text-bank-blue\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                <path fill-rule=\"evenodd\" d=\"M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z\" clip-rule=\"evenodd\"/>
                            </svg>
                            <div>
                                <p class=\"font-medium text-gray-900\">Statements</p>
                                <p class=\"text-xs text-gray-500\">Download statements</p>
                            </div>
                        </button>
                        <button class=\"w-full text-left px-4 py-3 rounded-lg bg-bank-blue-light hover:bg-blue-100 transition-colors flex items-center gap-3 card-hover\">
                            <svg class=\"w-5 h-5 text-bank-blue\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                                <path fill-rule=\"evenodd\" d=\"M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z\" clip-rule=\"evenodd\"/>
                            </svg>
                            <div>
                                <p class=\"font-medium text-gray-900\">Settings</p>
                                <p class=\"text-xs text-gray-500\">Account preferences</p>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Support -->
                <div class=\"bg-gradient-to-br from-bank-blue to-bank-blue-dark rounded-xl p-6 text-white\">
                    <h3 class=\"text-lg font-semibold mb-2\">Need Help?</h3>
                    <p class=\"text-sm text-blue-100 mb-4\">Our support team is available 24/7</p>
                    <button class=\"w-full bg-white text-bank-blue font-semibold py-2 rounded-lg hover:bg-blue-50 transition-colors\">
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id=\"toast-container\" class=\"fixed bottom-4 right-4 flex flex-col gap-2 z-50\" style=\"max-width: 400px;\"></div>

    <!-- Session Replay Script -->
    {{ error_monitoring_replay_script()|raw }}

    <script>
        // State management
        let loginAttempts = 0;
        const currentBalance = 12487.50;

        // Form submission - Transfer validation
        document.getElementById('transfer-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const iban = document.getElementById('iban').value.trim();
            const amount = parseFloat(document.getElementById('amount').value);
            const description = document.getElementById('description').value.trim();

            // Show loading state
            const submitBtn = e.target.querySelector('button[type=\"submit\"]');
            const originalHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<div class=\"loading-spinner w-5 h-5 rounded-full mx-auto\"></div>';
            submitBtn.disabled = true;

            try {
                // Check for suspicious IBAN (fraud detection)
                const suspiciousIbans = ['RU', 'KP', 'IR', 'SY'];
                const ibanCountry = iban.replace(/\\s/g, '').substring(0, 2).toUpperCase();

                if (suspiciousIbans.includes(ibanCountry)) {
                    await fetch('/banking/api/fraud-check', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ iban, amount, description })
                    });
                    return;
                }

                // Check for insufficient funds
                if (amount > currentBalance) {
                    await fetch('/banking/api/transfer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ iban, amount, description })
                    });
                    return;
                }

                // Successful transfer (demo)
                showToast('Transfer initiated successfully!', 'success');
                e.target.reset();
            } catch (error) {
                showToast('Transfer failed. Please try again.', 'error');
            } finally {
                submitBtn.innerHTML = originalHtml;
                submitBtn.disabled = false;
            }
        });

        // Login attempt testing
        async function testLogin() {
            const password = document.getElementById('test-password').value;

            if (!password) {
                showToast('Please enter a password', 'warning');
                return;
            }

            loginAttempts++;
            document.getElementById('login-attempts').textContent = loginAttempts;

            if (loginAttempts >= 3) {
                try {
                    await fetch('/banking/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            password,
                            attempts: loginAttempts
                        })
                    });
                } catch (error) {
                    showToast('Account locked after 3 failed attempts', 'error');
                    document.getElementById('test-password').disabled = true;
                    loginAttempts = 0;
                    setTimeout(() => {
                        document.getElementById('test-password').disabled = false;
                        document.getElementById('login-attempts').textContent = '0';
                    }, 5000);
                }
            } else {
                showToast(`Invalid password (\${3 - loginAttempts} attempts remaining)`, 'warning');
            }
        }

        // 2FA verification testing
        async function test2FA() {
            const code = document.getElementById('test-2fa').value;

            if (!code || code.length !== 6) {
                showToast('Please enter a 6-digit code', 'warning');
                return;
            }

            const correctCode = '123456';

            if (code !== correctCode) {
                try {
                    await fetch('/banking/api/verify-2fa', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code })
                    });
                } catch (error) {
                    showToast('Invalid 2FA code', 'error');
                }
            } else {
                showToast('2FA verification successful', 'success');
                document.getElementById('test-2fa').value = '';
            }
        }

        // Logout
        function logout() {
            showToast('Logging out...', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }

        // Toast notification system
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');

            const icons = {
                success: `<svg class=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 20 20\"><path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z\" clip-rule=\"evenodd\"/></svg>`,
                error: `<svg class=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 20 20\"><path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z\" clip-rule=\"evenodd\"/></svg>`,
                warning: `<svg class=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 20 20\"><path fill-rule=\"evenodd\" d=\"M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z\" clip-rule=\"evenodd\"/></svg>`,
                info: `<svg class=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 20 20\"><path fill-rule=\"evenodd\" d=\"M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z\" clip-rule=\"evenodd\"/></svg>`,
            };

            const colors = {
                success: 'bg-green-50 border-green-200 text-green-800',
                error: 'bg-red-50 border-red-200 text-red-800',
                warning: 'bg-amber-50 border-amber-200 text-amber-800',
                info: 'bg-blue-50 border-blue-200 text-blue-800',
            };

            toast.className = `toast-enter \${colors[type]} border rounded-lg shadow-lg p-4 flex items-start gap-3`;
            toast.innerHTML = `
                <div class=\"flex-shrink-0\">\${icons[type]}</div>
                <div class=\"flex-1\">
                    <p class=\"text-sm font-medium\">\${message}</p>
                </div>
                <button onclick=\"this.parentElement.remove()\" class=\"flex-shrink-0 text-gray-400 hover:text-gray-600\">
                    <svg class=\"w-4 h-4\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                        <path fill-rule=\"evenodd\" d=\"M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z\" clip-rule=\"evenodd\"/>
                    </svg>
                </button>
            `;

            container.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        }

        // Welcome message
        setTimeout(() => {
            showToast('Welcome back, John! Your session is secure.', 'success');
        }, 500);

        // Debug panel functions
        function toggleDebugPanel() {
            const content = document.getElementById('debug-content');
            const text = document.getElementById('debug-toggle-text');
            content.classList.toggle('hidden');
            text.textContent = content.classList.contains('hidden') ? 'Test Errors' : 'Hide';
        }

        async function triggerBankingError(path, body = {}) {
            showToast('Triggering error...', 'info');
            try {
                await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                showToast('Error triggered! Check ErrorWatch dashboard.', 'success');
            } catch (e) {
                showToast('Error sent with replay!', 'success');
            }
        }

        // Display session ID
        setTimeout(() => {
            const sessionId = window.ErrorMonitoringReplay?.getSessionId?.() || 'N/A';
            const display = document.getElementById('session-id-display');
            if (display) display.textContent = sessionId.substring(0, 8) + '...';
        }, 1000);
    </script>

    <!-- Debug Panel (Error Testing) -->
    <div id=\"debug-panel\" class=\"fixed bottom-4 left-4 z-50\">
        <button onclick=\"toggleDebugPanel()\" class=\"bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2\">
            <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4\"/></svg>
            <span id=\"debug-toggle-text\">Test Errors</span>
        </button>
        <div id=\"debug-content\" class=\"hidden mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-72\">
            <h4 class=\"font-semibold text-gray-900 mb-3 flex items-center gap-2\">
                <span class=\"w-2 h-2 rounded-full bg-purple-500 animate-pulse\"></span>
                Trigger Test Errors
            </h4>
            <div class=\"space-y-2\">
                <button onclick=\"triggerBankingError('/banking/api/login', {attempts: 3})\" class=\"w-full text-left px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors\">
                    🔐 Account Locked (3 attempts)
                </button>
                <button onclick=\"triggerBankingError('/banking/api/transfer', {amount: 99999, iban: 'FR76123456', description: 'Test transfer'})\" class=\"w-full text-left px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium transition-colors\">
                    💸 Insufficient Funds
                </button>
                <button onclick=\"triggerBankingError('/banking/api/fraud-check', {iban: 'RU1234567890', amount: 5000})\" class=\"w-full text-left px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors\">
                    🚨 Fraud Detection
                </button>
                <button onclick=\"triggerBankingError('/banking/api/verify-2fa', {code: '000000'})\" class=\"w-full text-left px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-medium transition-colors\">
                    🔑 Invalid 2FA Code
                </button>
            </div>
            <div class=\"mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500\">
                Session: <code class=\"bg-gray-100 px-1 rounded\" id=\"session-id-display\">loading...</code>
            </div>
        </div>
    </div>
</body>
</html>
", "banking/dashboard.html.twig", "/home/kev/Documents/lab/sites/saas/sentry-like/example-client/templates/banking/dashboard.html.twig");
    }
}
