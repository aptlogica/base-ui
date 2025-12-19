import React, { useState } from 'react';
import { AdvancedDropdown } from '../../common/dropdown/AdvancedDropdown';
import { MultiLineText } from '../../common/Fields';

interface AdminBillingTabProps {
  workspaceId: string;
}

export const AdminBillingTab: React.FC<AdminBillingTabProps> = ({ workspaceId }) => {
  const [billingCycle, setBillingCycle] = useState<string>('Monthly');
  const [billingAddress, setBillingAddress] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const billingCycleOptions = [
    { label: 'Monthly', value: 'Monthly' },
    { label: 'Quarterly', value: 'Quarterly' },
    { label: 'Annually', value: 'Annually' },
  ];
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Billing Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Billing Email</label>
            <input
              type="email"
              placeholder="billing@example.com"
              className="w-full text-xs px-3 h-11 border flex items-center rounded-[var(--radius-lg)] text-[var(--color-text-primary)] focus:border-[--color-brand-600] placeholder:text-[var(--color-text-placeholder)] bg-[--color-alpha-white] truncate overflow-ellipsis whitespace-nowrap outline-none cursor-pointer transition-all duration-200"
            />
          </div>
          <div>
            <AdvancedDropdown
              label="Billing Cycle"
              options={billingCycleOptions}
              value={billingCycle}
              onChange={(value) => setBillingCycle(value as string)}
              placeholder="Select billing cycle"
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Payment Methods</h2>
        <div className="space-y-4">
          <div className="border border-gray-300 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">💳</div>
              <div>
                <p className="text-sm font-medium text-primary">Visa ending in 4242</p>
                <p className="text-xs text-secondary">Expires 12/2025</p>
              </div>
            </div>
            <button className="text-xs text-red-600 hover:text-red-700 font-medium">Remove</button>
          </div>
          <button className="w-full px-4 py-2 border border-gray-300 text-primary rounded-md hover:bg-gray-50 transition">
            + Add Payment Method
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Invoices</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-primary">Invoice #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-primary">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-primary">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-primary">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-primary">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td colSpan={5} className="px-4 py-3 text-sm text-secondary text-center">No invoices found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Tax Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Tax ID / VAT Number</label>
            <input
              type="text"
              placeholder="Enter your tax ID"
              className="w-full text-xs px-3 h-11 border flex items-center rounded-[var(--radius-lg)] text-[var(--color-text-primary)] focus:border-[--color-brand-600] placeholder:text-[var(--color-text-placeholder)] bg-[--color-alpha-white] truncate overflow-ellipsis whitespace-nowrap outline-none cursor-pointer transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Billing Address</label>
            <MultiLineText
              placeholder="Enter your billing address"
              value={billingAddress}
              onChange={setBillingAddress}
              rows={3}
              isBorder={true}
            />
          </div>
        </div>
        <div className="mt-6">
          <button className="px-4 py-2 btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
