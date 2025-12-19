import React from 'react';

interface BillingTabProps {
  workspaceId: string;
}

export const BillingTab: React.FC<BillingTabProps> = ({ workspaceId }) => {
  return (
    <div className="space-y-6">

      {/* Current Plan */}
      <div className="bg-[var(--color-card)] rounded-xl border border-primary p-6">
        <h2 className="text-lg font-medium text-primary mb-4">Current Plan</h2>
        
        <div className="bg-[var(--color-utility-bg)] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-primary">Free Plan</h3>
              <p className="text-sm text-secondary">Basic features for small teams</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">$0</div>
              <div className="text-sm text-secondary">per month</div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary">Team Members</span>
            <span className="font-medium">2 / 5</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary">Records</span>
            <span className="font-medium">1,000 / 10,000</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary">Storage</span>
            <span className="font-medium">100 MB / 1 GB</span>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-[var(--color-card)] rounded-xl border border-primary p-6">
        <h2 className="text-lg font-medium text-primary mb-4">Billing History</h2>
        
        <div className="text-center py-8 text-secondary">
          <div className="text-4xl mb-2">📄</div>
          <p>No billing history yet</p>
          <p className="text-sm">Your invoices will appear here once you upgrade to a paid plan.</p>
        </div>
      </div>
    </div>
  );
};
