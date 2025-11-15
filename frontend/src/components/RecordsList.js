import React, { useState, useEffect } from 'react';
import { recordsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/RecordsList.css';

const RecordsList = ({ refreshTrigger }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchRecords();
  }, [refreshTrigger]);

  const fetchRecords = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await recordsAPI.getAllRecords();
      setRecords(response.records);
    } catch (err) {
      setError('Failed to fetch records');
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      await recordsAPI.deleteRecord(id);
      setRecords(records.filter(record => record.id !== id));
    } catch (err) {
      alert('Failed to delete record');
      console.error('Error deleting record:', err);
    }
  };

  const isTokenized = (value) => {
    // Simple heuristic: if value looks like base64 or contains unusual characters, it's likely tokenized
    return value && value.length > 20 && /^[A-Za-z0-9+/=]+$/.test(value);
  };

  const renderFieldValue = (value, fieldType) => {
    const tokenized = isTokenized(value);

    return (
      <span className={tokenized ? 'tokenized-value' : 'plain-value'}>
        {value}
        {tokenized && <span className="tokenized-indicator" title="This field is tokenized">🔒</span>}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Loading records...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (records.length === 0) {
    return <div className="no-records">No records found. Add your first record above!</div>;
  }

  return (
    <div className="records-list-container">
      <div className="records-count">
        Total Records: <strong>{records.length}</strong>
      </div>

      <div className="table-container">
        <table className="records-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Account Number</th>
              <th>Phone</th>
              <th>Email</th>
              <th>SSN</th>
              <th>Passport Number</th>
              <th>Service Request</th>
              <th>Created By</th>
              <th>Created At</th>
              {user?.role === 'admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{renderFieldValue(record.name, 'name')}</td>
                <td>{renderFieldValue(record.accountNumber, 'accountNumber')}</td>
                <td>{renderFieldValue(record.phone, 'phone')}</td>
                <td>{renderFieldValue(record.email, 'email')}</td>
                <td>{renderFieldValue(record.ssn, 'ssn')}</td>
                <td>{renderFieldValue(record.passportNumber, 'passportNumber')}</td>
                <td>
                  <span className="service-badge">
                    {record.serviceRequest.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </td>
                <td>{record.createdBy}</td>
                <td>{new Date(record.createdAt).toLocaleString()}</td>
                {user?.role === 'admin' && (
                  <td>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="legend">
        <div className="legend-note">
          {user?.role === 'admin' && 'As Admin, you can see all fields decrypted. Name, Email, SSN, and Passport Number are tokenized in the database using Fortanix DSM.'}
          {user?.role === 'editor' && 'As Editor, you can see Name and account number in plain text, SSN masked (first 5 digits visible, last 4 masked). Phone, Email, and Passport Number remain tokenized (encrypted).'}
          {user?.role === 'viewer' && 'As Viewer, you can see Name and account number in plain text. Phone, Email, SSN, and Passport Number remain tokenized (encrypted).'}
        </div>
      </div>
    </div>
  );
};

export default RecordsList;
