import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';

interface BillingDetails {
  plan: string;
  status: 'active' | 'expired' | 'trial' | 'cancelled';
  expiryDate: string;
  daysRemaining: number;
  price: number;
  currency: string;
  features: string[];
  usage: {
    tables: number;
    records: number;
    storage: number;
    maxTables: number;
    maxRecords: number;
    maxStorage: number;
  };
}

export const BillingDetailsWidget: React.FC = () => {
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch billing details
    const fetchBillingDetails = async () => {
      setLoading(true);
      
      // Mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBillingDetails: BillingDetails = {
        plan: 'Pro',
        status: 'active',
        expiryDate: '2024-12-31',
        daysRemaining: 45,
        price: 29.99,
        currency: 'USD',
        features: [
          'Unlimited tables',
          'Advanced views',
          'Team collaboration',
          'API access',
          'Priority support'
        ],
        usage: {
          tables: 11,
          records: 1250,
          storage: 2.3,
          maxTables: 100,
          maxRecords: 10000,
          maxStorage: 10
        }
      };
      
      setBillingDetails(mockBillingDetails);
      setLoading(false);
    };

    fetchBillingDetails();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'trial':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'expired':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <LucideIcons.CheckCircle className="w-4 h-4" />;
      case 'trial':
        return <LucideIcons.Clock className="w-4 h-4" />;
      case 'expired':
        return <LucideIcons.XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <LucideIcons.PauseCircle className="w-4 h-4" />;
      default:
        return <LucideIcons.HelpCircle className="w-4 h-4" />;
    }
  };

  const getDaysRemainingColor = (days: number) => {
    if (days <= 7) return 'text-red-600';
    if (days <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleUpgrade = () => {
    // Navigate to billing page or open upgrade modal
    console.log('Navigate to upgrade page');
    // You can implement navigation logic here
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!billingDetails) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <LucideIcons.AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Failed to load billing details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
          <LucideIcons.CreditCard className="w-5 h-5 text-blue-600" />
          Billing Details
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(billingDetails.status)}`}>
          {getStatusIcon(billingDetails.status)}
          {billingDetails.status.charAt(0).toUpperCase() + billingDetails.status.slice(1)}
        </div>
      </div>

      {/* Plan Information */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-primary">{billingDetails.plan} Plan</span>
          <span className="text-lg font-semibold text-primary">
            ${billingDetails.price}/{billingDetails.currency === 'USD' ? 'month' : 'mo'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-secondary">
          <span>Expires: {new Date(billingDetails.expiryDate).toLocaleDateString()}</span>
          <span className={`font-medium ${getDaysRemainingColor(billingDetails.daysRemaining)}`}>
            {billingDetails.daysRemaining} days remaining
          </span>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-primary mb-3">Usage</h4>
        <div className="space-y-3">
          {/* Tables Usage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-secondary">Tables</span>
              <span className="text-primary">{billingDetails.usage.tables} / {billingDetails.usage.maxTables}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(billingDetails.usage.tables / billingDetails.usage.maxTables) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Records Usage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-secondary">Records</span>
              <span className="text-primary">{billingDetails.usage.records.toLocaleString()} / {billingDetails.usage.maxRecords.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(billingDetails.usage.records / billingDetails.usage.maxRecords) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Storage Usage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-secondary">Storage</span>
              <span className="text-primary">{billingDetails.usage.storage} GB / {billingDetails.usage.maxStorage} GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(billingDetails.usage.storage / billingDetails.usage.maxStorage) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-primary mb-3">Plan Features</h4>
        <div className="grid grid-cols-3 gap-2">
          {billingDetails.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-secondary">
              <LucideIcons.Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t border-border">
        <button
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
        >
          <LucideIcons.ArrowUp className="w-4 h-4" />
          Upgrade Plan
        </button>
      </div>
    </div>
  );
};
