import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AddRecord from './AddRecord';
import RecordsList from './RecordsList';
import SearchRecords from './SearchRecords';
import RawRecordsView from './RawRecordsView';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Set default tab to 'search' for viewers, 'records' for others
  const [activeTab, setActiveTab] = useState(user?.role === 'viewer' ? 'search' : 'records');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRecordAdded = () => {
    // Trigger refresh of records list
    setRefreshTrigger(prev => prev + 1);
  };

  const canAddRecords = user?.role === 'admin' || user?.role === 'editor';

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Enterprise Portal</h1>
          <div className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className={`user-role role-${user?.role}`}>{user?.role?.toUpperCase()}</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Tabs */}
          <div className="tabs">
            {user?.role !== 'viewer' && (
              <button
                className={`tab ${activeTab === 'records' ? 'active' : ''}`}
                onClick={() => setActiveTab('records')}
              >
                All Records
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                className={`tab ${activeTab === 'raw' ? 'active' : ''}`}
                onClick={() => setActiveTab('raw')}
              >
                Raw Database
              </button>
            )}
            {user?.role === 'viewer' && (
              <button
                className={`tab ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => setActiveTab('search')}
              >
                Search Records
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'records' && (
              <>
                {/* Add Record Form - Only for admin and editor */}
                {canAddRecords && (
                  <div className="section">
                    <h2>Add New Record</h2>
                    <AddRecord onRecordAdded={handleRecordAdded} />
                  </div>
                )}

                {/* Records List */}
                <div className="section">
                  <h2>
                    {user?.role === 'admin' && 'All Records (Plain Text)'}
                    {user?.role === 'editor' && 'All Records (Partial Access)'}
                    {user?.role === 'viewer' && 'All Records (Limited Access)'}
                  </h2>
                  <RecordsList refreshTrigger={refreshTrigger} />
                </div>
              </>
            )}

            {activeTab === 'raw' && user?.role === 'admin' && (
              <div className="section">
                <h2>Raw Database View (Tokenized Data)</h2>
                <RawRecordsView refreshTrigger={refreshTrigger} />
              </div>
            )}

            {activeTab === 'search' && user?.role === 'viewer' && (
              <div className="section">
                <h2>Search Records</h2>
                <SearchRecords />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>
          <strong>Role Permissions:</strong>{' '}
          {user?.role === 'admin' && 'Full access - View all fields in plain text, Add records, Delete records'}
          {user?.role === 'editor' && 'Partial access - Add records, View Name & Account Number in plain text, SSN masked (first 5 digits visible), Other fields tokenized'}
          {user?.role === 'viewer' && 'Read-only - Search and view records, Name & Account Number in plain text, Other fields tokenized'}
        </p>
        <p className="powered-by">Powered by Fortanix DSM Tokenization</p>
      </footer>
    </div>
  );
};

export default Dashboard;
