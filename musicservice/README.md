# Music Service

Music Service is a Go-based microservice that handles music file uploads, metadata extraction, and playlist management for the MusicShare platform.

## Features

- 🎵 **Audio File Upload**: Support for MP3, FLAC, WAV, M4A, OGG, and AAC formats
- 🏷️ **Metadata Extraction**: Automatic ID3 tag extraction from audio files  
- 🎯 **Metadata Enrichment**: Integration with Spotify API via gRPC for enhanced metadata
- 📁 **File Storage**: Local storage with future cloud storage support
- 🎧 **Audio Streaming**: HTTP streaming support for audio playback
- 📋 **Playlist Management**: Create, update, and manage music playlists
- 🔍 **Search & Filter**: Advanced filtering and pagination support

## Tech Stack

- **Language**: Go 1.21
- **Framework**: Gin (REST API)
- **Database**: MongoDB
- **Communication**: gRPC for Metadata Service
- **Storage**: Local filesystem (MVP), Cloud storage ready
- **Containerization**: Docker

## Architecture

```
Music Service
├── REST API (Gin)           # HTTP endpoints for frontend
├── gRPC Client              # Communication with Metadata Service
├── Business Logic           # Track and playlist operations
├── MongoDB Repository       # Data persistence
└── Local Storage            # File management
```

## API Endpoints

### Tracks
- `POST /api/v1/tracks/upload` - Upload audio file
- `GET /api/v1/tracks/:id` - Get track details
- `GET /api/v1/tracks` - List tracks (with filtering)
- `DELETE /api/v1/tracks/:id` - Delete track
- `GET /api/v1/tracks/:id/stream` - Stream audio file

### Playlists
- `POST /api/v1/playlists` - Create playlist
- `GET /api/v1/playlists/:id` - Get playlist details
- `GET /api/v1/playlists` - List playlists
- `PUT /api/v1/playlists/:id` - Update playlist
- `DELETE /api/v1/playlists/:id` - Delete playlist
- `POST /api/v1/playlists/:id/tracks` - Add track to playlist
- `DELETE /api/v1/playlists/:id/tracks/:trackId` - Remove track from playlist

### Health
- `GET /health` - Health check endpoint

## Configuration

The service is configured via environment variables:

```bash
# Server
SERVER_PORT=8081
ENVIRONMENT=development
LOG_LEVEL=info

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=musicshare

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads

# Metadata Service
METADATA_SERVICE_GRPC=metadata-service:50051
METADATA_SERVICE_HTTP=http://metadata-service:8082
```

## Development Setup

### Prerequisites
- Go 1.21+
- MongoDB
- Protocol Buffers compiler (for gRPC)

### Local Development

1. **Clone and setup**:
```bash
cd musicservice
make dev-setup
```

2. **Install dependencies**:
```bash
make deps
```

3. **Generate protobuf files** (if needed):
```bash
make proto-gen
```

4. **Run the service**:
```bash
make run
```

The service will start on `http://localhost:8081`

### Docker Development

1. **Build Docker image**:
```bash
make docker-build
```

2. **Run container**:
```bash
make docker-run
```

## Testing

```bash
# Run tests
make test

# Run tests with coverage
make test-coverage
```

## Example Usage

### Upload a Track
```bash
curl -X POST http://localhost:8081/api/v1/tracks/upload \
  -F "file=@song.mp3" \
  -F "user_id=user123" \
  -F "tags=rock,classic" \
  -F "is_public=true"
```

### Get Track Details
```bash
curl http://localhost:8081/api/v1/tracks/507f1f77bcf86cd799439011
```

### List Tracks with Filters
```bash
curl "http://localhost:8081/api/v1/tracks?genre=rock&page=1&limit=10"
```

### Create Playlist
```bash
curl -X POST http://localhost:8081/api/v1/playlists \
  -H "Content-Type: application/json" \
  -d '{
    "creator_id": "user123",
    "name": "My Rock Collection",
    "description": "Best rock songs",
    "is_public": true
  }'
```

## File Storage Structure

```
uploads/
├── audio/           # Audio files
│   ├── track_507f1f77bcf86cd799439011.mp3
│   └── track_507f1f77bcf86cd799439012.flac
├── temp/           # Temporary uploads
└── covers/         # Playlist covers (future)
```

## Integration with Metadata Service

The Music Service communicates with the Metadata Service via gRPC to enrich track metadata:

1. User uploads audio file
2. Music Service extracts basic ID3 metadata
3. Music Service calls Metadata Service via gRPC
4. Metadata Service queries Spotify API
5. Enhanced metadata is stored in MongoDB

## Error Handling

The service provides structured error responses:

```json
{
  "success": false,
  "error": "Track not found",
  "message": "The requested track could not be found"
}
```

## Monitoring

- Health check endpoint: `GET /health`
- Structured logging with configurable levels
- Request/response logging via Gin middleware

## Future Enhancements

- [ ] Cloud storage integration (AWS S3, Google Cloud Storage)
- [ ] Advanced audio format support
- [ ] Bulk upload operations
- [ ] Track transcoding/conversion
- [ ] Advanced search with Elasticsearch
- [ ] Caching layer with Redis
- [ ] Metrics and monitoring