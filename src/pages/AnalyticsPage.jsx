import React from 'react';
import { Link } from 'react-router-dom';
import RevenueAnalytics from '../components/RevenueAnalytics';
import DeliveryInsights from '../components/DeliveryInsights';
import BusinessSummary from '../components/BusinessSummary';
import SmartRecommendations from '../components/SmartRecommendations';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatsCard } from '../components/ui/StatsCard';
import { Button } from '../components/ui/Button';
import {
    ChartBarIcon,
    ArrowTrendingUpIcon,
    UsersIcon,
    CurrencyRupeeIcon,
    ArrowLeftIcon,
    SparklesIcon,
    TruckIcon
} from '@heroicons/react/24/outline';


export default function AnalyticsPage() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Back to Dashboard Button */}
            <div className="mb-4">
                <Button variant="outline" asChild>
                    <Link to="/dashboard" className="inline-flex items-center">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Analytics & Insights 📊
                    </h1>
                    <p className="text-gray-600 mt-1">Comprehensive business analytics and performance metrics</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-4 sm:mt-0">
                    <SparklesIcon className="h-5 w-5" />
                    <span>Last updated: {new Date().toLocaleDateString('en-IN')}</span>
                </div>
            </div>

            {/* Quick Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Revenue Insights"
                    value="₹0"
                    change="This month"
                    changeType="neutral"
                    icon={CurrencyRupeeIcon}
                    color="blue"
                />

                <StatsCard
                    title="Customer Analytics"
                    value="0"
                    change="Total customers"
                    changeType="neutral"
                    icon={UsersIcon}
                    color="green"
                />

                <StatsCard
                    title="Growth Rate"
                    value="0%"
                    change="Month over month"
                    changeType="neutral"
                    icon={ArrowTrendingUpIcon}
                    color="purple"
                />

                <StatsCard
                    title="Performance"
                    value="0%"
                    change="Success rate"
                    changeType="neutral"
                    icon={ChartBarIcon}
                    color="orange"
                />
            </div>

            {/* Business Performance Summary */}
            <div>
                <BusinessSummary />
            </div>

            {/* Revenue and Delivery Analytics */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div>
                    <RevenueAnalytics />
                </div>
                <div>
                    <DeliveryInsights />
                </div>
            </div>

            {/* Smart Recommendations */}
            <div>
                <SmartRecommendations />
            </div>

            {/* Additional Analytics Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Customer Analytics Section */}
                <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <UsersIcon className="h-6 w-6 text-blue-600" />
                            <span>Customer Analytics</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-colors">
                                <span className="text-sm font-medium text-gray-700">New Customers (This Month)</span>
                                <span className="text-xl font-bold text-green-600">0</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-colors">
                                <span className="text-sm font-medium text-gray-700">Customer Retention Rate</span>
                                <span className="text-xl font-bold text-blue-600">0%</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-colors">
                                <span className="text-sm font-medium text-gray-700">Average Customer Value</span>
                                <span className="text-xl font-bold text-purple-600">₹0</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg hover:from-red-100 hover:to-red-200 transition-colors">
                                <span className="text-sm font-medium text-gray-700">Churned Customers</span>
                                <span className="text-xl font-bold text-red-600">0</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Meal Analytics Section */}
                <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <TruckIcon className="h-6 w-6 text-orange-600" />
                            <span>Meal Analytics</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg hover:from-yellow-100 hover:to-yellow-200 transition-colors">
                                <span className="text-sm font-medium text-gray-700">Most Popular Meal</span>
                                <span className="text-xl font-bold text-yellow-600">No data</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-colors">
                                <span className="text-sm font-medium text-gray-700">Peak Delivery Hour</span>
                                <span className="text-xl font-bold text-blue-600">No data</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-colors">
                                <span className="text-sm font-medium text-gray-700">Average Prep Time</span>
                                <span className="text-xl font-bold text-green-600">0 min</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-colors">
                                <span className="text-sm font-medium text-gray-700">Daily Meal Volume</span>
                                <span className="text-xl font-bold text-purple-600">0 meals</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}