package com.proyecto.spring.social_service.controllers;

import com.proyecto.spring.social_service.model.Like;
import com.proyecto.spring.social_service.repository.LikeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/social/likes")
@CrossOrigin
public class LikeController {

    @Autowired
    private LikeRepository likeRepository;

    // Crear un like
    @PostMapping
    public Like crearLike(@RequestBody Like like) {
        if (likeRepository.existsByUserIdAndPostId(like.getUserId(), like.getPostId())) {
            throw new RuntimeException("El usuario ya dio like a este post");
        }
        like.setCreatedAt(LocalDateTime.now());
        return likeRepository.save(like);
    }

    // Obtener likes de un post
    @GetMapping("/post/{postId}")
    public List<Like> obtenerLikesPorPost(@PathVariable UUID postId) {
        return likeRepository.findByPostId(postId);
    }

    // Eliminar un like
    @DeleteMapping("/{likeId}")
    public void eliminarLike(@PathVariable UUID likeId) {
        likeRepository.deleteById(likeId);
    }
}
