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

/* tests/index.html.twig */
class __TwigTemplate_6a166df9a1df855d7837aee09b1a1f77 extends Template
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
        $__internal_6f47bbe9983af81f1e7450e9a3e3768f->enter($__internal_6f47bbe9983af81f1e7450e9a3e3768f_prof = new \Twig\Profiler\Profile($this->getTemplateName(), "template", "tests/index.html.twig"));

        // line 1
        yield "<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>ErrorWatch Test Suite</title>
    <script src=\"https://cdn.tailwindcss.com\"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        background: 'hsl(240 10% 3.9%)',
                        foreground: 'hsl(0 0% 98%)',
                        card: 'hsl(240 10% 7%)',
                        border: 'hsl(240 3.7% 15.9%)',
                        primary: 'hsl(262 83% 58%)',
                        muted: 'hsl(240 3.7% 15.9%)',
                        'muted-foreground': 'hsl(240 5% 64.9%)',
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: hsl(240 10% 3.9%);
            background-image:
                radial-gradient(ellipse 80% 50% at 50% -20%, hsl(262 83% 58% / 0.15), transparent);
        }
        .gradient-text {
            background: linear-gradient(135deg, hsl(262 83% 68%), hsl(280 85% 65%));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .test-card {
            transition: all 0.2s ease;
        }
        .test-card:hover {
            transform: translateY(-2px);
            border-color: hsl(262 83% 58% / 0.4);
            box-shadow: 0 4px 20px hsl(262 83% 58% / 0.1);
        }
        .test-btn {
            transition: all 0.15s ease;
        }
        .test-btn:hover:not(:disabled) {
            transform: translateY(-1px);
        }
        .test-btn:active:not(:disabled) {
            transform: translateY(0);
        }
        .test-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .severity-fatal { background: linear-gradient(135deg, #dc2626, #b91c1c); }
        .severity-error { background: linear-gradient(135deg, #ea580c, #c2410c); }
        .severity-warning { background: linear-gradient(135deg, #d97706, #b45309); }
        .severity-info { background: linear-gradient(135deg, #0284c7, #0369a1); }
        .loading-spinner {
            border: 2px solid hsl(240 3.7% 25%);
            border-top-color: hsl(262 83% 58%);
            animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .toast {
            animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .category-icon {
            font-size: 1.5rem;
        }
        .stats-counter {
            font-variant-numeric: tabular-nums;
        }
    </style>
</head>
<body class=\"dark min-h-screen text-foreground\">
    <!-- Header -->
    <header class=\"border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50\">
        <div class=\"max-w-7xl mx-auto px-6 py-4\">
            <div class=\"flex items-center justify-between\">
                <div class=\"flex items-center gap-4\">
                    <div class=\"w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-600/20\">
                        <svg class=\"w-6 h-6 text-white\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4\"/>
                        </svg>
                    </div>
                    <div>
                        <h1 class=\"text-xl font-bold gradient-text\">ErrorWatch Test Suite</h1>
                        <p class=\"text-xs text-muted-foreground\">Comprehensive error scenario testing</p>
                    </div>
                </div>
                <!-- Navigation -->
                <nav class=\"hidden md:flex items-center gap-4\">
                    <a href=\"";
        // line 104
        yield $this->extensions['Symfony\Bridge\Twig\Extension\RoutingExtension']->getPath("app_home");
        yield "\" class=\"px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors\">TechStore</a>
                    <a href=\"";
        // line 105
        yield $this->extensions['Symfony\Bridge\Twig\Extension\RoutingExtension']->getPath("app_analytics");
        yield "\" class=\"px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors\">Analytics</a>
                    <a href=\"";
        // line 106
        yield $this->extensions['Symfony\Bridge\Twig\Extension\RoutingExtension']->getPath("app_banking");
        yield "\" class=\"px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors\">Banking</a>
                    <a href=\"";
        // line 107
        yield $this->extensions['Symfony\Bridge\Twig\Extension\RoutingExtension']->getPath("app_tests");
        yield "\" class=\"px-3 py-1.5 text-sm font-medium text-primary border-b-2 border-primary\">Tests</a>
                </nav>
                <div class=\"flex items-center gap-3\">
                    <div id=\"stats\" class=\"hidden sm:flex items-center gap-4 text-sm\">
                        <div class=\"flex items-center gap-2\">
                            <span class=\"text-muted-foreground\">Triggered:</span>
                            <span id=\"triggered-count\" class=\"stats-counter font-bold text-purple-400\">0</span>
                        </div>
                        <div class=\"flex items-center gap-2\">
                            <span class=\"text-muted-foreground\">Failed:</span>
                            <span id=\"failed-count\" class=\"stats-counter font-bold text-red-400\">0</span>
                        </div>
                    </div>
                    <button onclick=\"runAllTests()\" class=\"px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg transition-all text-sm font-medium flex items-center gap-2\">
                        <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 10V3L4 14h7v7l9-11h-7z\"/>
                        </svg>
                        Run All
                    </button>
                </div>
            </div>
        </div>
    </header>

    <main class=\"max-w-7xl mx-auto px-6 py-8\">
        <!-- Quick Info -->
        <div class=\"mb-8 p-4 rounded-xl bg-card border border-border\">
            <div class=\"flex flex-wrap items-center gap-6\">
                <div class=\"flex items-center gap-2\">
                    <div class=\"w-3 h-3 rounded-full severity-fatal\"></div>
                    <span class=\"text-sm text-muted-foreground\">Fatal</span>
                </div>
                <div class=\"flex items-center gap-2\">
                    <div class=\"w-3 h-3 rounded-full severity-error\"></div>
                    <span class=\"text-sm text-muted-foreground\">Error</span>
                </div>
                <div class=\"flex items-center gap-2\">
                    <div class=\"w-3 h-3 rounded-full severity-warning\"></div>
                    <span class=\"text-sm text-muted-foreground\">Warning</span>
                </div>
                <div class=\"flex items-center gap-2\">
                    <div class=\"w-3 h-3 rounded-full severity-info\"></div>
                    <span class=\"text-sm text-muted-foreground\">Info</span>
                </div>
                <div class=\"ml-auto text-sm text-muted-foreground\">
                    Click any button to trigger the error. Errors are sent to ErrorWatch with session replay.
                </div>
            </div>
        </div>

        <!-- Categories Grid -->
        <div id=\"categories-container\" class=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
            <!-- Loading placeholder -->
            <div class=\"col-span-full flex items-center justify-center py-12\">
                <div class=\"loading-spinner w-8 h-8 rounded-full\"></div>
            </div>
        </div>
    </main>

    <!-- Toast Container -->
    <div id=\"toast-container\" class=\"fixed bottom-4 right-4 flex flex-col gap-2 z-50\" style=\"max-width: 400px;\"></div>

    <!-- Session Replay Script -->
    ";
        // line 170
        yield $this->extensions['Makfly\ErrorMonitoringBundle\Twig\ReplayExtension']->getReplayScript();
        yield "

    <script>
        // State
        let scenarios = [];
        let triggeredCount = 0;
        let failedCount = 0;
        let runningTests = new Set();

        // Load scenarios
        async function loadScenarios() {
            try {
                const response = await fetch('/api/scenarios');
                const data = await response.json();
                scenarios = data.categories;
                renderCategories();
            } catch (error) {
                showToast('Failed to load test scenarios', 'error');
            }
        }

        // Render categories
        function renderCategories() {
            const container = document.getElementById('categories-container');
            container.innerHTML = scenarios.map((category, catIndex) => `
                <div class=\"test-card rounded-xl bg-card border border-border overflow-hidden\">
                    <div class=\"p-4 border-b border-border bg-muted/30 flex items-center justify-between\">
                        <div class=\"flex items-center gap-3\">
                            <span class=\"category-icon\">\${category.icon}</span>
                            <div>
                                <h3 class=\"font-semibold text-foreground\">\${category.name}</h3>
                                <p class=\"text-xs text-muted-foreground\">\${category.scenarios.length} scenarios</p>
                            </div>
                        </div>
                        <button
                            onclick=\"runCategory(\${catIndex})\"
                            class=\"px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 border border-border rounded-lg transition-all\"
                        >
                            Run All
                        </button>
                    </div>
                    <div class=\"p-4 grid gap-2\">
                        \${category.scenarios.map((scenario, idx) => `
                            <button
                                id=\"btn-\${catIndex}-\${idx}\"
                                onclick=\"triggerTest('\${scenario.path}', \${catIndex}, \${idx})\"
                                class=\"test-btn w-full text-left px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 hover:border-border flex items-center justify-between group\"
                            >
                                <div class=\"flex items-center gap-3\">
                                    <div class=\"w-2 h-2 rounded-full severity-\${scenario.severity}\"></div>
                                    <span class=\"text-sm font-medium text-foreground\">\${scenario.name}</span>
                                </div>
                                <div class=\"flex items-center gap-2\">
                                    <code class=\"text-xs text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity\">\${scenario.path}</code>
                                    <svg class=\"w-4 h-4 text-muted-foreground\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                                        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5l7 7-7 7\"/>
                                    </svg>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }

        // Trigger a test
        async function triggerTest(path, catIndex, idx) {
            const btnId = `btn-\${catIndex}-\${idx}`;
            const btn = document.getElementById(btnId);

            if (runningTests.has(btnId)) return;
            runningTests.add(btnId);

            // Update button state
            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `
                <div class=\"flex items-center gap-3\">
                    <div class=\"loading-spinner w-4 h-4 rounded-full\"></div>
                    <span class=\"text-sm font-medium text-muted-foreground\">Triggering...</span>
                </div>
            `;

            try {
                const response = await fetch(path);
                // Even if it returns an error page, the error was triggered
                triggeredCount++;
                updateStats();
                showToast(`Triggered: \${path}`, 'success');

                // Show success state briefly
                btn.innerHTML = `
                    <div class=\"flex items-center gap-3\">
                        <svg class=\"w-4 h-4 text-green-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 13l4 4L19 7\"/>
                        </svg>
                        <span class=\"text-sm font-medium text-green-400\">Triggered!</span>
                    </div>
                `;

                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                    runningTests.delete(btnId);
                }, 1500);

            } catch (error) {
                failedCount++;
                updateStats();
                showToast(`Network error: \${path}`, 'error');

                btn.innerHTML = originalHtml;
                btn.disabled = false;
                runningTests.delete(btnId);
            }
        }

        // Run all tests in a category
        async function runCategory(catIndex) {
            const category = scenarios[catIndex];
            for (let i = 0; i < category.scenarios.length; i++) {
                await triggerTest(category.scenarios[i].path, catIndex, i);
                await new Promise(resolve => setTimeout(resolve, 300)); // Small delay
            }
        }

        // Run all tests
        async function runAllTests() {
            showToast('Running all tests...', 'info');
            for (let catIndex = 0; catIndex < scenarios.length; catIndex++) {
                await runCategory(catIndex);
            }
            showToast(`Completed! Triggered \${triggeredCount} errors.`, 'success');
        }

        // Update stats display
        function updateStats() {
            document.getElementById('triggered-count').textContent = triggeredCount;
            document.getElementById('failed-count').textContent = failedCount;
        }

        // Toast notification
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');

            const colors = {
                success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
                error: 'bg-red-500/20 border-red-500/30 text-red-400',
                warning: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
                info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
            };

            toast.className = `toast \${colors[type]} px-4 py-3 rounded-lg border text-sm font-medium`;
            toast.textContent = message;
            container.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // Initialize
        loadScenarios();
    </script>
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
        return "tests/index.html.twig";
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
        return array (  228 => 170,  162 => 107,  158 => 106,  154 => 105,  150 => 104,  45 => 1,);
    }

    public function getSourceContext(): Source
    {
        return new Source("<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>ErrorWatch Test Suite</title>
    <script src=\"https://cdn.tailwindcss.com\"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        background: 'hsl(240 10% 3.9%)',
                        foreground: 'hsl(0 0% 98%)',
                        card: 'hsl(240 10% 7%)',
                        border: 'hsl(240 3.7% 15.9%)',
                        primary: 'hsl(262 83% 58%)',
                        muted: 'hsl(240 3.7% 15.9%)',
                        'muted-foreground': 'hsl(240 5% 64.9%)',
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: hsl(240 10% 3.9%);
            background-image:
                radial-gradient(ellipse 80% 50% at 50% -20%, hsl(262 83% 58% / 0.15), transparent);
        }
        .gradient-text {
            background: linear-gradient(135deg, hsl(262 83% 68%), hsl(280 85% 65%));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .test-card {
            transition: all 0.2s ease;
        }
        .test-card:hover {
            transform: translateY(-2px);
            border-color: hsl(262 83% 58% / 0.4);
            box-shadow: 0 4px 20px hsl(262 83% 58% / 0.1);
        }
        .test-btn {
            transition: all 0.15s ease;
        }
        .test-btn:hover:not(:disabled) {
            transform: translateY(-1px);
        }
        .test-btn:active:not(:disabled) {
            transform: translateY(0);
        }
        .test-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .severity-fatal { background: linear-gradient(135deg, #dc2626, #b91c1c); }
        .severity-error { background: linear-gradient(135deg, #ea580c, #c2410c); }
        .severity-warning { background: linear-gradient(135deg, #d97706, #b45309); }
        .severity-info { background: linear-gradient(135deg, #0284c7, #0369a1); }
        .loading-spinner {
            border: 2px solid hsl(240 3.7% 25%);
            border-top-color: hsl(262 83% 58%);
            animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .toast {
            animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .category-icon {
            font-size: 1.5rem;
        }
        .stats-counter {
            font-variant-numeric: tabular-nums;
        }
    </style>
</head>
<body class=\"dark min-h-screen text-foreground\">
    <!-- Header -->
    <header class=\"border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50\">
        <div class=\"max-w-7xl mx-auto px-6 py-4\">
            <div class=\"flex items-center justify-between\">
                <div class=\"flex items-center gap-4\">
                    <div class=\"w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-600/20\">
                        <svg class=\"w-6 h-6 text-white\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4\"/>
                        </svg>
                    </div>
                    <div>
                        <h1 class=\"text-xl font-bold gradient-text\">ErrorWatch Test Suite</h1>
                        <p class=\"text-xs text-muted-foreground\">Comprehensive error scenario testing</p>
                    </div>
                </div>
                <!-- Navigation -->
                <nav class=\"hidden md:flex items-center gap-4\">
                    <a href=\"{{ path('app_home') }}\" class=\"px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors\">TechStore</a>
                    <a href=\"{{ path('app_analytics') }}\" class=\"px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors\">Analytics</a>
                    <a href=\"{{ path('app_banking') }}\" class=\"px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors\">Banking</a>
                    <a href=\"{{ path('app_tests') }}\" class=\"px-3 py-1.5 text-sm font-medium text-primary border-b-2 border-primary\">Tests</a>
                </nav>
                <div class=\"flex items-center gap-3\">
                    <div id=\"stats\" class=\"hidden sm:flex items-center gap-4 text-sm\">
                        <div class=\"flex items-center gap-2\">
                            <span class=\"text-muted-foreground\">Triggered:</span>
                            <span id=\"triggered-count\" class=\"stats-counter font-bold text-purple-400\">0</span>
                        </div>
                        <div class=\"flex items-center gap-2\">
                            <span class=\"text-muted-foreground\">Failed:</span>
                            <span id=\"failed-count\" class=\"stats-counter font-bold text-red-400\">0</span>
                        </div>
                    </div>
                    <button onclick=\"runAllTests()\" class=\"px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg transition-all text-sm font-medium flex items-center gap-2\">
                        <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 10V3L4 14h7v7l9-11h-7z\"/>
                        </svg>
                        Run All
                    </button>
                </div>
            </div>
        </div>
    </header>

    <main class=\"max-w-7xl mx-auto px-6 py-8\">
        <!-- Quick Info -->
        <div class=\"mb-8 p-4 rounded-xl bg-card border border-border\">
            <div class=\"flex flex-wrap items-center gap-6\">
                <div class=\"flex items-center gap-2\">
                    <div class=\"w-3 h-3 rounded-full severity-fatal\"></div>
                    <span class=\"text-sm text-muted-foreground\">Fatal</span>
                </div>
                <div class=\"flex items-center gap-2\">
                    <div class=\"w-3 h-3 rounded-full severity-error\"></div>
                    <span class=\"text-sm text-muted-foreground\">Error</span>
                </div>
                <div class=\"flex items-center gap-2\">
                    <div class=\"w-3 h-3 rounded-full severity-warning\"></div>
                    <span class=\"text-sm text-muted-foreground\">Warning</span>
                </div>
                <div class=\"flex items-center gap-2\">
                    <div class=\"w-3 h-3 rounded-full severity-info\"></div>
                    <span class=\"text-sm text-muted-foreground\">Info</span>
                </div>
                <div class=\"ml-auto text-sm text-muted-foreground\">
                    Click any button to trigger the error. Errors are sent to ErrorWatch with session replay.
                </div>
            </div>
        </div>

        <!-- Categories Grid -->
        <div id=\"categories-container\" class=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
            <!-- Loading placeholder -->
            <div class=\"col-span-full flex items-center justify-center py-12\">
                <div class=\"loading-spinner w-8 h-8 rounded-full\"></div>
            </div>
        </div>
    </main>

    <!-- Toast Container -->
    <div id=\"toast-container\" class=\"fixed bottom-4 right-4 flex flex-col gap-2 z-50\" style=\"max-width: 400px;\"></div>

    <!-- Session Replay Script -->
    {{ error_monitoring_replay_script()|raw }}

    <script>
        // State
        let scenarios = [];
        let triggeredCount = 0;
        let failedCount = 0;
        let runningTests = new Set();

        // Load scenarios
        async function loadScenarios() {
            try {
                const response = await fetch('/api/scenarios');
                const data = await response.json();
                scenarios = data.categories;
                renderCategories();
            } catch (error) {
                showToast('Failed to load test scenarios', 'error');
            }
        }

        // Render categories
        function renderCategories() {
            const container = document.getElementById('categories-container');
            container.innerHTML = scenarios.map((category, catIndex) => `
                <div class=\"test-card rounded-xl bg-card border border-border overflow-hidden\">
                    <div class=\"p-4 border-b border-border bg-muted/30 flex items-center justify-between\">
                        <div class=\"flex items-center gap-3\">
                            <span class=\"category-icon\">\${category.icon}</span>
                            <div>
                                <h3 class=\"font-semibold text-foreground\">\${category.name}</h3>
                                <p class=\"text-xs text-muted-foreground\">\${category.scenarios.length} scenarios</p>
                            </div>
                        </div>
                        <button
                            onclick=\"runCategory(\${catIndex})\"
                            class=\"px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 border border-border rounded-lg transition-all\"
                        >
                            Run All
                        </button>
                    </div>
                    <div class=\"p-4 grid gap-2\">
                        \${category.scenarios.map((scenario, idx) => `
                            <button
                                id=\"btn-\${catIndex}-\${idx}\"
                                onclick=\"triggerTest('\${scenario.path}', \${catIndex}, \${idx})\"
                                class=\"test-btn w-full text-left px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 hover:border-border flex items-center justify-between group\"
                            >
                                <div class=\"flex items-center gap-3\">
                                    <div class=\"w-2 h-2 rounded-full severity-\${scenario.severity}\"></div>
                                    <span class=\"text-sm font-medium text-foreground\">\${scenario.name}</span>
                                </div>
                                <div class=\"flex items-center gap-2\">
                                    <code class=\"text-xs text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity\">\${scenario.path}</code>
                                    <svg class=\"w-4 h-4 text-muted-foreground\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                                        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5l7 7-7 7\"/>
                                    </svg>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }

        // Trigger a test
        async function triggerTest(path, catIndex, idx) {
            const btnId = `btn-\${catIndex}-\${idx}`;
            const btn = document.getElementById(btnId);

            if (runningTests.has(btnId)) return;
            runningTests.add(btnId);

            // Update button state
            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `
                <div class=\"flex items-center gap-3\">
                    <div class=\"loading-spinner w-4 h-4 rounded-full\"></div>
                    <span class=\"text-sm font-medium text-muted-foreground\">Triggering...</span>
                </div>
            `;

            try {
                const response = await fetch(path);
                // Even if it returns an error page, the error was triggered
                triggeredCount++;
                updateStats();
                showToast(`Triggered: \${path}`, 'success');

                // Show success state briefly
                btn.innerHTML = `
                    <div class=\"flex items-center gap-3\">
                        <svg class=\"w-4 h-4 text-green-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 13l4 4L19 7\"/>
                        </svg>
                        <span class=\"text-sm font-medium text-green-400\">Triggered!</span>
                    </div>
                `;

                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                    runningTests.delete(btnId);
                }, 1500);

            } catch (error) {
                failedCount++;
                updateStats();
                showToast(`Network error: \${path}`, 'error');

                btn.innerHTML = originalHtml;
                btn.disabled = false;
                runningTests.delete(btnId);
            }
        }

        // Run all tests in a category
        async function runCategory(catIndex) {
            const category = scenarios[catIndex];
            for (let i = 0; i < category.scenarios.length; i++) {
                await triggerTest(category.scenarios[i].path, catIndex, i);
                await new Promise(resolve => setTimeout(resolve, 300)); // Small delay
            }
        }

        // Run all tests
        async function runAllTests() {
            showToast('Running all tests...', 'info');
            for (let catIndex = 0; catIndex < scenarios.length; catIndex++) {
                await runCategory(catIndex);
            }
            showToast(`Completed! Triggered \${triggeredCount} errors.`, 'success');
        }

        // Update stats display
        function updateStats() {
            document.getElementById('triggered-count').textContent = triggeredCount;
            document.getElementById('failed-count').textContent = failedCount;
        }

        // Toast notification
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');

            const colors = {
                success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
                error: 'bg-red-500/20 border-red-500/30 text-red-400',
                warning: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
                info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
            };

            toast.className = `toast \${colors[type]} px-4 py-3 rounded-lg border text-sm font-medium`;
            toast.textContent = message;
            container.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // Initialize
        loadScenarios();
    </script>
</body>
</html>
", "tests/index.html.twig", "/home/kev/Documents/lab/sites/saas/sentry-like/example-client/templates/tests/index.html.twig");
    }
}
