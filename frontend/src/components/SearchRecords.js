import React, { useState } from 'react';
import { recordsAPI } from '../services/api';
import '../styles/SearchRecords.css';

const SearchRecords = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await recordsAPI.searchRecords(searchQuery, searchField);
      setResults(response.records);
    } catch (err) {
      setError('Failed to search records');
      console.error('Error searching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const isTokenized = (value) => {
    return value && value.length > 20 && /^[A-Za-z0-9+/=]+$/.test(value);
  };

  const renderFieldValue = (value) => {
    const tokenized = isTokenized(value);

    return (
      <span className={tokenized ? 'tokenized-value' : 'plain-value'}>
        {value}
        {tokenized && <span className="tokenized-indicator" title="This field is tokenized">🔒</span>}
      </span>
    );
  };

  return (
    <div className="search-records-container">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-controls">
          <div className="form-group">
            <label htmlFor="searchField">Search By:</label>
            <select
              id="searchField"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="accountNumber">Account Number</option>
            </select>
          </div>

          <div className="form-group search-input-group">
            <label htmlFor="searchQuery">Search Query:</label>
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Enter ${searchField === 'name' ? 'name' : 'account number'}...`}
            />
          </div>

          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      {hasSearched && !loading && (
        <div className="search-results">
          <h3>Search Results ({results.length})</h3>

          {results.length === 0 ? (
            <div className="no-results">
              No records found for "{searchQuery}"
            </div>
          ) : (
            <div className="table-container">
              <table className="results-table">
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
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(record => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td>{renderFieldValue(record.name)}</td>
                      <td>{renderFieldValue(record.accountNumber)}</td>
                      <td>{renderFieldValue(record.phone)}</td>
                      <td>{renderFieldValue(record.email)}</td>
                      <td>{renderFieldValue(record.ssn)}</td>
                      <td>{renderFieldValue(record.passportNumber)}</td>
                      <td>
                        <span className="service-badge">
                          {record.serviceRequest.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>{new Date(record.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="viewer-note">
            <strong>Note:</strong> As a Viewer, you can see Name and Account Number in plain text.
            Phone, Email, SSN, and Passport Number fields are tokenized for security.
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchRecords;
