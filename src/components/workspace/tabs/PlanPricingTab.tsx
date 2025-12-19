import React from 'react';

interface PlanPricingTabProps {
  workspaceId: string;
}

export const PlanPricingTab: React.FC<PlanPricingTabProps> = ({ workspaceId }) => {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Current Plan</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-xl">
            <p className="text-sm text-secondary mb-2">Plan Name</p>
            <p className="text-xl font-semibold text-primary">Professional</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-xl">
            <p className="text-sm text-secondary mb-2">Monthly Cost</p>
            <p className="text-xl font-semibold text-primary">$99</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-xl">
            <p className="text-sm text-secondary mb-2">Renewal Date</p>
            <p className="text-xl font-semibold text-primary">Dec 17, 2025</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Available Plans</h2>
        <div className="grid grid-cols-3 gap-6">
          {/* Starter Plan */}
          <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-primary mb-2">Starter</h3>
            <p className="text-2xl font-bold text-primary mb-4">$29<span className="text-sm text-secondary">/month</span></p>
            <ul className="space-y-2 mb-6">
              <li className="text-sm text-text">✓ Up to 10 users</li>
              <li className="text-sm text-text">✓ 100 GB storage</li>
              <li className="text-sm text-text">✓ Basic support</li>
              <li className="text-sm text-text">✓ 3 Bases</li>
            </ul>
            <button className="w-full px-4 py-2 border border-gray-300 text-primary rounded-md hover:bg-gray-50 transition">
              Choose Plan
            </button>
          </div>

          {/* Professional Plan (Current) */}
          <div className="border border-blue-500 rounded-xl p-6 shadow-lg relative">
            <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">Current</div>
            <h3 className="text-lg font-semibold text-primary mb-2">Professional</h3>
            <p className="text-2xl font-bold text-primary mb-4">$99<span className="text-sm text-secondary">/month</span></p>
            <ul className="space-y-2 mb-6">
              <li className="text-sm text-text">✓ Up to 50 users</li>
              <li className="text-sm text-text">✓ 1 TB storage</li>
              <li className="text-sm text-text">✓ Priority support</li>
              <li className="text-sm text-text">✓ Unlimited Bases</li>
              <li className="text-sm text-text">✓ Advanced views</li>
            </ul>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Current Plan
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-primary mb-2">Enterprise</h3>
            <p className="text-2xl font-bold text-primary mb-4">Custom<span className="text-sm text-secondary">/month</span></p>
            <ul className="space-y-2 mb-6">
              <li className="text-sm text-text">✓ Unlimited users</li>
              <li className="text-sm text-text">✓ Unlimited storage</li>
              <li className="text-sm text-text">✓ Dedicated support</li>
              <li className="text-sm text-text">✓ Custom integrations</li>
              <li className="text-sm text-text">✓ SSO & advanced security</li>
            </ul>
            <button className="w-full px-4 py-2 border border-gray-300 text-primary rounded-md hover:bg-gray-50 transition">
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Usage & Limits</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-primary">Storage Used</label>
              <span className="text-sm text-secondary">450 GB / 1 TB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-primary">Users</label>
              <span className="text-sm text-secondary">32 / 50</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '64%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-primary">API Calls</label>
              <span className="text-sm text-secondary">8,500 / 10,000/month</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Billing Actions</h2>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 text-primary rounded-md hover:bg-gray-50 transition">
            Upgrade Plan
          </button>
          <button className="px-4 py-2 border border-gray-300 text-primary rounded-md hover:bg-gray-50 transition">
            Downgrade Plan
          </button>
          <button className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition">
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  );
};
