import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { LightBulbIcon, ExclamationTriangleIcon,   ArrowTrendingUpIcon, UserGroupIcon, CurrencyRupeeIcon, ClockIcon } from '@heroicons/react/24/outline';

const SmartRecommendations = () => {
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateRecommendations = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);

        // Fetch recent data for analysis
        const currentDate = new Date();
        const lastWeek = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [recentBills, recentClients, allClients] = await Promise.all([
          getDocs(query(
            collection(db, 'bills'),
            where('createdAt', '>=', lastWeek),
            orderBy('createdAt', 'desc'),
            limit(50)
          )),
          getDocs(query(
            collection(db, 'clients'),
            where('createdAt', '>=', lastMonth),
            orderBy('createdAt', 'desc')
          )),
          getDocs(collection(db, 'clients'))
        ]);

        const smartRecommendations = [];

        // Analyze billing patterns
        const unpaidBills = recentBills.docs.filter(doc => doc.data().status !== 'paid');
        if (unpaidBills.length > 5) {
          smartRecommendations.push({
            id: 'overdue-payments',
            type: 'warning',
            icon: ExclamationTriangleIcon,
            title: 'High Overdue Payments',
            description: `You have ${unpaidBills.length} unpaid bills. Consider sending payment reminders or implementing automated follow-ups.`,
            action: 'View Pending Bills',
            priority: 'high',
            category: 'Finance'
          });
        }

        // Analyze customer growth
        const newCustomersThisWeek = recentClients.docs.length;
        if (newCustomersThisWeek < 3) {
          smartRecommendations.push({
            id: 'customer-acquisition',
            type: 'growth',
            icon: UserGroupIcon,
            title: 'Boost Customer Acquisition',
            description: `Only ${newCustomersThisWeek} new customers this week. Consider running promotions or referral programs to attract more clients.`,
            action: 'Create Promotion',
            priority: 'medium',
            category: 'Marketing'
          });
        }

        // Analyze client types and suggest optimization
        const subscriptionClients = allClients.docs.filter(doc => doc.data().clientType === 'subscription').length;
        const ondemandClients = allClients.docs.filter(doc => doc.data().clientType === 'ondemand').length;
        const totalClients = allClients.docs.length;

        if (subscriptionClients / totalClients < 0.6) {
          smartRecommendations.push({
            id: 'subscription-conversion',
            type: 'growth',
            icon:   ArrowTrendingUpIcon,
            title: 'Convert to Subscriptions',
            description: `${Math.round((ondemandClients / totalClients) * 100)}% of clients are on-demand. Offer subscription discounts to increase recurring revenue.`,
            action: 'Design Subscription Offer',
            priority: 'medium',
            category: 'Business Strategy'
          });
        }

        // Analyze delivery efficiency
        const averageRevenue = recentBills.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0) / recentBills.docs.length;
        if (averageRevenue < 200) {
          smartRecommendations.push({
            id: 'increase-order-value',
            type: 'revenue',
            icon: CurrencyRupeeIcon,
            title: 'Increase Average Order Value',
            description: `Average order value is ₹${Math.round(averageRevenue)}. Consider bundle deals or premium meal options to increase revenue per customer.`,
            action: 'Create Bundles',
            priority: 'medium',
            category: 'Revenue'
          });
        }

        // Operational recommendations
        const lunchClients = allClients.docs.filter(doc => 
          doc.data().clientType === 'subscription' && doc.data().lunchEnabled
        ).length;
        const dinnerClients = allClients.docs.filter(doc => 
          doc.data().clientType === 'subscription' && doc.data().dinnerEnabled
        ).length;

        if (Math.abs(lunchClients - dinnerClients) > totalClients * 0.3) {
          const dominantMeal = lunchClients > dinnerClients ? 'lunch' : 'dinner';
          const underperformingMeal = dominantMeal === 'lunch' ? 'dinner' : 'lunch';
          
          smartRecommendations.push({
            id: 'balance-meals',
            type: 'operational',
            icon: ClockIcon,
            title: `Boost ${underperformingMeal.charAt(0).toUpperCase() + underperformingMeal.slice(1)} Orders`,
            description: `${dominantMeal.charAt(0).toUpperCase() + dominantMeal.slice(1)} orders are significantly higher. Promote ${underperformingMeal} specials to balance operations.`,
            action: `Create ${underperformingMeal.charAt(0).toUpperCase() + underperformingMeal.slice(1)} Promotion`,
            priority: 'low',
            category: 'Operations'
          });
        }

        // Success recommendations
        if (newCustomersThisWeek >= 5) {
          smartRecommendations.push({
            id: 'growth-success',
            type: 'success',
            icon:   ArrowTrendingUpIcon,
            title: 'Great Customer Growth!',
            description: `${newCustomersThisWeek} new customers this week! Consider scaling your marketing efforts to maintain this momentum.`,
            action: 'Scale Marketing',
            priority: 'low',
            category: 'Growth'
          });
        }

        // If no specific recommendations, add general ones
        if (smartRecommendations.length === 0) {
          smartRecommendations.push({
            id: 'general-improvement',
            type: 'general',
            icon: LightBulbIcon,
            title: 'Everything Looks Good!',
            description: 'Your business metrics are healthy. Consider exploring new menu items or expanding to new areas.',
            action: 'Explore Opportunities',
            priority: 'low',
            category: 'General'
          });
        }

        // Sort by priority
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        smartRecommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

        setRecommendations(smartRecommendations.slice(0, 4)); // Show top 4 recommendations

      } catch (error) {
        console.error('Error generating recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    generateRecommendations();
  }, [currentUser]);

  const getTypeColor = (type) => {
    switch (type) {
      case 'warning':
        return 'border-l-red-500 bg-red-50';
      case 'growth':
        return 'border-l-green-500 bg-green-50';
      case 'revenue':
        return 'border-l-blue-500 bg-blue-50';
      case 'operational':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'success':
        return 'border-l-emerald-500 bg-emerald-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Smart Recommendations</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse border-l-4 border-gray-200 p-4 bg-gray-50 rounded">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center">
          <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
          Smart Recommendations
        </h3>
        <span className="text-xs text-gray-500">AI-Powered Insights</span>
      </div>
      
      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const IconComponent = rec.icon;
            return (
              <div
                key={rec.id}
                className={`border-l-4 p-4 rounded transition-all hover:shadow-md ${getTypeColor(rec.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <IconComponent className="h-5 w-5 mt-0.5 text-gray-600" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-800">{rec.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(rec.priority)}`}>
                          {rec.priority}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {rec.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        {rec.action} →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <LightBulbIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p>No specific recommendations at this time.</p>
          <p className="text-sm">Your business metrics look healthy!</p>
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Recommendations are generated based on your recent business data and industry best practices.
        </p>
      </div>
    </div>
  );
};

export default SmartRecommendations;