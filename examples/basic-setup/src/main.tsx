import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './index.css';

// Mock SereniBase UI components (replace with actual imports)
import {
  WorkspaceProvider,
  DatabaseGrid,
  NavigationSidebar,
  UserProfile,
} from '@serenibase/ui';

// Configuration
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  wsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws',
  appName: process.env.REACT_APP_APP_NAME || 'Sereni Base UI Demo',
};

// Sample data for demonstration
const sampleWorkspace = {
  id: '1',
  name: 'Demo Workspace',
  tables: [
    {
      id: 'users',
      name: 'Users',
      fields: [
        { id: 'name', name: 'Name', type: 'text', required: true },
        { id: 'email', name: 'Email', type: 'email', required: true },
        { id: 'role', name: 'Role', type: 'select', options: ['admin', 'user'] },
        { id: 'created_at', name: 'Created', type: 'datetime' },
      ],
      data: [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', created_at: '2024-03-01T10:00:00Z' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', created_at: '2024-03-02T11:30:00Z' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user', created_at: '2024-03-03T09:15:00Z' },
      ]
    },
    {
      id: 'projects',
      name: 'Projects',
      fields: [
        { id: 'title', name: 'Title', type: 'text', required: true },
        { id: 'description', name: 'Description', type: 'long_text' },
        { id: 'status', name: 'Status', type: 'select', options: ['active', 'completed', 'on_hold'] },
        { id: 'due_date', name: 'Due Date', type: 'date' },
        { id: 'owner', name: 'Owner', type: 'user_reference' },
      ],
      data: [
        { id: 1, title: 'Website Redesign', description: 'Complete redesign of company website', status: 'active', due_date: '2024-04-15', owner: 1 },
        { id: 2, title: 'Mobile App', description: 'Develop mobile application', status: 'active', due_date: '2024-06-01', owner: 2 },
        { id: 3, title: 'Data Migration', description: 'Migrate legacy data to new system', status: 'completed', due_date: '2024-02-28', owner: 1 },
      ]
    }
  ]
};

// Main App Component
function App() {
  return (
    <WorkspaceProvider config={config}>
      <div className="app">
        <Router>
          {/* Header */}
          <header className="app-header">
            <div className="header-content">
              <h1 className="app-title">{config.appName}</h1>
              <nav className="header-nav">
                <Link to="/" className="nav-link">Dashboard</Link>
                <Link to="/users" className="nav-link">Users</Link>
                <Link to="/projects" className="nav-link">Projects</Link>
                <Link to="/profile" className="nav-link">Profile</Link>
              </nav>
              <UserProfile />
            </div>
          </header>

          {/* Main Content */}
          <div className="app-body">
            <NavigationSidebar workspace={sampleWorkspace} />

            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<UsersTable />} />
                <Route path="/projects" element={<ProjectsTable />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </main>
          </div>
        </Router>
      </div>
    </WorkspaceProvider>
  );
}

// Dashboard Component
function Dashboard() {
  return (
    <div className="dashboard">
      <h2>📊 Dashboard</h2>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Users</h3>
          <div className="metric-value">3</div>
          <div className="metric-change">+1 this week</div>
        </div>
        <div className="dashboard-card">
          <h3>Active Projects</h3>
          <div className="metric-value">2</div>
          <div className="metric-change">66% completion rate</div>
        </div>
        <div className="dashboard-card">
          <h3>Recent Activity</h3>
          <ul className="activity-list">
            <li>✅ Data Migration completed</li>
            <li>🚀 Mobile App project started</li>
            <li>👤 Jane Smith joined</li>
          </ul>
        </div>
        <div className="dashboard-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button className="action-btn">+ Add User</button>
            <button className="action-btn">+ New Project</button>
            <button className="action-btn">📤 Export Data</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Users Table Component
function UsersTable() {
  const usersTable = sampleWorkspace.tables.find(t => t.id === 'users');

  return (
    <div className="table-view">
      <h2>👥 Users</h2>
      <DatabaseGrid
        table={usersTable}
        onRowClick={(row: any) => console.log('User clicked:', row)}
        onCellEdit={(rowId: any, fieldId: any, value: any) => console.log('Cell edited:', rowId, fieldId, value)}
        features={{
          search: true,
          filter: true,
          sort: true,
          export: true,
        }}
      />
    </div>
  );
}

// Projects Table Component  
function ProjectsTable() {
  const projectsTable = sampleWorkspace.tables.find(t => t.id === 'projects');

  return (
    <div className="table-view">
      <h2>📋 Projects</h2>
      <DatabaseGrid
        table={projectsTable}
        onRowClick={(row: any) => console.log('Project clicked:', row)}
        onCellEdit={(rowId: any, fieldId: any, value: any) => console.log('Cell edited:', rowId, fieldId, value)}
        features={{
          search: true,
          filter: true,
          sort: true,
          export: true,
          groupBy: 'status',
        }}
      />
    </div>
  );
}

// Profile Page Component
function ProfilePage() {
  return (
    <div className="profile-page">
      <h2>👤 User Profile</h2>
      <div className="profile-content">
        <div className="profile-section">
          <h3>Account Information</h3>
          <div className="profile-field">
            <label htmlFor='name'>Name:</label>
            <span id='name'>Demo User</span>
          </div>
          <div className="profile-field">
            <label htmlFor='email'>Email:</label>
            <span id='email'>demo@example.com</span>
          </div>
          <div className="profile-field">
            <label htmlFor='role'>Role:</label>
            <span id='role'>Admin</span>
          </div>
        </div>

        <div className="profile-section">
          <h3>Preferences</h3>
          <div className="preference-group">
            <label htmlFor='email-notifications'>
              <input type="checkbox" id='email-notifications' defaultChecked />Email notifications</label>
          </div>
          <div className="preference-group">
            <label htmlFor='desktop-notifications'>
              <input type="checkbox" id='desktop-notifications' />Desktop notifications  </label>
          </div>
          <div className="preference-group">
            <label htmlFor='theme'>Theme:</label>
            <select id='theme'>
              <option>Light</option>
              <option>Dark</option>
              <option>Auto</option>
            </select>
          </div>
        </div>

        <div className="profile-section">
          <h3>Actions</h3>
          <button className="profile-btn">Change Password</button>
          <button className="profile-btn">Export Data</button>
          <button className="profile-btn danger">Delete Account</button>
        </div>
      </div>
    </div>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);