# Backblaze B2 API Reference

**Base URL:** https://api.backblazeb2.com  
**Documentation:** https://www.backblaze.com/b2/docs/

## Overview

Backblaze B2 Cloud Storage provides a simple API for storing and retrieving files. The API is RESTful and uses JSON for request/response bodies.

## Authentication

### Application Key Authentication
- **Type:** Application Key
- **Header:** `Authorization: [applicationKeyId]:[applicationKey]`
- **Required:** All API calls require authentication

### Account Authorization
- **Endpoint:** `GET /b2api/v2/b2_authorize_account`
- **Purpose:** Get account authorization token and API URL
- **Headers:** `Authorization: Basic [base64 encoded credentials]`

## Core Concepts

### Buckets
- Containers for files
- Can be public or private
- Have lifecycle rules

### Files
- Stored in buckets
- Have file IDs, names, and metadata
- Support versioning

### File Versions
- Each upload creates a new version
- Can be hidden or deleted

## API Endpoints

### Account Management

#### Authorize Account
- **Method:** `GET`
- **Endpoint:** `/b2api/v2/b2_authorize_account`
- **Description:** Get account authorization token and API URL
- **Headers:** `Authorization: Basic [base64 encoded credentials]`
- **Response:** Account info, API URL, authorization token

### Bucket Operations

#### List Buckets
- **Method:** `GET`
- **Endpoint:** `/b2api/v2/b2_list_buckets`
- **Description:** List all buckets in account
- **Headers:** `Authorization: [token]`
- **Parameters:**
  - `accountId` (required): Account ID
- **Response:** Array of bucket objects

#### Create Bucket
- **Method:** `POST`
- **Endpoint:** `/b2api/v2/b2_create_bucket`
- **Description:** Create a new bucket
- **Headers:** `Authorization: [token]`
- **Body:**
  - `accountId` (required): Account ID
  - `bucketName` (required): Bucket name
  - `bucketType` (required): "allPublic" or "allPrivate"
- **Response:** Bucket object

#### Update Bucket
- **Method:** `POST`
- **Endpoint:** `/b2api/v2/b2_update_bucket`
- **Description:** Update bucket settings
- **Headers:** `Authorization: [token]`
- **Body:**
  - `accountId` (required): Account ID
  - `bucketId` (required): Bucket ID
  - `bucketType` (required): "allPublic" or "allPrivate"
- **Response:** Updated bucket object

#### Delete Bucket
- **Method:** `POST`
- **Endpoint:** `/b2api/v2/b2_delete_bucket`
- **Description:** Delete an empty bucket
- **Headers:** `Authorization: [token]`
- **Body:**
  - `accountId` (required): Account ID
  - `bucketId` (required): Bucket ID
- **Response:** Success confirmation

### File Operations

#### List File Names
- **Method:** `GET`
- **Endpoint:** `/b2api/v2/b2_list_file_names`
- **Description:** List files in a bucket
- **Headers:** `Authorization: [token]`
- **Parameters:**
  - `bucketId` (required): Bucket ID
  - `startFileName` (optional): Start file name for pagination
  - `maxFileCount` (optional): Maximum files to return (default: 1000)
  - `prefix` (optional): File name prefix filter
  - `delimiter` (optional): Directory delimiter
- **Response:** Array of file objects

#### List File Versions
- **Method:** `GET`
- **Endpoint:** `/b2api/v2/b2_list_file_versions`
- **Description:** List all versions of files in a bucket
- **Headers:** `Authorization: [token]`
- **Parameters:**
  - `bucketId` (required): Bucket ID
  - `startFileName` (optional): Start file name for pagination
  - `startFileId` (optional): Start file ID for pagination
  - `maxFileCount` (optional): Maximum files to return (default: 1000)
  - `prefix` (optional): File name prefix filter
  - `delimiter` (optional): Directory delimiter
- **Response:** Array of file version objects

#### Get File Info
- **Method:** `GET`
- **Endpoint:** `/b2api/v2/b2_get_file_info`
- **Description:** Get information about a specific file
- **Headers:** `Authorization: [token]`
- **Parameters:**
  - `fileId` (required): File ID
