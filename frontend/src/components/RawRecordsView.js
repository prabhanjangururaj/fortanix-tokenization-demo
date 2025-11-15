import React, { useState, useEffect } from 'react';
import { recordsAPI } from '../services/api';
import '../styles/RawRecordsView.css';

const RawRecordsView = ({ refreshTrigger }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRawRecords();
  }, [refreshTrigger]);

  const fetchRawRecords = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await recordsAPI.getRawRecords();
      setRecords(response.records);
    } catch (err) {
      setError('Failed to fetch raw database records');
      console.error('Error fetching raw records:', err);
    } finally {
      setLoading(false);
    }
  };

  const truncateValue = (value, maxLength = 50) => {
    if (!value) return '';
    const str = String(value);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  };

  if (loading) {
    return <div className="loading">Loading raw database records...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (records.length === 0) {
    return <div className="no-records">No records in database yet. Add records to see tokenized data!</div>;
  }

  return (
    <div className="raw-records-container">
      <div className="info-banner">
        <h3>Raw Database View (Tokenized Data)</h3>
        <p>
          This shows the actual data stored in the database. All sensitive fields should be
          <strong> tokenized (encrypted)</strong> using Fortanix DSM with FPE (Format Preserving Encryption).
        </p>
      </div>

      <div className="records-count">
        Total Records: <strong>{records.length}</strong>
      </div>

      <div className="sql-query-box">
        <div className="sql-query-header">SQL Query:</div>
        <code className="sql-query">
          SELECT * FROM records ORDER BY created_at DESC;
        </code>
      </div>

      <div className="table-container">
        <table className="raw-database-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>SSN</th>
              <th>Account Number</th>
              <th>Passport Number</th>
              <th>Service Request</th>
              <th>Created By</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td title={record.name}>{truncateValue(record.name, 30)}</td>
                <td title={record.phone}>{truncateValue(record.phone, 30)}</td>
                <td title={record.email}>{truncateValue(record.email, 30)}</td>
                <td title={record.ssn}>{truncateValue(record.ssn, 30)}</td>
                <td title={record.accountNumber}>{truncateValue(record.accountNumber, 30)}</td>
                <td title={record.passportNumber}>{truncateValue(record.passportNumber, 30)}</td>
                <td>{record.serviceRequest}</td>
                <td>{record.createdBy}</td>
                <td>{new Date(record.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="info-footer">
        <h4>Understanding Tokenization:</h4>
        <ul>
          <li><strong>Tokenized values</strong> are the encrypted data stored in the database</li>
          <li>These values can only be decrypted using Fortanix DSM with proper permissions</li>
          <li>Admin role can detokenize all fields (Name, Email, SSN, Passport Number)</li>
          <li>Editor/Viewer roles can only detokenize Name</li>
          <li>Account Number, Phone, and Service Request are non-sensitive and stored in plain text</li>
        </ul>
      </div>
    </div>
  );
};

export default RawRecordsView;
