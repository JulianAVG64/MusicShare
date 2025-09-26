# MusicShare - Red Social Musical

MusicShare es una aplicación web que funciona como red social especializada donde los usuarios pueden compartir su música favorita, crear playlists y descubrir nueva música a través de una experiencia social interactiva.

## Arquitectura del Sistema

### Componentes Implementados (MVP)

```
┌─────────────────────────────────────────────────────────┐
│                    MUSIC SERVICE                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Frontend  │    │    Music    │    │  Metadata   │  │
│  │   (React)   │◄──►│   Service   │◄──►│  Service    │  │
│  │             │    │    (Go)     │    │  (Python)   │  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
│                             │                           │
│                    ┌─────────────┐                      │
│                    │   MongoDB   │                      │
│                    │  Database   │                      │
│                    └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

## Estado Actual del Proyecto

### ✅ Implementado y Funcional

#### Music Service (Go)
- **Upload de archivos de audio** (MP3, FLAC, WAV, M4A, OGG, AAC)
- **Extracción de metadatos ID3** automática
- **Gestión completa de playlists** (CRUD)
- **Sistema de tags** para categorización
- **Streaming de audio** básico
- **API REST** con documentación completa
- **Validación de archivos** y manejo de errores
- **Soporte para caracteres especiales** (Unicode/UTF-8)

#### Base de Datos (MongoDB)
- **Almacenamiento de tracks** con metadatos completos
- **Gestión de playlists** con relaciones
- **Índices optimizados** para búsquedas
- **Agregaciones complejas** para consultas avanzadas

#### Infraestructura
- **Dockerización completa** con Docker Compose
- **Health checks** y monitoreo
- **Volúmenes persistentes** para datos
- **Networking** entre contenedores
- **Logs estructurados** con niveles configurables

### ⚠️ En Desarrollo (Stub)
- **Metadata Service** - Enriquecimiento con Spotify API (implementado como stub)
- **Sistema de usuarios** - Autenticación simplificada para MVP

### 📋 Planificado
- **Frontend React** - Interfaz de usuario completa
- **Notification Service** - Notificaciones en tiempo real
- **Search Service** - Búsquedas avanzadas y recomendaciones
- **User Service** - Gestión completa de usuarios

## Tecnologías Utilizadas

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| **Backend** | Go 1.21 + Gin | API REST y lógica de negocio |
| **Base de Datos** | MongoDB 7.0 | Almacenamiento de metadatos |
| **Contenedores** | Docker + Docker Compose | Orquestación y deployment |
| **Audio Processing** | dhowden/tag | Extracción de metadatos ID3 |
| **Validation** | gabriel-vasile/mimetype | Validación de tipos de archivo |

## API Endpoints Disponibles

### Health Check
- `GET /health` - Estado del servicio

### Tracks
- `POST /api/v1/tracks/upload` - Subir archivo de audio
- `GET /api/v1/tracks` - Listar tracks con filtros
- `GET /api/v1/tracks/{id}` - Obtener track específico
- `GET /api/v1/tracks/{id}/stream` - Stream de audio
- `DELETE /api/v1/tracks/{id}` - Eliminar track

### Playlists
- `POST /api/v1/playlists` - Crear playlist
- `GET /api/v1/playlists` - Listar playlists
- `GET /api/v1/playlists/{id}` - Obtener playlist
- `GET /api/v1/playlists/{id}?include_tracks=true` - Playlist con tracks
- `PUT /api/v1/playlists/{id}` - Actualizar playlist
- `DELETE /api/v1/playlists/{id}` - Eliminar playlist
- `POST /api/v1/playlists/{id}/tracks` - Agregar track a playlist
- `DELETE /api/v1/playlists/{id}/tracks/{trackId}` - Quitar track

### Users
- `GET /api/v1/users/{userId}/playlists` - Playlists de usuario

## Estructura del Proyecto

```
musicshare/
├── musicservice/                  # Music Service (Go)
│   ├── cmd/server/               # Entry point
│   ├── internal/
│   │   ├── config/               # Configuración
│   │   ├── handlers/rest/        # REST API handlers
│   │   ├── models/               # Modelos de datos
│   │   ├── services/             # Lógica de negocio
│   │   ├── repository/mongodb/   # Acceso a datos
│   │   └── storage/              # Manejo de archivos
│   ├── pkg/                      # Utilidades
│   ├── uploads/                  # Archivos subidos (local)
│   ├── Dockerfile                # Imagen del servicio
│   └── go.mod                    # Dependencias Go
├── scripts/
│   └── init-mongo.js            # Inicialización MongoDB
├── docker-compose.yml           # Orquestación completa
└── README.md                    # Esta documentación
```

## Deployment con Docker

### Prerrequisitos
- Docker Desktop instalado
- Docker Compose disponible
- Puertos 8081 y 27017 libres

### Despliegue Rápido

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd musicshare

# 2. Crear directorio para uploads
mkdir uploads
mkdir uploads/audio uploads/temp uploads/covers

# 3. Levantar servicios
docker-compose up --build -d

# 4. Verificar estado
docker-compose ps

# 5. Ver logs
docker-compose logs -f music-service
```

