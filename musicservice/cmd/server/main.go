package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"musicservice/internal/config"
	"musicservice/internal/handlers/grpc"
	"musicservice/internal/handlers/rest"
	"musicservice/internal/repository/mongodb"
	"musicservice/internal/services"
	"musicservice/internal/storage"
	"musicservice/pkg/logger"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize logger
	logger.Init(cfg.LogLevel)
	logger.Info("Starting Music Service...")

	// Initialize MongoDB connection
	mongoClient, err := mongodb.Connect(cfg.MongoDB.URI)
	if err != nil {
		logger.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer mongodb.Disconnect(mongoClient)

	// Initialize repositories
	trackRepo := mongodb.NewTrackRepository(mongoClient, cfg.MongoDB.Database)
	playlistRepo := mongodb.NewPlaylistRepository(mongoClient, cfg.MongoDB.Database)

	// Initialize storage
	fileStorage := storage.NewLocalStorage(cfg.Storage.BasePath)

	// Initialize gRPC client for Metadata Service (optional for MVP)
	var metadataClient grpc.MetadataClient
	if cfg.MetadataService.GRPCAddress != "" {
		client, err := grpc.NewMetadataClient(cfg.MetadataService.GRPCAddress)
		if err != nil {
			logger.Warnf("Failed to connect to Metadata Service: %v", err)
			logger.Info("Running without Metadata Service - tracks will not be enriched")
			metadataClient = nil
		} else {
			metadataClient = client
			defer metadataClient.Close()
		}
	}

	// Initialize services
	trackService := services.NewTrackService(trackRepo, fileStorage, metadataClient)
	playlistService := services.NewPlaylistService(playlistRepo, trackRepo)

	// Initialize REST handlers
	trackHandler := rest.NewTrackHandler(trackService)
	playlistHandler := rest.NewPlaylistHandler(playlistService)

	// Setup Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORS configuration
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	router.Use(cors.New(corsConfig))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"service":   "music-service",
			"timestamp": time.Now().UTC(),
		})
	})

	// API routes
	v1 := router.Group("/api/v1")
	{
		// Track routes
		tracks := v1.Group("/tracks")
		{
			tracks.POST("/upload", trackHandler.UploadTrack)
			tracks.GET("/:id", trackHandler.GetTrack)
			tracks.GET("/", trackHandler.ListTracks)
			tracks.DELETE("/:id", trackHandler.DeleteTrack)
			tracks.GET("/:id/stream", trackHandler.StreamTrack)
		}

		// Playlist routes
		playlists := v1.Group("/playlists")
		{
			playlists.POST("/", playlistHandler.CreatePlaylist)
			playlists.GET("/:id", playlistHandler.GetPlaylist)
			playlists.GET("/", playlistHandler.ListPlaylists)
			playlists.PUT("/:id", playlistHandler.UpdatePlaylist)
			playlists.DELETE("/:id", playlistHandler.DeletePlaylist)
			playlists.POST("/:id/tracks", playlistHandler.AddTrackToPlaylist)
			playlists.DELETE("/:id/tracks/:trackId", playlistHandler.RemoveTrackFromPlaylist)
		}

		// User-specific routes
		users := v1.Group("/users")
		{
			users.GET("/:userId/playlists", playlistHandler.GetUserPlaylists)
		}
	}

	// Static file serving for uploaded files
	router.Static("/uploads", cfg.Storage.BasePath)

	// Create HTTP server
	srv := &http.Server{
		Addr:    cfg.Server.Address,
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		logger.Infof("Music Service starting on %s", cfg.Server.Address)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down Music Service...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Errorf("Music Service forced to shutdown: %v", err)
	}

	logger.Info("Music Service shutdown complete")
}
