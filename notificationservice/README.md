Notification Service Documentation

Este servicio es el centro de notificaciones en tiempo real de MusicShare. Utiliza WebSockets para mantener una conexión persistente con los clientes (el frontend) y RabbitMQ para recibir eventos de otros microservicios de backend.
Cómo Funciona

    Conexión del Cliente: El frontend establece una conexión WebSocket con este servicio en el endpoint ws://<host>/ws/{user_id} tan pronto como un usuario inicia sesión.

    Publicación de Eventos: Cuando un evento que requiere una notificación ocurre en otro servicio (por ejemplo, el Music Service), ese servicio publica un mensaje en la cola notifications de RabbitMQ.

    Consumo y Difusión: Este servicio consume el mensaje de la cola, identifica al usuario destinatario y envía el payload de la notificación a través de la conexión WebSocket correspondiente.

    Recepción en el Frontend: El frontend recibe el mensaje JSON y muestra una notificación en la interfaz de usuario.

Guía de Uso para Otros Servicios (Productores)

Para enviar una notificación, tu servicio debe publicar un mensaje en RabbitMQ.
Detalles de Conexión a RabbitMQ

    Host: rabbitmq (nombre del servicio en Docker Compose)

    Puerto: 5672

    Usuario: guest

    Contraseña: guest

    Nombre de la Cola (Queue): notifications

Formato del Mensaje

El cuerpo del mensaje debe ser un objeto JSON con la siguiente estructura:

{
  "recipient_id": "string",
  "payload": {
    "type": "string",
    "data": {}
  }
}

    recipient_id (requerido): El ID del usuario que debe recibir la notificación.

    payload (requerido): Un objeto que contiene la notificación real que se enviará al frontend.

        type: Una cadena que el frontend puede usar para determinar cómo manejar la notificación (ej. NEW_FOLLOWER, PLAYLIST_UPDATED, NEW_SONG_UPLOADED).

        data: Un objeto que contiene los datos relevantes para la notificación.

Ejemplo de Mensaje

Si el usuario user-alice-123 añade una nueva canción (song-beatles-456) a una de sus playlists (playlist-rock-789), el Music Service podría publicar el siguiente mensaje:

{
  "recipient_id": "user-bob-456",
  "payload": {
    "type": "NEW_SONG_IN_PLAYLIST",
    "data": {
      "message": "Alice ha añadido 'Hey Jude' a la playlist 'Rock Classics'.",
      "author_id": "user-alice-123",
      "author_name": "Alice",
      "playlist_id": "playlist-rock-789",
      "song_id": "song-beatles-456",
      "song_title": "Hey Jude"
    }
  }
}

Ejemplo de Publicador en Go (para Music Service)

package main

import (
    "context"
    "encoding/json"
    "log"
    "time"

    amqp "[github.com/rabbitmq/amqp091-go](https://github.com/rabbitmq/amqp091-go)"
)

// NotificationPayload define la estructura del mensaje a enviar.
type NotificationPayload struct {
    RecipientID string      `json:"recipient_id"`
    Payload     interface{} `json:"payload"`
}

func main() {
    // Conectar a RabbitMQ
    conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/") // Usar 'rabbitmq:5672' en Docker
    if err != nil {
        log.Fatalf("Failed to connect to RabbitMQ: %s", err)
    }
    defer conn.Close()

    ch, err := conn.Channel()
    if err != nil {
        log.Fatalf("Failed to open a channel: %s", err)
    }
    defer ch.Close()

    // Declarar la cola para asegurarse de que existe
    q, err := ch.QueueDeclare(
        "notifications", // name
        true,            // durable
        false,           // delete when unused
        false,           // exclusive
        false,           // no-wait
        nil,             // arguments
    )
    if err != nil {
        log.Fatalf("Failed to declare a queue: %s", err)
    }

    // Construir el mensaje
    notification := NotificationPayload{
        RecipientID: "user-bob-456",
        Payload: map[string]interface{}{
            "type": "NEW_SONG_IN_PLAYLIST",
            "data": map[string]string{
                "message":      "Alice added a new song to 'Rock Classics'",
                "playlist_id":  "playlist-rock-789",
                "song_title":   "Hey Jude",
            },
        },
    }

    body, err := json.Marshal(notification)
    if err != nil {
        log.Fatalf("Failed to marshal JSON: %s", err)
    }

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // Publicar el mensaje
    err = ch.PublishWithContext(ctx,
        "",     // exchange
        q.Name, // routing key (queue name)
        false,  // mandatory
        false,  // immediate
        amqp.Publishing{
            ContentType: "application/json",
            Body:        body,
        })
    if err != nil {
        log.Fatalf("Failed to publish a message: %s", err)
    }

    log.Printf(" [x] Sent notification for %s", notification.RecipientID)
}

Guía de Uso para el Frontend (Consumidor)

El frontend debe establecer y mantener una conexión WebSocket para recibir las notificaciones.
Endpoint WebSocket

    URL: ws://<host_del_notification_service>:8082/ws/{user_id}

    Ejemplo: ws://localhost:8082/ws/user-bob-456

Ejemplo de Cliente en JavaScript (para React)

import React, { useEffect, useState } from 'react';

const NOTIFICATION_SERVICE_URL = 'ws://localhost:8082/ws/';

function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    console.log(`Connecting to WebSocket for user: ${userId}`);
    const ws = new WebSocket(`${NOTIFICATION_SERVICE_URL}${userId}`);

    ws.onopen = () => {
      console.log('WebSocket connection established.');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log('Received notification:', notification);
        // Añade la nueva notificación al estado para mostrarla en la UI
        setNotifications(prev => [notification, ...prev]);
        
        // Aquí podrías usar una librería como react-toastify para mostrar un popup
        // toast.info(notification.data.message);

      } catch (error) {
        console.error('Error parsing notification data:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed.');
      setIsConnected(false);
      // Opcional: Implementar lógica de reconexión
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Limpiar la conexión al desmontar el componente
    return () => {
      ws.close();
    };
  }, [userId]);

  return { notifications, isConnected };
}

// Ejemplo de uso en un componente de React
function NotificationBell({ userId }) {
  const { notifications, isConnected } = useNotifications(userId);

  return (
    <div>
      <span>Status: {isConnected ? 'Connected' : 'Disconnected'}</span>
      <div>
        Bell Icon ({notifications.length})
      </div>
      {/* Aquí renderizarías la lista de notificaciones */}
    </div>
  );
}

