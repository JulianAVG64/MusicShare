package rest

import (
	"net/http"
	"strconv"
	"strings"

	"musicservice/internal/models"
	"musicservice/internal/services"
	"musicservice/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type TrackHandler struct {
	trackService *services.TrackService
	validator    *validator.Validate
}

func NewTrackHandler(trackService *services.TrackService) *TrackHandler {
	return &TrackHandler{
		trackService: trackService,
		validator:    validator.New(),
	}
}

// UploadTrack handles track upload requests
func (h *TrackHandler) UploadTrack(c *gin.Context) {
	// Parse multipart form
	if err := c.Request.ParseMultipartForm(50 << 20); err != nil { // 50MB max
		utils.ErrorResponse(c, http.StatusBadRequest, "Failed to parse multipart form")
		return
	}

	// Get file from form
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "No file provided")
		return
	}
	defer file.Close()

	// Parse request data
	var req models.TrackUploadRequest
	if err := c.ShouldBind(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request data")
		return
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Validation failed: "+err.Error())
		return
	}

	// Parse tags if provided
	if tagsStr := c.PostForm("tags"); tagsStr != "" {
		req.Tags = strings.Split(tagsStr, ",")
		for i, tag := range req.Tags {
			req.Tags[i] = strings.TrimSpace(tag)
		}
	}

	// Parse is_public
	if isPublicStr := c.PostForm("is_public"); isPublicStr != "" {
		req.IsPublic = isPublicStr == "true"
	}

	// Upload track
	track, err := h.trackService.UploadTrack(c.Request.Context(), file, header, req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, track, "Track uploaded successfully")
}

// GetTrack handles getting a single track by ID
func (h *TrackHandler) GetTrack(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Track ID is required")
		return
	}

	track, err := h.trackService.GetTrack(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.ErrorResponse(c, http.StatusNotFound, "Track not found")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, track, "Track retrieved successfully")
}

// ListTracks handles listing tracks with filters and pagination
func (h *TrackHandler) ListTracks(c *gin.Context) {
	var filter models.TrackFilter

	// Bind query parameters
	if err := c.ShouldBindQuery(&filter); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid query parameters")
		return
	}

	// Set defaults
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 20
	}
	if filter.Limit > 100 {
		filter.Limit = 100
	}

	tracks, total, err := h.trackService.ListTracks(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Calculate pagination info
	totalPages := (total + int64(filter.Limit) - 1) / int64(filter.Limit)
	
	response := gin.H{
		"tracks": tracks,
		"pagination": gin.H{
			"current_page":  filter.Page,
			"per_page":     filter.Limit,
			"total_pages":  totalPages,
			"total_items":  total,
			"has_next":     filter.Page < int(totalPages),
			"has_prev":     filter.Page > 1,
		},
	}

	utils.SuccessResponse(c, http.StatusOK, response, "Tracks retrieved successfully")
}

// DeleteTrack handles track deletion
func (h *TrackHandler) DeleteTrack(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Track ID is required")
		return
	}

	// Get user ID from context (would be set by auth middleware)
	userID := c.GetString("user_id")
	if userID == "" {
		// For MVP, accept user_id from query parameter
		userID = c.Query("user_id")
		if userID == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "User ID is required")
			return
		}
	}

	err := h.trackService.DeleteTrack(c.Request.Context(), id, userID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.ErrorResponse(c, http.StatusNotFound, "Track not found")
			return
		}
		if strings.Contains(err.Error(), "unauthorized") {
			utils.ErrorResponse(c, http.StatusForbidden, "Unauthorized")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, nil, "Track deleted successfully")
}

// StreamTrack handles audio streaming
func (h *TrackHandler) StreamTrack(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Track ID is required")
		return
	}

	track, err := h.trackService.GetTrackStream(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.ErrorResponse(c, http.StatusNotFound, "Track not found")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Check if track is public or user owns it
	userID := c.GetString("user_id")
	if !track.IsPublic && track.UserID != userID {
		utils.ErrorResponse(c, http.StatusForbidden, "Track is private")
		return
	}

	// Serve the file directly
	c.Header("Content-Type", track.MimeType)
	c.Header("Content-Length", strconv.FormatInt(track.FileSize, 10))
	c.Header("Accept-Ranges", "bytes")
	
	// For MVP, redirect to file URL
	c.Redirect(http.StatusTemporaryRedirect, track.FileURL)
}