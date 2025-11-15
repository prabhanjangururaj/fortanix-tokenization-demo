# Enterprise Portal with Fortanix DSM Tokenization

A comprehensive 3-tier application demonstrating role-based access control (RBAC) with Fortanix DSM tokenization for sensitive data protection, featuring Format Preserving Encryption (FPE) and field-level masking.

## Overview

This application showcases a complete enterprise portal solution with:
- **Frontend**: React-based responsive UI with enterprise portal design
- **Backend**: Node.js/Express REST API with automatic session management
- **Database**: SQLite for lightweight data storage
- **Security**: Fortanix DSM for field-level tokenization/detokenization using FPE
- **RBAC**: Three user roles with different access levels and field-level masking
- **Session Management**: Automatic token refresh and retry logic for expired sessions

## Architecture

```
┌─────────────────┐
│  React Frontend │ (Port 80)
│   (nginx)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express API    │ (Port 3002)
│   (Node.js)     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────────┐
│ SQLite │ │ Fortanix DSM │
│   DB   │ │     API      │
└────────┘ └──────────────┘
```

## Features

### Role-Based Access Control

#### 1. Admin User
- **Permissions**: Full access
- **Can Add Records**: ✅ Yes
- **Can View Records**: ✅ All fields in plain text (unmasked)
- **Can View Raw Database**: ✅ Yes (see tokenized values in database)
- **Can Delete Records**: ✅ Yes
- **Detokenization**: All sensitive fields (Name, Phone, Email, SSN, Passport Number) with full visibility
- **Masking**: None - sees all data in plain text

#### 2. Editor User
- **Permissions**: Add and partial view
- **Can Add Records**: ✅ Yes
- **Can View Records**: ✅ Partial access
  - **Plain Text**: Name, Account Number
  - **Masked**: SSN (shows `597-34-****` format - first 5 digits visible, last 4 masked)
  - **Tokenized**: Phone, Email, Passport Number
- **Can Delete Records**: ❌ No
- **Can View Raw Database**: ❌ No
- **Detokenization**: Name (full), SSN (masked via Fortanix DSM)

#### 3. Viewer User
- **Permissions**: Read-only with search
- **Can Add Records**: ❌ No
- **Can View Records**: ✅ Search only (no "All Records" tab)
  - **Plain Text**: Name, Account Number
  - **Tokenized**: Phone, Email, SSN, Passport Number
- **Can Delete Records**: ❌ No
- **Can Search Records**: ✅ By Name (tokenized search) or Account Number
- **Can View Raw Database**: ❌ No
- **Detokenization**: Only Name

### Data Fields

**Sensitive Fields** (Tokenized with FPE):
- **Name**: Tokenized, detokenizable by all roles
- **Phone Number**: Format `555-123-4567`, tokenized
- **Email**: Tokenized
- **Social Security Number (SSN)**: Format `123-45-6789`, tokenized
  - Admin: Full visibility (`123-45-6789`)
  - Editor: Masked (`123-45-****` - first 5 digits visible, last 4 masked)
  - Viewer: Tokenized
- **Passport Number**: Format `1A2BC4D5` (8 characters, mixed alphanumeric), tokenized

**Non-Sensitive Fields** (Stored in plain text):
- **Account Number**: 12-digit number, stored in plain text
- **Service Request**: Dropdown selection (Account Opening, Balance Inquiry, Loan Application, Fund Transfer, Account Closure)
- **Created By**: Username of record creator
- **Created At**: Timestamp

### Key Features

#### 1. Format Preserving Encryption (FPE)
- Uses Fortanix DSM FPE mode (FF1 algorithm)
- Maintains data format and length after encryption
- Character set constraints enforced by DSM

#### 2. Field-Level Masking
- Editor role sees SSN with masking via Fortanix DSM `masked: true` parameter
- Shows first 5 digits, masks last 4: `597-34-****`
- Implemented at the API level for granular control

#### 3. Tokenized Search
- Search by name tokenizes the search query first
- Searches database with tokenized value for accurate matching
- Maintains security while enabling search functionality

