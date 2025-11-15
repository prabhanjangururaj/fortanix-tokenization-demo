import React, { useState } from 'react';
import { recordsAPI } from '../services/api';
import { generateRandomRecord } from '../utils/randomDataGenerator';
import '../styles/AddRecord.css';

const AddRecord = ({ onRecordAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    ssn: '',
    accountNumber: '',
    passportNumber: '',
    serviceRequest: 'account_opening'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const serviceOptions = [
    { value: 'account_opening', label: 'Account Opening' },
    { value: 'loan_application', label: 'Loan Application' },
    { value: 'card_request', label: 'Credit Card Request' },
    { value: 'account_closure', label: 'Account Closure' },
    { value: 'balance_inquiry', label: 'Balance Inquiry' },
    { value: 'fund_transfer', label: 'Fund Transfer' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleAutoFill = () => {
    const randomData = generateRandomRecord();
    setFormData(randomData);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await recordsAPI.createRecord(formData);

      setSuccess('Record added successfully!');

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        ssn: '',
        accountNumber: '',
        passportNumber: '',
        serviceRequest: 'account_opening'
      });

      // Notify parent component to refresh records list
      if (onRecordAdded) {
        onRecordAdded();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-record-container">
      <form onSubmit={handleSubmit} className="add-record-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="accountNumber">Account Number</label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              required
              placeholder="1234567890"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="555-123-4567"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="john.doe@example.com"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ssn">Social Security Number</label>
            <input
              type="text"
              id="ssn"
              name="ssn"
              value={formData.ssn}
              onChange={handleChange}
              required
              placeholder="123-45-6789"
              maxLength="11"
            />
          </div>

          <div className="form-group">
            <label htmlFor="passportNumber">Passport Number</label>
            <input
              type="text"
              id="passportNumber"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleChange}
              required
              placeholder="1A2BC4D5"
              maxLength="8"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="serviceRequest">Service Request</label>
            <select
              id="serviceRequest"
              name="serviceRequest"
              value={formData.serviceRequest}
              onChange={handleChange}
              required
            >
              {serviceOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="form-actions">
          <button
            type="button"
            className="autofill-button"
            onClick={handleAutoFill}
            disabled={loading}
          >
            Auto Fill Demo Data
          </button>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Adding Record...' : 'Add Record'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRecord;
