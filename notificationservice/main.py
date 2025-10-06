import asyncio
import json
import logging
from typing import Dict, List

import pika
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pika.adapters.asyncio_connection import AsyncioConnection

# --- Configuración de Logging ---
# Configura un logging estructurado similar al que se describe en el proyecto.
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}',
    datefmt='%Y-%m-%dT%H:%M:%S%z'
)
logger = logging.getLogger(__name__)


# --- Gestor de Conexiones WebSocket ---
# Clase para gestionar de forma centralizada todas las conexiones activas.
class ConnectionManager:
    """Gestiona las conexiones WebSocket activas, asociando cada conexión a un user_id."""
    def __init__(self):
        # Almacena las conexiones activas. La clave es el user_id y el valor es el objeto WebSocket.
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Acepta una nueva conexión y la almacena."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"Nuevo cliente conectado: {user_id}. Total de conexiones: {len(self.active_connections)}")

    def disconnect(self, user_id: str):
        """Elimina una conexión del diccionario de activas."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"Cliente desconectado: {user_id}. Total de conexiones: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, user_id: str):
        """Envía un mensaje JSON a un usuario específico si está conectado."""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            try:
                await websocket.send_json(message)
                logger.info(f"Mensaje enviado a {user_id}: {json.dumps(message)}")
            except Exception as e:
                logger.error(f"Error al enviar mensaje a {user_id}: {e}")
                # Si hay un error, es probable que la conexión esté rota.
                self.disconnect(user_id)


# --- Inicialización de la Aplicación FastAPI y el Gestor ---
app = FastAPI(
    title="Notification Service",
    description="Servicio para gestionar notificaciones en tiempo real para MusicShare.",
    version="1.0.0"
)
manager = ConnectionManager()


# --- Consumidor de RabbitMQ ---
# Se encarga de escuchar eventos de otros microservicios.
class RabbitMQConsumer:
    """Consume mensajes de una cola de RabbitMQ y los reenvía a través del ConnectionManager."""
    def __init__(self, connection_manager: ConnectionManager):
        self.manager = connection_manager
        # TODO: Mover a variables de entorno en docker-compose.yml
        self.amqp_url = "amqp://guest:guest@rabbitmq/"
        self.queue_name = "notifications"

    async def on_message(self, message: pika.channel.AMQP.Basic.Deliver, body: bytes):
        """Callback que se ejecuta al recibir un mensaje de RabbitMQ."""
        try:
            # Decodifica el cuerpo del mensaje
            payload_str = body.decode('utf-8')
            logger.info(f"Mensaje recibido de RabbitMQ: {payload_str}")
            
            # Parsea el JSON
            data = json.loads(payload_str)
            
            # Valida que el mensaje tenga la estructura esperada
            recipient_id = data.get("recipient_id")
            notification_payload = data.get("payload")

            if recipient_id and notification_payload:
                # Envía la notificación al usuario a través de WebSocket
                await self.manager.send_personal_message(notification_payload, recipient_id)
            else:
                logger.warning(f"Mensaje malformado recibido, descartado: {payload_str}")

        except json.JSONDecodeError:
            logger.error(f"Error al decodificar JSON del mensaje: {body.decode('utf-8')}")
        except Exception as e:
            logger.error(f"Error procesando mensaje de RabbitMQ: {e}")

    async def consume(self):
        """Establece la conexión con RabbitMQ y empieza a consumir mensajes."""
        while True:
            try:
                connection = await asyncio.wait_for(
                    AsyncioConnection(pika.URLParameters(self.amqp_url)),
                    timeout=10
                )
                channel = await connection.channel()
                
                # Declara la cola (idempotente)
                await channel.queue_declare(self.queue_name, durable=True)
                
                logger.info("Conectado a RabbitMQ y esperando mensajes...")
                
                # Empieza a consumir mensajes de la cola
                await channel.basic_consume(self.queue_name, self.on_message, auto_ack=True)

                # Mantener el consumidor activo
                # Esperamos a que la conexión se cierre por algún motivo
                await connection.closing
                logger.warning("La conexión con RabbitMQ se ha cerrado, intentando reconectar...")

            except asyncio.TimeoutError:
                logger.error("No se pudo conectar a RabbitMQ en el tiempo esperado. Reintentando en 5 segundos...")
            except Exception as e:
                logger.error(f"Error de conexión con RabbitMQ: {e}. Reintentando en 5 segundos...")
            
            await asyncio.sleep(5)


# --- Eventos de Ciclo de Vida de la App ---
@app.on_event("startup")
async def startup_event():
    """Al iniciar la app, crea una tarea en segundo plano para el consumidor de RabbitMQ."""
    consumer = RabbitMQConsumer(manager)
    asyncio.create_task(consumer.consume())
    logger.info("Servicio de Notificaciones iniciado. Tarea de consumidor RabbitMQ creada.")


# --- Endpoints de la API ---
@app.get("/health")
async def health_check():
    """Endpoint de health check para verificar que el servicio está activo."""
    return {"status": "ok", "active_connections": len(manager.active_connections)}


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    Endpoint WebSocket. Cada cliente (frontend) se conecta a esta URL única.
    Ej: ws://localhost:8082/ws/user123
    """
    await manager.connect(websocket, user_id)
    try:
        # Mantiene la conexión abierta para recibir notificaciones push.
        # Opcionalmente, podría procesar mensajes entrantes del cliente aquí.
        while True:
            # Esperamos indefinidamente por mensajes. El cliente puede enviar pings.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"Error inesperado en WebSocket para {user_id}: {e}")
        manager.disconnect(user_id)


# --- Punto de Entrada para Uvicorn (si se ejecuta directamente) ---
if __name__ == "__main__":
    # Escucha en todas las interfaces, crucial para Docker.
    uvicorn.run(app, host="0.0.0.0", port=8082)
