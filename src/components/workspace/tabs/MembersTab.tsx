import React from 'react';
import { MembersTable, Member } from '../../shared/MembersTable';
import { AccessRole } from '../../shared/AccessRoleSelector';
import { defaultRoleConfig } from '../../shared/roleConfig';

interface MembersTabProps {
  workspaceId: string;
}

// Mock data - replace with actual API call
const mockMembers: Member[] = [
  {
    id: '1',
    userId: 'uswajxeqibr1h3ug',
    name: 'sharad.kumar',
    email: 'sharad.kumar@aptlogica.com',
    role: 'no-access',
    dateJoined: '4mo ago',
    avatar: 'SH'
  },
  {
    id: '2',
    userId: 'uswajxeqibr1h3ug',
    name: 'Digamber.Negi',
    email: 'digamber.negi@aptlogica.com',
    role: 'owner',
    dateJoined: '5mo ago',
    avatar: 'DI'
  },
  {
    id: '3',
    userId: 'uswajxeqibr1h3ug',
    name: 'kush.patel',
    email: 'kush.patel@aptlogica.com',
    role: 'no-access',
    dateJoined: '4mo ago',
    avatar: 'KP'
  },
  {
    id: '4',
    userId: 'uswajxeqibr1h3ug',
    name: 'Anil.Kumar',
    email: 'anil.kumar@aptlogica.com',
    role: 'owner',
    dateJoined: '5mo ago',
    avatar: 'AK'
  },
  {
    id: '5',
    userId: 'uswajxeqibr1h3ug',
    name: 'Ashutosh.Sinha',
    email: 'ashutosh.sinha@aptlogica.com',
    role: 'owner',
    dateJoined: '5mo ago',
    avatar: 'AS'
  }
];

const MembersTab: React.FC<MembersTabProps> = ({ workspaceId }) => {

  const handleRoleChange = (memberId: string, newRole: AccessRole) => {
    // TODO: Implement API call to update member role
    console.log(`Change role for ${memberId} to ${newRole}`);
  };

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    // TODO: Show toast notification
  };

  const handleRemoveMember = (memberId: string) => {
    // TODO: Implement API call to remove member
    console.log(`Remove member ${memberId}`);
    // TODO: Show confirmation dialog
  };

  const editorSeats = 2;
  const totalSeats = 10;

  return (
    <div className="space-y-6">
      <MembersTable
        members={mockMembers}
        roleConfig={defaultRoleConfig}
        onRoleChange={handleRoleChange}
        onCopyUserId={handleCopyUserId}
        onRemoveMember={handleRemoveMember}
        showSearch={true}
        editorSeats={editorSeats}
      />

      {/* Current Usage Section */}
      <div className="bg-card rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Current Usage</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Team Members</span>
            <span className="text-sm text-gray-900">{mockMembers.length} / {totalSeats}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${(mockMembers.length / totalSeats) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            You can invite up to {totalSeats - mockMembers.length} more team members
          </p>
        </div>
      </div>
    </div>
  );
};

export default MembersTab; 
