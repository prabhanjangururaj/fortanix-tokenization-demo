const axios = require('axios');
const fs = require('fs');
const path = require('path');

class FortanixDSM {
  constructor() {
    const configPath = path.join(__dirname, '../config/fortanix-config.json');
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    this.dsmEndpoint = this.config.fortanix.dsmEndpoint;
    // Cache bearer tokens by role
    this.bearerTokens = {};
  }

  /**
   * Get API key for a specific user role
   */
  getApiKey(role) {
    return this.config.fortanix.users[role]?.apiKey;
  }

  /**
   * Get key ID for a specific field
   */
  getKeyId(field) {
    return this.config.fortanix.keyMappings[field]?.keyId;
  }

  /**
   * Check if a role can detokenize a specific field
   */
  canDetokenize(role, field) {
    const mapping = this.config.fortanix.keyMappings[field];
    if (!mapping) return false;
    return mapping.detokenize.includes(role);
  }

  /**
   * Authenticate with Fortanix DSM to get a bearer token
   */
  async authenticate(role, forceRefresh = false) {
    try {
      // Return cached token if available and not forcing refresh
      if (this.bearerTokens[role] && !forceRefresh) {
        return this.bearerTokens[role];
      }

      const apiKey = this.getApiKey(role);
      if (!apiKey) {
        throw new Error(`Missing API key for role: ${role}`);
      }

      console.log(`[Fortanix] ${forceRefresh ? 'Re-authenticating' : 'Authenticating'} for role: ${role} (using role-specific API key)`);

      const response = await axios({
        method: 'POST',
        url: `${this.dsmEndpoint}/sys/v1/session/auth`,
        headers: {
          'Authorization': `Basic ${apiKey}`
        }
      });

      if (response.data && response.data.access_token) {
        // Cache the token
        this.bearerTokens[role] = response.data.access_token;
        console.log(`[Fortanix] Successfully authenticated for role: ${role}`);
        return response.data.access_token;
      }

      throw new Error('Failed to get access token from Fortanix DSM');
    } catch (error) {
      console.error(`Authentication error for role ${role}:`, error.response?.data || error.message);
      throw new Error(`Failed to authenticate with Fortanix DSM: ${error.message}`);
    }
  }

