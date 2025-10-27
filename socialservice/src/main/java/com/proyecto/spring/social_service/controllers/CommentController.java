package com.proyecto.spring.social_service.controllers;

import com.proyecto.spring.social_service.model.Comment;
import com.proyecto.spring.social_service.repository.CommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

@RestController
@RequestMapping("/api/social/comments")
@CrossOrigin
public class CommentController {

    @Autowired
    private CommentRepository commentRepository;

    // Crear comentario en un post
    @PostMapping("/post/{postId}")
    public Comment createComment(@PathVariable UUID postId, @RequestBody Comment comment) {
        comment.setPostId(postId);
        return commentRepository.save(comment);
    }

    // Responder a otro comentario
    @PostMapping("/reply/{commentId}")
    public ResponseEntity<Comment> responderComentario(@PathVariable UUID commentId, @RequestBody Comment reply) {
        Optional<Comment> parentComment = commentRepository.findById(commentId);

        if (parentComment.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Asignar relaciones
        reply.setParentCommentId(commentId);
        reply.setPostId(parentComment.get().getPostId()); // 👈 importante
        reply.setCreatedAt(LocalDateTime.now());
        reply.setUpdatedAt(LocalDateTime.now());

        Comment nuevoComentario = commentRepository.save(reply);
        return ResponseEntity.ok(nuevoComentario);
    }


    // Obtener todos los comentarios de un post
    @GetMapping("/post/{postId}")
    public List<Comment> getCommentsByPost(@PathVariable UUID postId) {
        return commentRepository.findByPostId(postId);
    }

    // Obtener respuestas de un comentario
    @GetMapping("/replies/{parentCommentId}")
    public List<Comment> getReplies(@PathVariable UUID parentCommentId) {
        return commentRepository.findByParentCommentId(parentCommentId);
    }

    // Método para eliminar un comentario
    @DeleteMapping("/{commentId}")
    public String deleteComment(@PathVariable UUID commentId) {
        Optional<Comment> comment = commentRepository.findById(commentId);
        if (comment.isPresent()) {
            commentRepository.deleteById(commentId);
            return "Comentario eliminado correctamente.";
        } else {
            return "Comentario no encontrado.";
        }
    }
}
