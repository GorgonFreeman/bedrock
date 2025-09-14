# YouTube Data API v3 Reference

## Overview
The YouTube Data API v3 allows developers to integrate YouTube functionality into their applications. It provides access to YouTube's vast collection of videos, channels, playlists, and other resources.

## Documentation
- **Main Documentation**: https://developers.google.com/youtube/v3
- **Getting Started Guide**: https://developers.google.com/youtube/v3/getting-started
- **API Reference**: https://developers.google.com/youtube/v3/docs
- **Implementation Guide**: https://developers.google.com/youtube/v3/guides/implementation

## Authentication
The API supports two types of authentication:
1. **API Key**: For public data access (search, public channel info, etc.)
2. **OAuth 2.0**: For user-specific data and actions (upload videos, manage playlists, etc.)

## Main Resources
- **Videos**: Search, retrieve, and manage video information
- **Channels**: Get channel details, statistics, and content
- **Playlists**: Manage and retrieve playlist information
- **Comments**: Access video comments and replies
- **Subscriptions**: Manage channel subscriptions
- **Search**: Search for videos, channels, and playlists

## Key Methods
- `search.list()` - Search for videos, channels, playlists
- `videos.list()` - Get video details
- `channels.list()` - Get channel information
- `playlists.list()` - Get playlist information
- `playlistItems.list()` - Get items in a playlist

## Rate Limits
- Default quota: 10,000 units per day
- Different operations consume different quota amounts
- Search operations typically cost 100 units
- Read operations typically cost 1 unit

## Example cURL Command
```bash
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=openai&key=YOUR_API_KEY"
```

**Note**: Replace `YOUR_API_KEY` with your actual YouTube Data API v3 key from Google Cloud Console.

## Getting Credentials
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Go to Credentials > Create Credentials > API Key
5. For OAuth: Create Credentials > OAuth client ID
