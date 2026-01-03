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

/* test/dashboard.html.twig */
class __TwigTemplate_328b8659e5d498c2932a97755374cd2b extends Template
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
        $__internal_6f47bbe9983af81f1e7450e9a3e3768f->enter($__internal_6f47bbe9983af81f1e7450e9a3e3768f_prof = new \Twig\Profiler\Profile($this->getTemplateName(), "template", "test/dashboard.html.twig"));

        // line 1
        yield "<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>TechStore - Premium Electronics</title>
    <script src=\"https://cdn.tailwindcss.com\"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#2563eb',
                        secondary: '#1e40af',
                    }
                }
            }
        }
    </script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .product-card {
            transition: all 0.3s ease;
        }
        .product-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }
        .btn-primary {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
            transform: translateY(-1px);
        }
        .cart-sidebar {
            transform: translateX(100%);
            transition: transform 0.3s ease;
        }
        .cart-sidebar.open {
            transform: translateX(0);
        }
        .cart-backdrop {
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .cart-backdrop.show {
            opacity: 1;
            pointer-events: all;
        }
        .badge {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .checkout-form {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s ease;
        }
        .checkout-form.open {
            max-height: 600px;
        }
        .shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        .toast {
            animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    </style>
</head>
<body class=\"bg-gray-50\">
    <!-- Header -->
    <header class=\"bg-white shadow-sm sticky top-0 z-40\">
        <div class=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
            <div class=\"flex items-center justify-between h-16\">
                <!-- Logo -->
                <div class=\"flex items-center gap-2\">
                    <div class=\"w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg\">
                        <svg class=\"w-6 h-6 text-white\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z\"/>
                        </svg>
                    </div>
                    <div>
                        <h1 class=\"text-xl font-bold text-gray-900\">TechStore</h1>
                        <p class=\"text-xs text-gray-500\">Premium Electronics</p>
                    </div>
                </div>

                <!-- Navigation -->
                <nav class=\"hidden md:flex items-center gap-6\">
                    <a href=\"";
        // line 114
        yield $this->extensions['Symfony\Bridge\Twig\Extension\RoutingExtension']->getPath("app_home");
        yield "\" class=\"text-sm font-medium text-blue-600 hover:text-blue-700\">TechStore</a>
                    <a href=\"";
        // line 115
        yield $this->extensions['Symfony\Bridge\Twig\Extension\RoutingExtension']->getPath("app_analytics");
        yield "\" class=\"text-sm font-medium text-gray-700 hover:text-blue-600\">Analytics</a>
                    <a href=\"";
        // line 116
        yield $this->extensions['Symfony\Bridge\Twig\Extension\RoutingExtension']->getPath("app_banking");
        yield "\" class=\"text-sm font-medium text-gray-700 hover:text-blue-600\">Banking</a>
                    <a href=\"";
        // line 117
        yield $this->extensions['Symfony\Bridge\Twig\Extension\RoutingExtension']->getPath("app_tests");
        yield "\" class=\"text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1\">
                        <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2\"/></svg>
                        Tests
                    </a>
                </nav>

                <!-- Cart Button -->
                <button onclick=\"toggleCart()\" class=\"relative btn-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2\">
                    <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z\"/>
                    </svg>
                    <span class=\"hidden sm:inline\">Cart</span>
                    <span id=\"cart-count\" class=\"badge absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center\">0</span>
                </button>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        <!-- Hero Banner -->
        <div class=\"bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-8 text-white\">
            <h2 class=\"text-3xl font-bold mb-2\">New Year Sale</h2>
            <p class=\"text-blue-100 mb-4\">Up to 30% off on selected products</p>
            <button class=\"bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition\">Shop Now</button>
        </div>

        <!-- Products Grid -->
        <div class=\"mb-8\">
            <h3 class=\"text-2xl font-bold text-gray-900 mb-6\">Featured Products</h3>
            <div id=\"products-grid\" class=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6\">
                <!-- Products will be rendered here -->
            </div>
        </div>
    </main>

    <!-- Cart Sidebar -->
    <div id=\"cart-backdrop\" class=\"cart-backdrop fixed inset-0 bg-black bg-opacity-50 z-40\" onclick=\"toggleCart()\"></div>
    <div id=\"cart-sidebar\" class=\"cart-sidebar fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50\">
        <div class=\"flex flex-col h-full\">
            <!-- Cart Header -->
            <div class=\"flex items-center justify-between p-6 border-b\">
                <h3 class=\"text-lg font-bold text-gray-900\">Shopping Cart</h3>
                <button onclick=\"toggleCart()\" class=\"text-gray-400 hover:text-gray-600\">
                    <svg class=\"w-6 h-6\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 18L18 6M6 6l12 12\"/>
                    </svg>
                </button>
            </div>

            <!-- Cart Items -->
            <div id=\"cart-items\" class=\"flex-1 overflow-y-auto p-6\">
                <div class=\"text-center text-gray-500 py-12\">
                    <svg class=\"w-16 h-16 mx-auto mb-4 text-gray-300\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z\"/>
                    </svg>
                    <p class=\"font-medium\">Your cart is empty</p>
                </div>
            </div>

            <!-- Cart Footer -->
            <div class=\"border-t p-6 space-y-4\">
                <!-- Subtotal -->
                <div class=\"flex items-center justify-between text-lg font-semibold\">
                    <span class=\"text-gray-900\">Subtotal</span>
                    <span id=\"cart-total\" class=\"text-gray-900\">\$0.00</span>
                </div>

                <!-- Checkout Button -->
                <button onclick=\"toggleCheckout()\" class=\"w-full btn-primary text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed\" id=\"checkout-btn\" disabled>
                    Proceed to Checkout
                </button>

                <!-- Checkout Form -->
                <div id=\"checkout-form\" class=\"checkout-form\">
                    <div class=\"border-t pt-4 space-y-4\">
                        <h4 class=\"font-semibold text-gray-900\">Checkout</h4>

                        <!-- Email -->
                        <div>
                            <label class=\"block text-sm font-medium text-gray-700 mb-1\">Email</label>
                            <input type=\"email\" id=\"checkout-email\" placeholder=\"your@email.com\" class=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500\">
                            <p id=\"email-error\" class=\"text-red-500 text-xs mt-1 hidden\">Please enter a valid email</p>
                        </div>

                        <!-- Card Number -->
                        <div>
                            <label class=\"block text-sm font-medium text-gray-700 mb-1\">Card Number</label>
                            <input type=\"text\" id=\"checkout-card\" placeholder=\"1234 5678 9012 3456\" maxlength=\"19\" class=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500\">
                        </div>

                        <!-- Card Details -->
                        <div class=\"grid grid-cols-2 gap-4\">
                            <div>
                                <label class=\"block text-sm font-medium text-gray-700 mb-1\">Expiry</label>
                                <input type=\"text\" placeholder=\"MM/YY\" maxlength=\"5\" class=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500\">
                            </div>
                            <div>
                                <label class=\"block text-sm font-medium text-gray-700 mb-1\">CVV</label>
                                <input type=\"text\" placeholder=\"123\" maxlength=\"3\" class=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500\">
                            </div>
                        </div>

                        <!-- Pay Button -->
                        <button onclick=\"processPayment()\" id=\"pay-btn\" class=\"w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition\">
                            <span id=\"pay-text\">Pay <span id=\"pay-amount\">\$0.00</span></span>
                            <span id=\"pay-loading\" class=\"hidden\">Processing...</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id=\"toast-container\" class=\"fixed bottom-4 right-4 flex flex-col gap-2 z-50\"></div>

    <script>
        // Products Data
        const products = [
            {
                id: 1,
                name: 'iPhone 15 Pro',
                price: 999,
                image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop',
                category: 'Smartphones',
                inStock: true,
                badge: 'New'
            },
            {
                id: 2,
                name: 'MacBook Pro 16\"',
                price: 2499,
                image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
                category: 'Laptops',
                inStock: true,
                badge: 'Popular'
            },
            {
                id: 3,
                name: 'AirPods Pro',
                price: 249,
                image: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400&h=400&fit=crop',
                category: 'Audio',
                inStock: true,
                badge: null
            },
            {
                id: 4,
                name: 'iPad Air',
                price: 599,
                image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop',
                category: 'Tablets',
                inStock: false,
                badge: 'Out of Stock'
            },
            {
                id: 5,
                name: 'Apple Watch Ultra',
                price: 799,
                image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop',
                category: 'Wearables',
                inStock: true,
                badge: null
            },
            {
                id: 6,
                name: 'Magic Keyboard',
                price: 99,
                image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop',
                category: 'Accessories',
                inStock: true,
                badge: null
            },
            {
                id: 7,
                name: 'Studio Display',
                price: 1599,
                image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop',
                category: 'Displays',
                inStock: true,
                badge: null
            },
            {
                id: 8,
                name: 'HomePod mini',
                price: 99,
                image: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=400&h=400&fit=crop',
                category: 'Audio',
                inStock: true,
                badge: 'Sale'
            }
        ];

        // Cart State
        let cart = [];

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            renderProducts();
            formatCardInput();
        });

        // Render Products
        function renderProducts() {
            const grid = document.getElementById('products-grid');
            grid.innerHTML = products.map(product => `
                <div class=\"product-card bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200\">
                    <div class=\"relative aspect-square bg-gray-100\">
                        <img src=\"\${product.image}\" alt=\"\${product.name}\" class=\"w-full h-full object-cover\" loading=\"lazy\">
                        \${product.badge ? `
                            <span class=\"absolute top-2 right-2 \${
                                product.badge === 'Out of Stock' ? 'bg-red-500' :
                                product.badge === 'New' ? 'bg-blue-500' :
                                product.badge === 'Popular' ? 'bg-purple-500' :
                                'bg-green-500'
                            } text-white text-xs px-2 py-1 rounded-full font-medium\">
                                \${product.badge}
                            </span>
                        ` : ''}
                    </div>
                    <div class=\"p-4\">
                        <p class=\"text-xs text-gray-500 mb-1\">\${product.category}</p>
                        <h4 class=\"font-semibold text-gray-900 mb-2\">\${product.name}</h4>
                        <div class=\"flex items-center justify-between\">
                            <span class=\"text-xl font-bold text-gray-900\">\$\${product.price.toLocaleString()}</span>
                            <button
                                onclick=\"addToCart(\${product.id})\"
                                class=\"\${product.inStock ? 'btn-primary' : 'bg-gray-300 cursor-not-allowed'} text-white px-4 py-2 rounded-lg text-sm font-medium\"
                                \${!product.inStock ? 'disabled' : ''}
                            >
                                \${product.inStock ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Add to Cart
        async function addToCart(productId) {
            const product = products.find(p => p.id === productId);

            if (!product.inStock) {
                // Trigger OutOfStockException
                try {
                    const response = await fetch('/api/error/out-of-stock', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId, productName: product.name })
                    });

                    if (!response.ok) {
                        showToast(`\${product.name} is out of stock`, 'error');
                    }
                } catch (e) {
                    showToast(`\${product.name} is out of stock`, 'error');
                }
                return;
            }

            cart.push(product);
            updateCart();
            showToast(`\${product.name} added to cart`, 'success');
        }

        // Update Cart UI
        function updateCart() {
            const countBadge = document.getElementById('cart-count');
            const cartItems = document.getElementById('cart-items');
            const cartTotal = document.getElementById('cart-total');
            const checkoutBtn = document.getElementById('checkout-btn');
            const payAmount = document.getElementById('pay-amount');

            countBadge.textContent = cart.length;

            if (cart.length === 0) {
                cartItems.innerHTML = `
                    <div class=\"text-center text-gray-500 py-12\">
                        <svg class=\"w-16 h-16 mx-auto mb-4 text-gray-300\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z\"/>
                        </svg>
                        <p class=\"font-medium\">Your cart is empty</p>
                    </div>
                `;
                checkoutBtn.disabled = true;
                return;
            }

            checkoutBtn.disabled = false;

            const total = cart.reduce((sum, item) => sum + item.price, 0);
            cartTotal.textContent = `\$\${total.toLocaleString()}`;
            payAmount.textContent = `\$\${total.toLocaleString()}`;

            cartItems.innerHTML = cart.map((item, index) => `
                <div class=\"flex items-center gap-4 mb-4 pb-4 border-b\">
                    <img src=\"\${item.image}\" alt=\"\${item.name}\" class=\"w-16 h-16 object-cover rounded-lg\">
                    <div class=\"flex-1\">
                        <h4 class=\"font-medium text-gray-900\">\${item.name}</h4>
                        <p class=\"text-sm text-gray-500\">\${item.category}</p>
                        <p class=\"text-sm font-semibold text-gray-900 mt-1\">\$\${item.price.toLocaleString()}</p>
                    </div>
                    <button onclick=\"removeFromCart(\${index})\" class=\"text-gray-400 hover:text-red-500\">
                        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16\"/>
                        </svg>
                    </button>
                </div>
            `).join('');
        }

        // Remove from Cart
        function removeFromCart(index) {
            cart.splice(index, 1);
            updateCart();
            showToast('Item removed from cart', 'info');
        }

        // Toggle Cart
        function toggleCart() {
            const sidebar = document.getElementById('cart-sidebar');
            const backdrop = document.getElementById('cart-backdrop');
            sidebar.classList.toggle('open');
            backdrop.classList.toggle('show');
        }

        // Toggle Checkout Form
        function toggleCheckout() {
            const form = document.getElementById('checkout-form');
            form.classList.toggle('open');
        }

        // Validate Email
        async function validateEmail(email) {
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+\$/;

            if (!emailRegex.test(email)) {
                // Trigger ValidationException
                try {
                    const response = await fetch('/api/error/validation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, field: 'email' })
                    });

                    if (!response.ok) {
                        document.getElementById('email-error').classList.remove('hidden');
                        return false;
                    }
                } catch (e) {
                    document.getElementById('email-error').classList.remove('hidden');
                    return false;
                }
            }

            document.getElementById('email-error').classList.add('hidden');
            return true;
        }

        // Process Payment
        async function processPayment() {
            const email = document.getElementById('checkout-email').value;
            const card = document.getElementById('checkout-card').value;

            // Validate email
            const isValidEmail = await validateEmail(email);
            if (!isValidEmail) {
                showToast('Please enter a valid email address', 'error');
                return;
            }

            if (!card) {
                showToast('Please enter card details', 'error');
                return;
            }

            // Show loading
            const payBtn = document.getElementById('pay-btn');
            const payText = document.getElementById('pay-text');
            const payLoading = document.getElementById('pay-loading');

            payBtn.disabled = true;
            payText.classList.add('hidden');
            payLoading.classList.remove('hidden');

            // Trigger PaymentGatewayException
            try {
                const total = cart.reduce((sum, item) => sum + item.price, 0);
                const response = await fetch('/api/error/payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        amount: total,
                        cart: cart.map(item => ({ id: item.id, name: item.name, price: item.price }))
                    })
                });

                if (!response.ok) {
                    throw new Error('Payment failed');
                }
            } catch (e) {
                showToast('Payment gateway timeout - Please try again', 'error');
            } finally {
                payBtn.disabled = false;
                payText.classList.remove('hidden');
                payLoading.classList.add('hidden');
            }
        }

        // Format Card Input
        function formatCardInput() {
            const cardInput = document.getElementById('checkout-card');
            cardInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\\s/g, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formattedValue;
            });
        }

        // Show Toast
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');

            const colors = {
                info: 'bg-blue-500',
                success: 'bg-green-500',
                error: 'bg-red-500',
                warning: 'bg-amber-500',
            };

            toast.className = `toast \${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm`;
            toast.textContent = message;
            container.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }
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
                <button onclick=\"triggerError('/test/ecommerce/payment-failed')\" class=\"w-full text-left px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors\">
                    💳 Payment Failed (Fatal)
                </button>
                <button onclick=\"triggerError('/test/ecommerce/out-of-stock')\" class=\"w-full text-left px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium transition-colors\">
                    📦 Out of Stock (Warning)
                </button>
                <button onclick=\"triggerError('/test/http/500')\" class=\"w-full text-left px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors\">
                    🔥 Server Error 500
                </button>
                <button onclick=\"triggerError('/test/db/timeout')\" class=\"w-full text-left px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-medium transition-colors\">
                    ⏱️ Database Timeout
                </button>
            </div>
            <div class=\"mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500\">
                Session: <code class=\"bg-gray-100 px-1 rounded\" id=\"session-id-display\">loading...</code>
            </div>
        </div>
    </div>

    <script>
        function toggleDebugPanel() {
            const content = document.getElementById('debug-content');
            const text = document.getElementById('debug-toggle-text');
            content.classList.toggle('hidden');
            text.textContent = content.classList.contains('hidden') ? 'Test Errors' : 'Hide';
        }

        async function triggerError(path) {
            showToast('Triggering error...', 'info');
            try {
                await fetch(path);
                showToast('Error triggered! Check ErrorWatch dashboard.', 'success');
            } catch (e) {
                showToast('Error sent with replay!', 'success');
            }
        }

        // Display session ID
        setTimeout(() => {
            const sessionId = window.ErrorMonitoringReplay?.getSessionId?.() || 'N/A';
            document.getElementById('session-id-display').textContent = sessionId.substring(0, 8) + '...';
        }, 1000);
    </script>

    <!-- Session Replay Script -->
    ";
        // line 620
        yield $this->extensions['Makfly\ErrorMonitoringBundle\Twig\ReplayExtension']->getReplayScript();
        yield "
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
        return "test/dashboard.html.twig";
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
        return array (  678 => 620,  172 => 117,  168 => 116,  164 => 115,  160 => 114,  45 => 1,);
    }

    public function getSourceContext(): Source
    {
        return new Source("<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>TechStore - Premium Electronics</title>
    <script src=\"https://cdn.tailwindcss.com\"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#2563eb',
                        secondary: '#1e40af',
                    }
                }
            }
        }
    </script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .product-card {
            transition: all 0.3s ease;
        }
        .product-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }
        .btn-primary {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
            transform: translateY(-1px);
        }
        .cart-sidebar {
            transform: translateX(100%);
            transition: transform 0.3s ease;
        }
        .cart-sidebar.open {
            transform: translateX(0);
        }
        .cart-backdrop {
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .cart-backdrop.show {
            opacity: 1;
            pointer-events: all;
        }
        .badge {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .checkout-form {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s ease;
        }
        .checkout-form.open {
            max-height: 600px;
        }
        .shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        .toast {
            animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    </style>
</head>
<body class=\"bg-gray-50\">
    <!-- Header -->
    <header class=\"bg-white shadow-sm sticky top-0 z-40\">
        <div class=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
            <div class=\"flex items-center justify-between h-16\">
                <!-- Logo -->
                <div class=\"flex items-center gap-2\">
                    <div class=\"w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg\">
                        <svg class=\"w-6 h-6 text-white\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z\"/>
                        </svg>
                    </div>
                    <div>
                        <h1 class=\"text-xl font-bold text-gray-900\">TechStore</h1>
                        <p class=\"text-xs text-gray-500\">Premium Electronics</p>
                    </div>
                </div>

                <!-- Navigation -->
                <nav class=\"hidden md:flex items-center gap-6\">
                    <a href=\"{{ path('app_home') }}\" class=\"text-sm font-medium text-blue-600 hover:text-blue-700\">TechStore</a>
                    <a href=\"{{ path('app_analytics') }}\" class=\"text-sm font-medium text-gray-700 hover:text-blue-600\">Analytics</a>
                    <a href=\"{{ path('app_banking') }}\" class=\"text-sm font-medium text-gray-700 hover:text-blue-600\">Banking</a>
                    <a href=\"{{ path('app_tests') }}\" class=\"text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1\">
                        <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2\"/></svg>
                        Tests
                    </a>
                </nav>

                <!-- Cart Button -->
                <button onclick=\"toggleCart()\" class=\"relative btn-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2\">
                    <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z\"/>
                    </svg>
                    <span class=\"hidden sm:inline\">Cart</span>
                    <span id=\"cart-count\" class=\"badge absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center\">0</span>
                </button>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        <!-- Hero Banner -->
        <div class=\"bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-8 text-white\">
            <h2 class=\"text-3xl font-bold mb-2\">New Year Sale</h2>
            <p class=\"text-blue-100 mb-4\">Up to 30% off on selected products</p>
            <button class=\"bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition\">Shop Now</button>
        </div>

        <!-- Products Grid -->
        <div class=\"mb-8\">
            <h3 class=\"text-2xl font-bold text-gray-900 mb-6\">Featured Products</h3>
            <div id=\"products-grid\" class=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6\">
                <!-- Products will be rendered here -->
            </div>
        </div>
    </main>

    <!-- Cart Sidebar -->
    <div id=\"cart-backdrop\" class=\"cart-backdrop fixed inset-0 bg-black bg-opacity-50 z-40\" onclick=\"toggleCart()\"></div>
    <div id=\"cart-sidebar\" class=\"cart-sidebar fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50\">
        <div class=\"flex flex-col h-full\">
            <!-- Cart Header -->
            <div class=\"flex items-center justify-between p-6 border-b\">
                <h3 class=\"text-lg font-bold text-gray-900\">Shopping Cart</h3>
                <button onclick=\"toggleCart()\" class=\"text-gray-400 hover:text-gray-600\">
                    <svg class=\"w-6 h-6\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 18L18 6M6 6l12 12\"/>
                    </svg>
                </button>
            </div>

            <!-- Cart Items -->
            <div id=\"cart-items\" class=\"flex-1 overflow-y-auto p-6\">
                <div class=\"text-center text-gray-500 py-12\">
                    <svg class=\"w-16 h-16 mx-auto mb-4 text-gray-300\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z\"/>
                    </svg>
                    <p class=\"font-medium\">Your cart is empty</p>
                </div>
            </div>

            <!-- Cart Footer -->
            <div class=\"border-t p-6 space-y-4\">
                <!-- Subtotal -->
                <div class=\"flex items-center justify-between text-lg font-semibold\">
                    <span class=\"text-gray-900\">Subtotal</span>
                    <span id=\"cart-total\" class=\"text-gray-900\">\$0.00</span>
                </div>

                <!-- Checkout Button -->
                <button onclick=\"toggleCheckout()\" class=\"w-full btn-primary text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed\" id=\"checkout-btn\" disabled>
                    Proceed to Checkout
                </button>

                <!-- Checkout Form -->
                <div id=\"checkout-form\" class=\"checkout-form\">
                    <div class=\"border-t pt-4 space-y-4\">
                        <h4 class=\"font-semibold text-gray-900\">Checkout</h4>

                        <!-- Email -->
                        <div>
                            <label class=\"block text-sm font-medium text-gray-700 mb-1\">Email</label>
                            <input type=\"email\" id=\"checkout-email\" placeholder=\"your@email.com\" class=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500\">
                            <p id=\"email-error\" class=\"text-red-500 text-xs mt-1 hidden\">Please enter a valid email</p>
                        </div>

                        <!-- Card Number -->
                        <div>
                            <label class=\"block text-sm font-medium text-gray-700 mb-1\">Card Number</label>
                            <input type=\"text\" id=\"checkout-card\" placeholder=\"1234 5678 9012 3456\" maxlength=\"19\" class=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500\">
                        </div>

                        <!-- Card Details -->
                        <div class=\"grid grid-cols-2 gap-4\">
                            <div>
                                <label class=\"block text-sm font-medium text-gray-700 mb-1\">Expiry</label>
                                <input type=\"text\" placeholder=\"MM/YY\" maxlength=\"5\" class=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500\">
                            </div>
                            <div>
                                <label class=\"block text-sm font-medium text-gray-700 mb-1\">CVV</label>
                                <input type=\"text\" placeholder=\"123\" maxlength=\"3\" class=\"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500\">
                            </div>
                        </div>

                        <!-- Pay Button -->
                        <button onclick=\"processPayment()\" id=\"pay-btn\" class=\"w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition\">
                            <span id=\"pay-text\">Pay <span id=\"pay-amount\">\$0.00</span></span>
                            <span id=\"pay-loading\" class=\"hidden\">Processing...</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id=\"toast-container\" class=\"fixed bottom-4 right-4 flex flex-col gap-2 z-50\"></div>

    <script>
        // Products Data
        const products = [
            {
                id: 1,
                name: 'iPhone 15 Pro',
                price: 999,
                image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop',
                category: 'Smartphones',
                inStock: true,
                badge: 'New'
            },
            {
                id: 2,
                name: 'MacBook Pro 16\"',
                price: 2499,
                image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
                category: 'Laptops',
                inStock: true,
                badge: 'Popular'
            },
            {
                id: 3,
                name: 'AirPods Pro',
                price: 249,
                image: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400&h=400&fit=crop',
                category: 'Audio',
                inStock: true,
                badge: null
            },
            {
                id: 4,
                name: 'iPad Air',
                price: 599,
                image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop',
                category: 'Tablets',
                inStock: false,
                badge: 'Out of Stock'
            },
            {
                id: 5,
                name: 'Apple Watch Ultra',
                price: 799,
                image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop',
                category: 'Wearables',
                inStock: true,
                badge: null
            },
            {
                id: 6,
                name: 'Magic Keyboard',
                price: 99,
                image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop',
                category: 'Accessories',
                inStock: true,
                badge: null
            },
            {
                id: 7,
                name: 'Studio Display',
                price: 1599,
                image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop',
                category: 'Displays',
                inStock: true,
                badge: null
            },
            {
                id: 8,
                name: 'HomePod mini',
                price: 99,
                image: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=400&h=400&fit=crop',
                category: 'Audio',
                inStock: true,
                badge: 'Sale'
            }
        ];

        // Cart State
        let cart = [];

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            renderProducts();
            formatCardInput();
        });

        // Render Products
        function renderProducts() {
            const grid = document.getElementById('products-grid');
            grid.innerHTML = products.map(product => `
                <div class=\"product-card bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200\">
                    <div class=\"relative aspect-square bg-gray-100\">
                        <img src=\"\${product.image}\" alt=\"\${product.name}\" class=\"w-full h-full object-cover\" loading=\"lazy\">
                        \${product.badge ? `
                            <span class=\"absolute top-2 right-2 \${
                                product.badge === 'Out of Stock' ? 'bg-red-500' :
                                product.badge === 'New' ? 'bg-blue-500' :
                                product.badge === 'Popular' ? 'bg-purple-500' :
                                'bg-green-500'
                            } text-white text-xs px-2 py-1 rounded-full font-medium\">
                                \${product.badge}
                            </span>
                        ` : ''}
                    </div>
                    <div class=\"p-4\">
                        <p class=\"text-xs text-gray-500 mb-1\">\${product.category}</p>
                        <h4 class=\"font-semibold text-gray-900 mb-2\">\${product.name}</h4>
                        <div class=\"flex items-center justify-between\">
                            <span class=\"text-xl font-bold text-gray-900\">\$\${product.price.toLocaleString()}</span>
                            <button
                                onclick=\"addToCart(\${product.id})\"
                                class=\"\${product.inStock ? 'btn-primary' : 'bg-gray-300 cursor-not-allowed'} text-white px-4 py-2 rounded-lg text-sm font-medium\"
                                \${!product.inStock ? 'disabled' : ''}
                            >
                                \${product.inStock ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Add to Cart
        async function addToCart(productId) {
            const product = products.find(p => p.id === productId);

            if (!product.inStock) {
                // Trigger OutOfStockException
                try {
                    const response = await fetch('/api/error/out-of-stock', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId, productName: product.name })
                    });

                    if (!response.ok) {
                        showToast(`\${product.name} is out of stock`, 'error');
                    }
                } catch (e) {
                    showToast(`\${product.name} is out of stock`, 'error');
                }
                return;
            }

            cart.push(product);
            updateCart();
            showToast(`\${product.name} added to cart`, 'success');
        }

        // Update Cart UI
        function updateCart() {
            const countBadge = document.getElementById('cart-count');
            const cartItems = document.getElementById('cart-items');
            const cartTotal = document.getElementById('cart-total');
            const checkoutBtn = document.getElementById('checkout-btn');
            const payAmount = document.getElementById('pay-amount');

            countBadge.textContent = cart.length;

            if (cart.length === 0) {
                cartItems.innerHTML = `
                    <div class=\"text-center text-gray-500 py-12\">
                        <svg class=\"w-16 h-16 mx-auto mb-4 text-gray-300\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z\"/>
                        </svg>
                        <p class=\"font-medium\">Your cart is empty</p>
                    </div>
                `;
                checkoutBtn.disabled = true;
                return;
            }

            checkoutBtn.disabled = false;

            const total = cart.reduce((sum, item) => sum + item.price, 0);
            cartTotal.textContent = `\$\${total.toLocaleString()}`;
            payAmount.textContent = `\$\${total.toLocaleString()}`;

            cartItems.innerHTML = cart.map((item, index) => `
                <div class=\"flex items-center gap-4 mb-4 pb-4 border-b\">
                    <img src=\"\${item.image}\" alt=\"\${item.name}\" class=\"w-16 h-16 object-cover rounded-lg\">
                    <div class=\"flex-1\">
                        <h4 class=\"font-medium text-gray-900\">\${item.name}</h4>
                        <p class=\"text-sm text-gray-500\">\${item.category}</p>
                        <p class=\"text-sm font-semibold text-gray-900 mt-1\">\$\${item.price.toLocaleString()}</p>
                    </div>
                    <button onclick=\"removeFromCart(\${index})\" class=\"text-gray-400 hover:text-red-500\">
                        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16\"/>
                        </svg>
                    </button>
                </div>
            `).join('');
        }

        // Remove from Cart
        function removeFromCart(index) {
            cart.splice(index, 1);
            updateCart();
            showToast('Item removed from cart', 'info');
        }

        // Toggle Cart
        function toggleCart() {
            const sidebar = document.getElementById('cart-sidebar');
            const backdrop = document.getElementById('cart-backdrop');
            sidebar.classList.toggle('open');
            backdrop.classList.toggle('show');
        }

        // Toggle Checkout Form
        function toggleCheckout() {
            const form = document.getElementById('checkout-form');
            form.classList.toggle('open');
        }

        // Validate Email
        async function validateEmail(email) {
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+\$/;

            if (!emailRegex.test(email)) {
                // Trigger ValidationException
                try {
                    const response = await fetch('/api/error/validation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, field: 'email' })
                    });

                    if (!response.ok) {
                        document.getElementById('email-error').classList.remove('hidden');
                        return false;
                    }
                } catch (e) {
                    document.getElementById('email-error').classList.remove('hidden');
                    return false;
                }
            }

            document.getElementById('email-error').classList.add('hidden');
            return true;
        }

        // Process Payment
        async function processPayment() {
            const email = document.getElementById('checkout-email').value;
            const card = document.getElementById('checkout-card').value;

            // Validate email
            const isValidEmail = await validateEmail(email);
            if (!isValidEmail) {
                showToast('Please enter a valid email address', 'error');
                return;
            }

            if (!card) {
                showToast('Please enter card details', 'error');
                return;
            }

            // Show loading
            const payBtn = document.getElementById('pay-btn');
            const payText = document.getElementById('pay-text');
            const payLoading = document.getElementById('pay-loading');

            payBtn.disabled = true;
            payText.classList.add('hidden');
            payLoading.classList.remove('hidden');

            // Trigger PaymentGatewayException
            try {
                const total = cart.reduce((sum, item) => sum + item.price, 0);
                const response = await fetch('/api/error/payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        amount: total,
                        cart: cart.map(item => ({ id: item.id, name: item.name, price: item.price }))
                    })
                });

                if (!response.ok) {
                    throw new Error('Payment failed');
                }
            } catch (e) {
                showToast('Payment gateway timeout - Please try again', 'error');
            } finally {
                payBtn.disabled = false;
                payText.classList.remove('hidden');
                payLoading.classList.add('hidden');
            }
        }

        // Format Card Input
        function formatCardInput() {
            const cardInput = document.getElementById('checkout-card');
            cardInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\\s/g, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formattedValue;
            });
        }

        // Show Toast
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');

            const colors = {
                info: 'bg-blue-500',
                success: 'bg-green-500',
                error: 'bg-red-500',
                warning: 'bg-amber-500',
            };

            toast.className = `toast \${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm`;
            toast.textContent = message;
            container.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }
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
                <button onclick=\"triggerError('/test/ecommerce/payment-failed')\" class=\"w-full text-left px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors\">
                    💳 Payment Failed (Fatal)
                </button>
                <button onclick=\"triggerError('/test/ecommerce/out-of-stock')\" class=\"w-full text-left px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium transition-colors\">
                    📦 Out of Stock (Warning)
                </button>
                <button onclick=\"triggerError('/test/http/500')\" class=\"w-full text-left px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors\">
                    🔥 Server Error 500
                </button>
                <button onclick=\"triggerError('/test/db/timeout')\" class=\"w-full text-left px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-medium transition-colors\">
                    ⏱️ Database Timeout
                </button>
            </div>
            <div class=\"mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500\">
                Session: <code class=\"bg-gray-100 px-1 rounded\" id=\"session-id-display\">loading...</code>
            </div>
        </div>
    </div>

    <script>
        function toggleDebugPanel() {
            const content = document.getElementById('debug-content');
            const text = document.getElementById('debug-toggle-text');
            content.classList.toggle('hidden');
            text.textContent = content.classList.contains('hidden') ? 'Test Errors' : 'Hide';
        }

        async function triggerError(path) {
            showToast('Triggering error...', 'info');
            try {
                await fetch(path);
                showToast('Error triggered! Check ErrorWatch dashboard.', 'success');
            } catch (e) {
                showToast('Error sent with replay!', 'success');
            }
        }

        // Display session ID
        setTimeout(() => {
            const sessionId = window.ErrorMonitoringReplay?.getSessionId?.() || 'N/A';
            document.getElementById('session-id-display').textContent = sessionId.substring(0, 8) + '...';
        }, 1000);
    </script>

    <!-- Session Replay Script -->
    {{ error_monitoring_replay_script()|raw }}
</body>
</html>
", "test/dashboard.html.twig", "/home/kev/Documents/lab/sites/saas/sentry-like/example-client/templates/test/dashboard.html.twig");
    }
}