  /**
   * Tokenize a single value using Fortanix batch encrypt API
   */
  async tokenize(value, field, role, retryCount = 0) {
    try {
      const bearerToken = await this.authenticate(role, retryCount > 0);
      const keyId = this.getKeyId(field);

      if (!keyId) {
        throw new Error(`Missing Key ID for ${field}`);
      }

      console.log(`[Fortanix] Tokenizing ${field} for role ${role} (retry: ${retryCount})`);

      // Encode the value to base64
      const encodedValue = Buffer.from(value).toString('base64');

      // Prepare batch request
      const batchRequest = [
        {
          kid: keyId,
          request: {
            alg: 'Aes',
            plain: encodedValue,
            mode: 'FPE'
          }
        }
      ];

      const response = await axios.post(
        `${this.dsmEndpoint}/crypto/v1/keys/batch/encrypt`,
        batchRequest,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`[Fortanix] Encrypt response:`, JSON.stringify(response.data, null, 2));

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        // Check if result contains cipher (either directly or in body)
        const cipher = result.cipher || result.body?.cipher;

        if (cipher) {
          // Decode from base64 and return
          const tokenized = Buffer.from(cipher, 'base64').toString('utf8');
          console.log(`[Fortanix] Successfully tokenized ${field}: ${tokenized.substring(0, 20)}...`);
          return tokenized;
        } else if (result.error) {
          console.log(`[Fortanix] ERROR from DSM:`, result.error);
          throw new Error(`Fortanix DSM error: ${JSON.stringify(result.error)}`);
        }
      }

      throw new Error('Invalid response from Fortanix DSM');
    } catch (error) {
      // Convert error to string for checking
      const errorData = error.response?.data;
      const errorString = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
      const errorMessage = errorString || error.message;

      console.error(`[Fortanix] Tokenization error for ${field} (retry ${retryCount}):`, errorMessage);

      // Check if session expired - be more flexible with error matching
      const isSessionExpired = errorMessage && (
        errorMessage.includes('session has expired') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('Session')
      );

      if (isSessionExpired && retryCount === 0) {
        console.log(`[Fortanix] Session expired detected for role ${role}, clearing cached token for this role and retrying...`);
        // Clear only this role's token - each role has independent sessions
        delete this.bearerTokens[role];
        return this.tokenize(value, field, role, retryCount + 1);
      }

      throw new Error(`Failed to tokenize ${field}: ${error.message}`);
    }
  }

  /**
   * Detokenize a single value using Fortanix batch decrypt API
   */
  async detokenize(value, field, role) {
    try {
      // Check if role has permission to detokenize this field
      if (!this.canDetokenize(role, field)) {
        return value; // Return tokenized value if no permission
      }

      const bearerToken = await this.authenticate(role);
      const keyId = this.getKeyId(field);

      if (!keyId) {
        throw new Error(`Missing Key ID for ${field}`);
      }

      // Encode the value to base64
      const encodedValue = Buffer.from(value).toString('base64');

      // Prepare batch request
      const batchRequest = [
        {
          kid: keyId,
          request: {
            alg: 'Aes',
            cipher: encodedValue,
            mode: 'FPE',
            masked: false // Return plain text, not masked
          }
        }
      ];

      const response = await axios.post(
        `${this.dsmEndpoint}/crypto/v1/keys/batch/decrypt`,
        batchRequest,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        // Check if result contains plain (either directly or in body)
        const plain = result.plain || result.body?.plain;

        if (plain) {
          // Decode from base64 and return
          return Buffer.from(plain, 'base64').toString('utf8');
        }
      }

      throw new Error('Invalid response from Fortanix DSM');
    } catch (error) {
      console.error(`Detokenization error for ${field}:`, error.response?.data || error.message);
      // Return tokenized value if detokenization fails
      return value;
    }
  }

  /**
   * Tokenize multiple fields in a record using batch API
   */
  async tokenizeRecord(record, role) {
    const sensitiveFields = ['name', 'phone', 'email', 'ssn', 'passportNumber'];
    const tokenizedRecord = { ...record };

    console.log(`[Fortanix] Starting tokenization for role: ${role}`);

    try {
      const bearerToken = await this.authenticate(role);
      console.log(`[Fortanix] Authentication successful, got bearer token`);

      // Prepare batch requests for all sensitive fields
      const batchRequests = [];
      const fieldMapping = [];

      for (const field of sensitiveFields) {
        if (record[field]) {
          const keyId = this.getKeyId(field);
          // Skip fields with placeholder or invalid key IDs
          if (keyId && !keyId.startsWith('YOUR_')) {
            batchRequests.push({
              kid: keyId,
              request: {
                alg: 'AES',
                plain: Buffer.from(record[field]).toString('base64'),
                mode: 'FPE'
              }
            });
            fieldMapping.push(field);
          } else if (keyId && keyId.startsWith('YOUR_')) {
            console.log(`[Fortanix] Skipping ${field}: Key ID not configured (placeholder found)`);
          }
        }
      }

      if (batchRequests.length === 0) {
        console.log(`[Fortanix] No fields to tokenize`);
        return tokenizedRecord;
      }

      console.log(`[Fortanix] Sending batch encrypt request for ${batchRequests.length} fields:`, fieldMapping);

      // Make single batch request for all fields
      const response = await axios.post(
        `${this.dsmEndpoint}/crypto/v1/keys/batch/encrypt`,
        batchRequests,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`[Fortanix] Received batch encrypt response, processing ${response.data?.length || 0} results`);
      console.log(`[Fortanix] Full response:`, JSON.stringify(response.data, null, 2));

      // Map responses back to fields
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((result, index) => {
          console.log(`[Fortanix] Result ${index} for field ${fieldMapping[index]}:`, JSON.stringify(result, null, 2));

          // Check if result contains cipher (either directly or in body)
          const cipher = result.cipher || result.body?.cipher;

          if (cipher) {
            const field = fieldMapping[index];
            // Decode from base64 and return as string
            const tokenized = Buffer.from(cipher, 'base64').toString('utf8');
            console.log(`[Fortanix] Tokenized ${field}: ${tokenized.substring(0, 40)}...`);
            tokenizedRecord[field] = tokenized;
          } else if (result.error) {
            console.log(`[Fortanix] ERROR for field ${fieldMapping[index]}:`, result.error);
            console.log(`[Fortanix] Keeping original value for ${fieldMapping[index]} due to FPE character constraints`);
            // Keep original value if tokenization fails (FPE character requirements)
          } else {
            console.log(`[Fortanix] WARNING: No cipher in response for field ${fieldMapping[index]}`);
          }
        });
      }

      console.log(`[Fortanix] Tokenization complete`);
      return tokenizedRecord;
    } catch (error) {
      console.error('Batch tokenization error:', error.response?.data || error.message);
      throw new Error(`Failed to tokenize record: ${error.message}`);
    }
  }

  /**
   * Detokenize multiple fields in a record based on role permissions
   */
  async detokenizeRecord(record, role, retryCount = 0) {
    const detokenizedRecord = { ...record };

    // Define which fields each role can see in plain text
    const fieldPermissions = {
      admin: ['name', 'phone', 'email', 'ssn', 'passportNumber'],
      editor: ['name', 'ssn'], // Can see name and SSN (SSN will be masked)
      viewer: ['name']  // Can see name in plain text
    };

    const allowedFields = fieldPermissions[role] || [];

    try {
      const bearerToken = await this.authenticate(role, retryCount > 0);

      console.log(`[Fortanix] Detokenizing record for role ${role} (retry: ${retryCount}), fields: ${allowedFields.join(', ')}`);

      // Prepare batch requests for allowed fields
      const batchRequests = [];
      const fieldMapping = [];

      for (const field of allowedFields) {
        if (record[field] && this.canDetokenize(role, field)) {
          const keyId = this.getKeyId(field);
          // Skip fields with placeholder or invalid key IDs
          if (keyId && !keyId.startsWith('YOUR_')) {
            // Enable masking for editor's SSN field (shows only last 4 digits)
            const shouldMask = (role === 'editor' && field === 'ssn');

            batchRequests.push({
              kid: keyId,
              request: {
                alg: 'AES',
                cipher: Buffer.from(record[field]).toString('base64'),
                mode: 'FPE',
                masked: shouldMask
              }
            });
            fieldMapping.push(field);
          }
        }
      }

      if (batchRequests.length === 0) {
        console.log(`[Fortanix] No fields to detokenize for role ${role}`);
        return detokenizedRecord;
      }

      console.log(`[Fortanix] Sending batch decrypt request for ${batchRequests.length} fields: ${fieldMapping.join(', ')}`);

      // Make single batch request for all fields
      const response = await axios.post(
        `${this.dsmEndpoint}/crypto/v1/keys/batch/decrypt`,
        batchRequests,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      // Map responses back to fields
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((result, index) => {
          const plain = result.plain || result.body?.plain;
          if (plain) {
            const field = fieldMapping[index];
            const decrypted = Buffer.from(plain, 'base64').toString('utf8');
            detokenizedRecord[field] = decrypted;
            console.log(`[Fortanix] Successfully detokenized ${field}: ${decrypted.substring(0, 20)}...`);
          } else {
            console.log(`[Fortanix] No plain text in response for ${fieldMapping[index]}`);
          }
        });
      }

      return detokenizedRecord;
    } catch (error) {
      // Convert error to string for checking
      const errorData = error.response?.data;
      const errorString = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
      const errorMessage = errorString || error.message;

      console.error(`[Fortanix] Batch detokenization error (retry ${retryCount}):`, errorMessage);

      // Check if session expired - be more flexible with error matching
      const isSessionExpired = errorMessage && (
        errorMessage.includes('session has expired') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('Session')
      );

      if (isSessionExpired && retryCount === 0) {
        console.log(`[Fortanix] Session expired detected for role ${role}, clearing cached token for this role and retrying...`);
        // Clear only this role's token - each role has independent sessions with its own API key
        delete this.bearerTokens[role];
        return this.detokenizeRecord(record, role, retryCount + 1);
      }

      // Return record with tokenized values if detokenization fails
      return detokenizedRecord;
    }
  }

  /**
   * Detokenize multiple records
   */
  async detokenizeRecords(records, role) {
    const detokenizedRecords = [];

    for (const record of records) {
      const detokenized = await this.detokenizeRecord(record, role);
      detokenizedRecords.push(detokenized);
    }

    return detokenizedRecords;
  }
}

module.exports = new FortanixDSM();