- **Response:** File object with metadata

#### Download File by Name
- **Method:** `GET`
- **Endpoint:** `/file/[bucketName]/[fileName]`
- **Description:** Download a file by bucket name and file name
- **Headers:** `Authorization: [token]` (for private buckets)
- **Response:** File content

#### Download File by ID
- **Method:** `GET`
- **Endpoint:** `/b2api/v2/b2_download_file_by_id`
- **Description:** Download a file by file ID
- **Headers:** `Authorization: [token]`
- **Parameters:**
  - `fileId` (required): File ID
- **Response:** File content

### Upload Operations

#### Get Upload URL
- **Method:** `POST`
- **Endpoint:** `/b2api/v2/b2_get_upload_url`
- **Description:** Get upload URL for a bucket
- **Headers:** `Authorization: [token]`
- **Body:**
  - `bucketId` (required): Bucket ID
- **Response:** Upload URL and authorization token

#### Upload File
- **Method:** `POST`
- **Endpoint:** `[uploadUrl]` (from get upload URL)
- **Description:** Upload a file
- **Headers:**
  - `Authorization: [uploadAuthToken]`
  - `X-Bz-File-Name: [fileName]`
  - `X-Bz-Content-Sha1: [contentSha1]`
  - `Content-Type: [contentType]`
  - `Content-Length: [contentLength]`
- **Body:** File content
- **Response:** File object with file ID

### File Management

#### Hide File
- **Method:** `POST`
- **Endpoint:** `/b2api/v2/b2_hide_file`
- **Description:** Hide a file (mark as deleted)
- **Headers:** `Authorization: [token]`
- **Body:**
  - `bucketId` (required): Bucket ID
  - `fileName` (required): File name
- **Response:** File object

#### Delete File Version
- **Method:** `POST`
- **Endpoint:** `/b2api/v2/b2_delete_file_version`
- **Description:** Delete a specific file version
- **Headers:** `Authorization: [token]`
- **Body:**
  - `fileName` (required): File name
  - `fileId` (required): File ID
- **Response:** Success confirmation

## Data Types

### Account Object
```json
{
  "accountId": "string",
  "accountAuthToken": "string",
  "apiUrl": "string",
  "downloadUrl": "string",
  "minimumPartSize": 100000000,
  "recommendedPartSize": 100000000,
  "absoluteMinimumPartSize": 5000000
}
```

### Bucket Object
```json
{
  "accountId": "string",
  "bucketId": "string",
  "bucketName": "string",
  "bucketType": "allPublic|allPrivate",
  "bucketInfo": {},
  "lifecycleRules": [],
  "revision": 1
}
```

### File Object
```json
{
  "fileId": "string",
  "fileName": "string",
  "accountId": "string",
  "bucketId": "string",
  "contentLength": 0,
  "contentSha1": "string",
  "contentType": "string",
  "fileInfo": {},
  "action": "upload|hide|delete",
  "uploadTimestamp": 0
}
```

## Error Responses

### Standard Error Format
```json
{
  "code": "string",
  "message": "string",
  "status": 400
}
```

### Common Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limits

- **Class A transactions:** 1000 per second per account
- **Class B transactions:** 10000 per second per account
- **Class C transactions:** 100000 per second per account

## File Size Limits

- **Maximum file size:** 10 GB for single upload
- **Large files:** Use large file upload API for files > 100 MB
- **Part size:** 5 MB minimum, 5 GB maximum per part

## Best Practices

1. **Always use HTTPS** for all API calls
2. **Cache authorization tokens** and reuse them
3. **Handle rate limits** with exponential backoff
4. **Use appropriate content types** for uploads
5. **Validate file checksums** for integrity
6. **Use large file upload** for files > 100 MB

## SDKs and Libraries

- **Python:** b2sdk
- **JavaScript:** b2-sdk
- **Java:** b2-sdk-java
- **C#:** B2Net
- **Go:** b2-sdk-go

## Support

- **Documentation:** https://www.backblaze.com/b2/docs/
- **API Status:** https://status.backblaze.com/
- **Community:** https://community.backblaze.com/ 