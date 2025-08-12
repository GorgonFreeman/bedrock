# Loop API Reference

This document provides a reference for the Loop Returns API integration in the Bedrock project.

## Overview

Loop Returns is a returns management platform. This integration provides functions to retrieve return data and manage returns through their API.

## Authentication

Loop uses API key authentication via the `X-Authorization` header. You'll need to provide:

- `BASE_URL`: Your Loop instance base URL
- `API_KEY`: Your Loop API key

These are configured in your credentials under the `loop` platform.

## Core Functions

### `loopReturnGet(credsPath, returnIdentifier, options)`

Retrieves a single return by various identifiers.

**Parameters:**
- `credsPath` (string): Path to your Loop credentials (e.g., "au", "us")
- `returnIdentifier` (object): One of the following identifiers:
  - `returnId` (string): The Loop return ID
  - `orderId` (string): The order ID
  - `orderName` (string): The order name
- `options` (object, optional): Additional options

**Returns:**
- Single return object when using `returnId`
- Array of returns when using `orderId` or `orderName`

**Example:**
```javascript
const returnData = await loopReturnGet('au', { returnId: '85747906' });
```

### `loopReturnsGet(credsPath, options)`

Retrieves a list of all returns with pagination support.

**Parameters:**
- `credsPath` (string): Path to your Loop credentials
- `options` (object, optional): Additional options

**Returns:**
- Array of all returns across all pages

## Pagination

The Loop integration automatically handles pagination for list endpoints. Here's how it works:

### How Pagination Works

1. **Automatic Pagination**: The `loopGetter` function automatically handles pagination for you
2. **Next Page Detection**: The system looks for `nextPageUrl` in the response to determine if there are more pages
3. **Seamless Data Collection**: All pages are automatically fetched and combined into a single result

### Pagination Parameters

When making requests, the system automatically adds:
```javascript
params: {
  paginate: true,
  // ... your custom params
}
```

### Pagination Flow

1. **Initial Request**: Makes the first request to the endpoint
2. **Response Processing**: Extracts data and checks for `nextPageUrl`
3. **Next Page**: If `nextPageUrl` exists, automatically makes the next request
4. **Data Aggregation**: Combines all page results into a single response
5. **Completion**: Stops when no more pages are available

### Example Pagination Response

```javascript
// The API response structure that enables pagination:
{
  success: true,
  result: {
    returns: [...], // Array of return objects
    nextPageUrl: "https://api.loopreturns.com/warehouse/return/list?page=2" // Next page URL
  }
}
```

## API Endpoints

### Get Return Details
- **URL**: `/warehouse/return/details`
- **Method**: GET
- **Parameters**: `return_id`, `order_id`, or `order_name`

### Get Returns List
- **URL**: `/warehouse/return/list`
- **Method**: GET
- **Parameters**: Automatically handles pagination

## Usage Examples

### Get a Single Return
```bash
curl localhost:8000/loopReturnGet \
  -H "Content-Type: application/json" \
  -d '{ 
    "credsPath": "au", 
    "returnIdentifier": { 
      "returnId": "85747906" 
    } 
  }'
```

### Get All Returns
```bash
curl localhost:8000/loopReturnsGet \
  -H "Content-Type: application/json" \
  -d '{ 
    "credsPath": "au" 
  }'
```

### Get Returns by Order ID
```javascript
const returns = await loopReturnGet('au', { orderId: 'ORDER123' });
```

## Error Handling

The integration includes comprehensive error handling:

- **Missing Credentials**: Throws error if required credentials are not found
- **API Errors**: Returns error responses from the Loop API
- **Validation**: Validates required parameters before making requests

## Response Format

All responses follow the standard Bedrock response format:

```javascript
{
  success: boolean,
  result: any, // The actual data
  error?: string[] // Error messages if success is false
}
```

## Notes

- **Automatic Pagination**: You don't need to manually handle pagination - it's built into the `loopGetter` function
- **Credential Management**: Uses the `credsByPath` utility to manage credentials securely
- **Debug Mode**: Set `DEBUG=true` in your environment to see detailed request/response logging
- **Rate Limiting**: The integration includes automatic retry logic for rate-limited requests

## Dependencies

- `CustomAxiosClient`: Handles HTTP requests and authentication
- `Getter`: Manages pagination and data collection
- `getterAsGetFunction`: Converts the getter to a simple function interface 