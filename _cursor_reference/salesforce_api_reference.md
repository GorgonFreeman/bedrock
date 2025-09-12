# Salesforce REST API Reference

## Overview
The Salesforce REST API provides a simple, powerful, and secure way to access Salesforce data. It uses standard HTTP methods and JSON for data exchange, making it easy to integrate with any programming language or platform.

## Base URL
- **Production**: `https://[instance].salesforce.com/services/data/v[version]/`
- **Sandbox**: `https://[instance].salesforce.com/services/data/v[version]/`
- **Common versions**: v58.0, v59.0, v60.0 (latest)

## Authentication
Salesforce uses OAuth 2.0 for authentication. The most common flows are:

### Username-Password Flow (for server-to-server)
```bash
curl -X POST https://login.salesforce.com/services/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=YOUR_CONSUMER_KEY" \
  -d "client_secret=YOUR_CONSUMER_SECRET" \
  -d "username=YOUR_USERNAME" \
  -d "password=YOUR_PASSWORD_AND_SECURITY_TOKEN"
```

### Authorization Code Flow (for web applications)
1. Redirect user to: `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=YOUR_CONSUMER_KEY&redirect_uri=YOUR_CALLBACK_URL&scope=api`
2. Exchange authorization code for access token

## Common Endpoints

### Query Records (SOQL)
- **GET** `/query/?q=SELECT Id, Name FROM Account LIMIT 10`
- **GET** `/queryAll/?q=SELECT Id, Name FROM Account WHERE IsDeleted = true`

### CRUD Operations
- **GET** `/sobjects/Account/describe` - Get object metadata
- **GET** `/sobjects/Account/{id}` - Get single record
- **POST** `/sobjects/Account/` - Create record
- **PATCH** `/sobjects/Account/{id}` - Update record
- **DELETE** `/sobjects/Account/{id}` - Delete record

### Bulk Operations
- **POST** `/jobs/query` - Create bulk query job
- **GET** `/jobs/query/{jobId}` - Get job status
- **GET** `/jobs/query/{jobId}/results` - Get query results

## Common Objects
- **Account** - Company/Organization records
- **Contact** - Individual person records
- **Lead** - Potential customer records
- **Opportunity** - Sales opportunity records
- **Case** - Support case records
- **User** - Salesforce user records

## Headers
All API requests require:
- `Authorization: Bearer {access_token}`
- `Content-Type: application/json` (for POST/PATCH requests)

## Rate Limits
- **API Requests**: 15,000 per hour per org
- **Concurrent Requests**: 25 per org
- **Query Requests**: 1,000 per hour per org

## Error Handling
Common HTTP status codes:
- **200** - Success
- **201** - Created
- **204** - No Content (successful delete)
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **500** - Internal Server Error

## Example cURL Command
```bash
curl -X GET "https://[instance].salesforce.com/services/data/v58.0/query/?q=SELECT Id, Name FROM Account LIMIT 5" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## Required Credentials
- **Consumer Key** (Client ID)
- **Consumer Secret** (Client Secret)
- **Username** (Salesforce username)
- **Password** (Salesforce password + security token)
- **Instance URL** (e.g., https://mycompany.salesforce.com)