#### 4. Automatic Session Management
- Role-specific API keys and bearer tokens
- Automatic token refresh on session expiration
- Independent session management per role

## Prerequisites

- Docker and Docker Compose installed
- Fortanix DSM account with API access
- Fortanix API keys for three user roles (admin, editor, viewer)
- Fortanix Key IDs for each sensitive field (created with FPE mode)

## Setup Instructions

### 1. Configure Fortanix DSM

Before running the application, you need to configure your Fortanix DSM credentials.

**Step 1**: Copy the example configuration:
```bash
cp config/fortanix-config.example.json config/fortanix-config.json
```

**Step 2**: Edit `config/fortanix-config.json` with your actual credentials

**Important Notes:**
- Use the correct DSM endpoint for your region:
- All encryption keys must be created with **FPE (Format Preserving Encryption)** mode in Fortanix DSM
- The Editor API key should have following permissions: Encrypt, Masked Decrypt
- The Admin API key should have following permissions: Encrypt, Decrypt
- The Viewer API key should have following permissions: Encrypt, Decrypt
- Refer to the screenshots for DSM key setup


### 2. Build and Run with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 3. Access the Application

Once the containers are running:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3002
- **Health Check**: http://localhost:3002/health

## Login Credentials

Use these default credentials to test different roles:

| Username | Password  | Role   |
|----------|-----------|--------|
| admin    | admin123  | Admin  |
| editor   | editor123 | Editor |
| viewer   | viewer123 | Viewer |


### Using the Helper Script

The `query-db.sh` script provides an easy way to query the SQLite database:

```bash
# Make script executable (first time only)
chmod +x query-db.sh

# View all records 
./query-db.sh

```

**Encryption (Tokenization):**
```javascript
POST /crypto/v1/keys/batch/encrypt
Body: [{
  kid: "key-id",
  request: {
    alg: "AES",
    plain: base64_encoded_value,
    mode: "FPE"
  }
}]
Response: [{ cipher: base64_encoded_encrypted_value }]
```

**Decryption (Detokenization):**
```javascript
POST /crypto/v1/keys/batch/decrypt
Body: [{
  kid: "key-id",
  request: {
    alg: "AES",
    cipher: base64_encoded_encrypted_value,
    mode: "FPE",
    masked: true/false  // true for editor SSN masking
  }
}]
Response: [{ plain: base64_encoded_decrypted_value }]
```


**Tokenized Search Flow:**
1. User searches for "Rachel Garcia" for example
2. Backend tokenizes "Rachel Garcia" using Fortanix DSM
3. Searches SQLite database with tokenized value
4. Returns matching records
5. Detokenizes results based on user's role

This maintains security while enabling exact-match search functionality.

### Database Schema

```sql
CREATE TABLE records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,              -- Tokenized with FPE
  phone TEXT NOT NULL,             -- Tokenized with FPE
  email TEXT NOT NULL,             -- Tokenized with FPE
  ssn TEXT NOT NULL,               -- Tokenized with FPE
  account_number TEXT NOT NULL,    -- Plain text
  passport_number TEXT,            -- Tokenized with FPE
  service_request TEXT NOT NULL,   -- Plain text
  created_by TEXT NOT NULL,        -- Plain text
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## License

This is a demonstration project. Please ensure compliance with Fortanix licensing and terms of service.

## Support

For Fortanix DSM support, visit: https://support.fortanix.com

## Key Highlights

This application demonstrates several advanced data security concepts:

1. **Format Preserving Encryption (FPE)**
   - Data remains in original format after encryption
   - Enables database operations on encrypted data
   - FF1 algorithm implementation via Fortanix DSM

2. **Field-Level Masking**
   - Granular data visibility control
   - DSM-level masking (not application-level)
   - Role-specific masking policies

3. **Tokenized Search**
   - Search on encrypted data
   - Maintains data security while enabling functionality
   - Exact-match search capability

4. **Zero-Trust Architecture**
   - Data encrypted at rest (in database)
   - Decryption only for authorized roles
   - No plaintext storage of sensitive data

5. **Session Management**
   - Automatic token refresh
   - Role-specific API keys and sessions
   - Retry logic for resilience