### Configuración de Servicios

#### Music Service
- **Puerto**: 8081
- **Health Check**: http://localhost:8081/health
- **Uploads**: ./uploads/ (bind mount local)
- **Logs**: JSON estructurado

#### MongoDB
- **Puerto**: 27017
- **Usuario**: admin / password123
- **Base de datos**: musicshare
- **Volumen**: mongodb_data (persistente)

### Comandos Útiles

```bash
# Ver estado de servicios
docker-compose ps

# Logs en tiempo real
docker-compose logs -f

# Parar servicios
docker-compose down

# Reconstruir servicio específico
docker-compose build music-service
docker-compose up -d music-service

# Limpiar datos (⚠️ Elimina base de datos)
docker-compose down -v

# Ejecutar comandos en contenedor
docker-compose exec music-service sh
docker-compose exec mongodb mongosh
```

## Testing de la API

### Con cURL
```bash
# Health check
curl http://localhost:8081/health

# Crear playlist
curl -X POST http://localhost:8081/api/v1/playlists \
  -H "Content-Type: application/json" \
  -d '{
    "creator_id": "user123",
    "name": "Mi Playlist",
    "description": "Una playlist de prueba",
    "is_public": true
  }'

# Upload de track
curl -X POST http://localhost:8081/api/v1/tracks/upload \
  -F "file=@song.mp3" \
  -F "user_id=user123" \
  -F "is_public=true" \
  -F "tags=rock,test"
```

### Con PowerShell
```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:8081/health"

# Crear playlist
$body = @{
    creator_id = "user123"
    name = "Mi Playlist"
    description = "Una playlist de prueba"
    is_public = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/v1/playlists" `
                  -Method POST -ContentType "application/json" -Body $body

# Upload de track
$form = @{
    file = Get-Item "C:\path\to\song.mp3"
    user_id = "user123"
    is_public = "true"
    tags = "rock,test"
}
Invoke-RestMethod -Uri "http://localhost:8081/api/v1/tracks/upload" `
                  -Method POST -Form $form
```

### Con Postman
1. Importar colección desde `/docs/postman/`
2. Configurar variables de entorno:
   - `base_url`: http://localhost:8081
   - `user_id`: user123
3. Ejecutar requests en orden

## Características Implementadas

### Gestión de Archivos
- **Soporte multi-formato**: MP3, FLAC, WAV, M4A, OGG, AAC
- **Validación de archivos**: Tipo, tamaño, integridad
- **Metadatos automáticos**: Extracción ID3 de título, artista, álbum, género
- **Nombres únicos**: Prevención de conflictos con UUID
- **Streaming eficiente**: Soporte para range requests

### Sistema de Playlists
- **CRUD completo**: Crear, leer, actualizar, eliminar
- **Relaciones complejas**: Tracks asociados a múltiples playlists
- **Agregaciones**: Duración total, conteo de tracks
- **Control de acceso**: Playlists públicas/privadas
- **Playlists colaborativas**: Edición multi-usuario

### Base de Datos
- **Índices optimizados**: Búsquedas rápidas por usuario, fecha, contenido
- **Búsqueda de texto completo**: En metadatos de canciones y playlists
- **Agregaciones MongoDB**: Queries complejas optimizadas
- **Transacciones ACID**: Operaciones atómicas críticas

### Arquitectura
- **Microservicios**: Separación clara de responsabilidades
- **Clean Architecture**: Capas bien definidas
- **Dependency Injection**: Fácil testing y modularidad
- **Error Handling**: Manejo consistente de errores
- **Logging estructurado**: Debug y monitoring efectivos

## Limitaciones Actuales

1. **Autenticación simplificada**: user_id por query parameter
2. **Metadata enrichment**: Implementado como stub
3. **Streaming básico**: Sin optimizaciones avanzadas
4. **Sin frontend**: Solo API REST
5. **Almacenamiento local**: Sin integración cloud

## Roadmap

### Próximas Funcionalidades
1. **Metadata Service real** - Integración Spotify API vía gRPC
2. **Frontend React** - Interfaz de usuario completa
3. **Sistema de usuarios** - Autenticación JWT, perfiles
4. **Funcionalidades sociales** - Seguimientos, likes, comentarios
5. **Búsqueda avanzada** - Elasticsearch, filtros complejos
6. **Notificaciones** - WebSocket, tiempo real

### Mejoras Técnicas
1. **Cloud Storage** - AWS S3/Google Cloud
2. **CDN** - Distribución de contenido global
3. **Caching** - Redis para performance
4. **Monitoring** - Métricas y alertas
5. **CI/CD** - Deployment automatizado
6. **Testing** - Cobertura completa de pruebas

## Contribución

El proyecto sigue principios de Clean Architecture y está diseñado para ser modular y extensible. Cada componente tiene responsabilidades bien definidas y interfaces claras para facilitar el desarrollo colaborativo.