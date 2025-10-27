package com.proyecto.spring.social_service.controllers;

import com.proyecto.spring.social_service.model.Post;
import com.proyecto.spring.social_service.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/social/posts")
@CrossOrigin
public class PostController {

    @Autowired
    private PostRepository postRepository;

    @PostMapping
    public ResponseEntity<?> crearPost(@RequestBody Post post) {
        if (!post.hasValidReference()) {
        return ResponseEntity.badRequest().body("Debe especificar solo trackId o playlistId, no ambos ni ninguno.");
        }
        post.setCreatedAt(java.time.LocalDateTime.now());
        post.setUpdatedAt(java.time.LocalDateTime.now());
        return ResponseEntity.ok(postRepository.save(post));
    }

    @GetMapping
    public List<Post> obtenerTodos() {
        return postRepository.findAll();
    }

    @GetMapping("/usuario/{userId}")
    public List<Post> obtenerPorUsuario(@PathVariable UUID userId) {
        return postRepository.findByUserId(userId);
    }

    @DeleteMapping("/{postId}")
    public void eliminarPost(@PathVariable UUID postId) {
        postRepository.deleteById(postId);
    }
}