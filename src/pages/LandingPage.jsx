// src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ChevronRightIcon,
    StarIcon,
    CheckIcon,
    PlayIcon,
    ChevronDownIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const LandingPage = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [openFAQ, setOpenFAQ] = useState(null);

    // Hero section with compelling copy
    const HeroSection = () => (
        <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white overflow-hidden">
            {/* Background animation */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-pulse"></div>
            </div>

            {/* Floating elements */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-pink-400 to-red-500 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-20 left-20 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '2s' }}></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-48">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Hero Content */}
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 animate-fade-in">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                            #1 Tiffin Management Platform in India
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-slide-in-left">
                            Transform Your
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"> Tiffin Business </span>
                             into a Digital Empire
                        </h1>

                        <p className="text-xl lg:text-xl text-gray-200 mb-8 leading-relaxed animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                            Scale your tiffin service with our all-in-one management platform.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-in-left" style={{ animationDelay: '0.4s' }}>
                            {/* <Button 
                size="lg" 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold px-8 py-4 text-lg shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Start Free Trial
                <ChevronRightIcon className="w-5 h-5 ml-2" />
              </Button> */}

                            <Link
                                to="/auth"
                                size="lg"
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold px-8 py-4 text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 items-center justify-center inline-flex align-middle rounded-md"
                            >

                                Get Started
                                <ChevronRightIcon className="w-5 h-5 ml-2" />
                            </Link>


                            <Button
                                variant="outline"
                                size="lg"
                                className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-8 py-4 text-lg"
                            >
                                <PlayIcon className="w-5 h-5 mr-2" />
                                Watch Demo
                            </Button>
                        </div>

                        {/* Trust indicators */}
                        {/* <div className="mt-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <p className="text-sm text-gray-300 mb-4">Trusted by leading tiffin services across India</p>
              <div className="flex items-center justify-center lg:justify-start space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">1000+</div>
                  <div className="text-xs text-gray-300">Active Businesses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">50k+</div>
                  <div className="text-xs text-gray-300">Daily Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">₹10Cr+</div>
                  <div className="text-xs text-gray-300">Revenue Processed</div>
                </div>
              </div>
            </div> */}
                    </div>

                    {/* Hero Image/Animation */}
                    <div className="relative animate-slide-in-right">
                        <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
                            {/* Dashboard Preview */}
                            <div className="bg-white rounded-2xl p-6 shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    </div>
                                    <div className="text-sm text-gray-500">TiffinAdmin Dashboard</div>
                                </div>

                                {/* Mock dashboard content */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-3 rounded-lg">
                                            <div className="text-xs opacity-80">Today's Revenue</div>
                                            <div className="text-lg font-bold">₹45,680</div>
                                        </div>
                                        <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-3 rounded-lg">
                                            <div className="text-xs opacity-80">Active Orders</div>
                                            <div className="text-lg font-bold">127</div>
                                        </div>
                                        <div className="bg-gradient-to-r from-purple-400 to-purple-600 text-white p-3 rounded-lg">
                                            <div className="text-xs opacity-80">New Clients</div>
                                            <div className="text-lg font-bold">8</div>
                                        </div>
                                    </div>

                                    <div className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                        <div className="text-gray-500 text-sm">📊 Analytics Dashboard</div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating notification */}
                            <div className="absolute -right-4 top-20 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
                                <div className="text-xs">New Order! 🍛</div>
                                <div className="text-sm font-bold">Rajesh Kumar</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );

    // Features section
    const FeaturesSection = () => {
        const features = [
            {
                icon: '👥',
                title: 'Smart Client Management',
                description: 'Organize your customer base with detailed profiles, preferences, and order history. Never miss a delivery again.',
                benefits: ['Customer profiles', 'Order tracking', 'Delivery schedules', 'Payment history']
            },
            {
                icon: '💰',
                title: 'Automated Billing',
                description: 'Generate invoices automatically, track payments, and manage your finances with powerful billing tools.',
                benefits: ['Auto invoicing', 'Payment tracking', 'Financial reports', 'Tax management']
            },
            {
                icon: '📊',
                title: 'Advanced Analytics',
                description: 'Get insights into your business performance with detailed analytics and reporting dashboards.',
                benefits: ['Revenue analytics', 'Customer insights', 'Performance metrics', 'Growth tracking']
            },
            {
                icon: '🚚',
                title: 'Delivery Management',
                description: 'Optimize your delivery routes, track deliveries in real-time, and ensure timely service.',
                benefits: ['Route optimization', 'Real-time tracking', 'Delivery scheduling', 'Driver management']
            },
            {
                icon: '📱',
                title: 'Mobile-First Design',
                description: 'Manage your business on the go with our responsive design that works perfectly on all devices.',
                benefits: ['Mobile responsive', 'Offline capability', 'Push notifications', 'Easy navigation']
            },
            {
                icon: '🔒',
                title: 'Secure & Reliable',
                description: 'Your data is protected with enterprise-grade security and 99.9% uptime guarantee.',
                benefits: ['Data encryption', 'Regular backups', 'GDPR compliant', '24/7 monitoring']
            }
        ];

        return (
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need to Scale Your Tiffin Business
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            From order management to delivery tracking, we've got all the tools to help you grow your business efficiently.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="h-full hover:shadow-xl transition-shadow duration-300 group cursor-pointer transform hover:-translate-y-2" hover>
                                <CardContent className="p-8">
                                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 mb-4">{feature.description}</p>
                                    <ul className="space-y-2">
                                        {feature.benefits.map((benefit, idx) => (
                                            <li key={idx} className="flex items-center text-sm text-gray-500">
                                                <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        );
    };

    // Testimonials section
    const TestimonialsSection = () => {
        const testimonials = [
            {
                name: 'Rajesh Kumar',
                business: 'Mumbai Tiffin Express',
                rating: 5,
                image: '👨‍🍳',
                text: 'TiffinAdmin transformed our business completely! We went from managing 50 customers manually to serving 500+ customers seamlessly. Revenue increased by 300% in just 6 months.',
                metrics: { customers: '500+', revenue: '+300%', time: '6 months' }
            },
            {
                name: 'Priya Sharma',
                business: 'Homely Bites',
                rating: 5,
                image: '👩‍🍳',
                text: 'The automated billing feature saved us 15 hours per week. Now we can focus on cooking amazing food instead of paperwork. Best investment we ever made!',
                metrics: { timeSaved: '15hrs/week', focus: 'cooking', satisfaction: '100%' }
            },
            {
                name: 'Amit Patel',
                business: 'Gujarat Ghar Ka Khana',
                rating: 5,
                image: '👨‍💼',
                text: 'Customer management became so easy! We can track preferences, allergies, and delivery schedules for each customer. Zero complaints in the last 3 months.',
                metrics: { complaints: '0', tracking: 'perfect', efficiency: '+250%' }
            }
        ];

        return (
            <section className="py-20 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Loved by 1000+ Tiffin Business Owners
                        </h2>
                        <p className="text-xl text-gray-600">
                            See how TiffinAdmin helped these businesses achieve remarkable growth
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index} className="relative bg-white border-2 border-transparent hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-2" hover>
                                <CardContent className="p-8">
                                    {/* Rating */}
                                    <div className="flex items-center mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                        ))}
                                    </div>

                                    {/* Testimonial text */}
                                    <blockquote className="text-gray-700 mb-6 italic">
                                        "{testimonial.text}"
                                    </blockquote>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-3 gap-2 mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                                        {Object.entries(testimonial.metrics).map(([key, value], idx) => (
                                            <div key={idx} className="text-center">
                                                <div className="text-sm font-bold text-indigo-600">{value}</div>
                                                <div className="text-xs text-gray-500 capitalize">{key}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Author */}
                                    <div className="flex items-center">
                                        <div className="text-3xl mr-4">{testimonial.image}</div>
                                        <div>
                                            <div className="font-semibold text-gray-900">{testimonial.name}</div>
                                            <div className="text-sm text-gray-500">{testimonial.business}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        );
    };

    // Pricing section
    const PricingSection = () => {
        const plans = [
            {
                name: 'Starter',
                price: '₹999',
                period: '/month',
                description: 'Perfect for small tiffin services just starting out',
                features: [
                    'Up to 50 customers',
                    'Basic billing & invoicing',
                    'Order management',
                    'Mobile app access',
                    'Email support',
                    'Basic analytics'
                ],
                popular: false,
                cta: 'Start Free Trial'
            },
            {
                name: 'Professional',
                price: '₹2,499',
                period: '/month',
                description: 'Ideal for growing businesses with advanced needs',
                features: [
                    'Up to 500 customers',
                    'Advanced billing & tax management',
                    'Delivery route optimization',
                    'Customer preferences tracking',
                    'Priority support',
                    'Advanced analytics & reports',
                    'Integration support',
                    'Custom meal plans'
                ],
                popular: true,
                cta: 'Most Popular'
            },
            {
                name: 'Enterprise',
                price: '₹4,999',
                period: '/month',
                description: 'For large operations requiring maximum flexibility',
                features: [
                    'Unlimited customers',
                    'Multi-location support',
                    'Custom integrations',
                    'Dedicated account manager',
                    '24/7 phone support',
                    'Custom reporting',
                    'API access',
                    'White-label options',
                    'Advanced security features'
                ],
                popular: false,
                cta: 'Contact Sales'
            }
        ];

        return (
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-xl text-gray-600 mb-8">
                            Choose the plan that fits your business size. Upgrade or downgrade anytime.
                        </p>

                        {/* Pricing toggle - can add monthly/yearly later */}
                        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
                            <span className="px-4 py-2 bg-white rounded-md shadow-sm text-sm font-medium text-gray-900">Monthly</span>
                            <span className="px-4 py-2 text-sm text-gray-500">Yearly (Save 20%)</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan, index) => (
                            <Card key={index} className={`relative h-full ${plan.popular ? 'border-2 border-indigo-500 shadow-2xl transform scale-105' : 'border border-gray-200'}`}>
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <CardContent className="p-8">
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                        <p className="text-gray-600 mb-4">{plan.description}</p>
                                        <div className="flex items-baseline justify-center">
                                            <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                            <span className="text-gray-500 ml-1">{plan.period}</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start">
                                                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        className={`w-full py-3 ${plan.popular
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                                            : 'bg-gray-900 hover:bg-gray-800'
                                            } text-white font-semibold`}
                                    >
                                        {plan.cta}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-gray-600 mb-4">
                            All plans include a 14-day free trial. No credit card required.
                        </p>
                        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                            <span className="flex items-center">
                                <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                                No setup fees
                            </span>
                            <span className="flex items-center">
                                <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                                Cancel anytime
                            </span>
                            <span className="flex items-center">
                                <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                                24/7 support
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        );
    };

    // FAQ section
    const FAQSection = () => {
        const faqs = [
            {
                question: 'How quickly can I get started with TiffinAdmin?',
                answer: 'You can get started immediately! Sign up for a free trial, and you\'ll have access to the full platform within minutes. Our onboarding team will help you import your existing customer data and set up your preferences.'
            },
            {
                question: 'Do I need technical knowledge to use the platform?',
                answer: 'Not at all! TiffinAdmin is designed to be user-friendly for everyone. If you can use WhatsApp or basic phone apps, you can easily use our platform. We also provide free training and support.'
            },
            {
                question: 'Can I integrate with my existing payment systems?',
                answer: 'Yes! We support integration with popular payment gateways like Razorpay, PayU, and Paytm. You can also accept cash payments and track them through the system.'
            },
            {
                question: 'What happens to my data if I cancel?',
                answer: 'Your data belongs to you. You can export all your customer data, order history, and reports at any time. We also provide a 30-day grace period after cancellation to download your data.'
            },
            {
                question: 'Is there a limit on the number of orders I can process?',
                answer: 'No limits! Whether you process 10 orders or 10,000 orders per day, our platform scales with your business. You only pay based on your subscription plan, not per order.'
            },
            {
                question: 'Do you provide customer support?',
                answer: 'Absolutely! We provide email support for all plans, priority support for Professional plans, and 24/7 phone support for Enterprise customers. Our team speaks Hindi, English, and other regional languages.'
            }
        ];

        return (
            <section className="py-20 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xl text-gray-600">
                            Everything you need to know about TiffinAdmin
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <Card key={index} className="border border-gray-200">
                                <CardContent className="p-0">
                                    <button
                                        onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                                        className="w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                                            <ChevronDownIcon
                                                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${openFAQ === index ? 'transform rotate-180' : ''
                                                    }`}
                                            />
                                        </div>
                                    </button>
                                    {openFAQ === index && (
                                        <div className="px-6 pb-6">
                                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-gray-600 mb-4">Still have questions?</p>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Contact Our Support Team
                        </Button>
                    </div>
                </div>
            </section>
        );
    };

    // Footer section
    const FooterSection = () => (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white font-bold text-lg">M</span>
                            </div>
                            <span className="text-2xl font-bold">MealBox</span>
                        </div>
                        <p className="text-gray-300 mb-6 max-w-md">
                            Empowering tiffin businesses across India with smart technology solutions.
                            Join thousands of successful tiffin services using our platform.
                        </p>
                        <div className="flex space-x-4">
                            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                                <PhoneIcon className="w-4 h-4 mr-2" />
                                +91 9174867756
                            </Button>
                            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                                <EnvelopeIcon className="w-4 h-4 mr-2" />
                                mealbox@gmail.com
                            </Button>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-3">
                            {['Features', 'Pricing', 'Testimonials', 'FAQ', 'Blog', 'Contact'].map((link) => (
                                <li key={link}>
                                    <a href={`#${link.toLowerCase()}`} className="text-gray-300 hover:text-white transition-colors">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Support</h3>
                        <ul className="space-y-3">
                            {['Help Center', 'Documentation', 'API Docs', 'System Status', 'Privacy Policy', 'Terms of Service'].map((link) => (
                                <li key={link}>
                                    <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-12 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-400 text-sm">
                            © 2025 MealBox. All rights reserved. Made with ❤️ in India
                        </p>
                        <div className="flex items-center space-x-6 mt-4 md:mt-0">
                            <div className="flex items-center text-green-400">
                                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                                <span className="text-sm">All systems operational</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );

    // Navigation header
    const NavigationHeader = () => (
        <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-2">
                            <span className="text-white font-bold">M</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">MealBox</span>
                    </div>

                    {/* Desktop Navigation
                    <div className="hidden md:flex items-center space-x-8">
                        {['Features', 'Pricing', 'Testimonials', 'FAQ'].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="text-gray-700 hover:text-indigo-600 transition-colors font-medium"
                            >
                                {item}
                            </a>
                        ))}
                    </div> */}

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link
                            to="/auth"
                            className="text-gray-700 hover:text-indigo-600 transition-colors font-medium"
                        >
                            Sign In
                        </Link>
                        <Link 
                        to="/auth"
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 px-3 rounded-md">
                            Try For Free
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-700 hover:text-gray-900 focus:outline-none"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-200">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {['Features', 'Pricing', 'Testimonials', 'FAQ'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item}
                                </a>
                            ))}
                            <div className="px-3 py-2 space-y-2">
                                <Link
                                    to="/auth"
                                    className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Sign In
                                </Link>
                                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                    Start Free Trial
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation Header */}
            <NavigationHeader />

            {/* Hero Section */}
            <HeroSection />

            {/* Features Section */}
            <FeaturesSection />

            {/* Testimonials Section */}
            <TestimonialsSection />

            {/* Pricing Section */}
            {/* <PricingSection /> */}

            {/* FAQ Section */}
            <FAQSection />

            {/* Footer Section */}
            <FooterSection />
        </div>
    );
};

export default LandingPage;