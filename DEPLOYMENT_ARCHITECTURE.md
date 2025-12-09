# Arquitectura de Despliegue - MusicShare

## 📋 Resumen

Esta es la arquitectura mejorada de MusicShare que utiliza **NGINX Ingress Controller** (reemplazo de Traefik) como punto de entrada único, proporcionando:

1. **Load Balancer Público** - Acceso al Frontend React
2. **API Gateway (NGINX Ingress)** - Enrutamiento inteligente a microservicios backend
3. **Escalado Automático (HPA)** - Para servicios backend según CPU

## 🏗️ Arquitectura de Red

```
┌─────────────────────────────────────────────────────────────┐
│                       INTERNET                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────▼──────────┐
                │  AWS LoadBalancer   │
                │  (Public IP)        │
                └──────────┬──────────┘
                           │
         ┌─────────────────┴──────────────────┐
         │                                    │
    ┌────▼────────┐           ┌──────────────▼──────┐
    │   Frontend   │           │   NGINX Ingress     │
    │  (3 replicas)│           │   (2 replicas)      │
    │   React App  │           │   API Gateway       │
    │   Port 80    │           │   Port 80/443       │
    └──────────────┘           └──────────┬──────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────┐
         │                                 │                             │
    ┌────▼──────┐  ┌──────────┐  ┌────────▼───────┐  ┌─────────────────▼──┐
    │   User     │  │  Music   │  │   Social       │  │  Notification      │
    │  Service   │  │ Service  │  │   Service      │  │  Service           │
    │ :8002 (2-6)│  │ :8081 (2-6)│  │  :8083 (2-5)  │  │  :8082 (2-6)      │
    │ HPA 50%CPU │  │HPA 50%CPU│  │ HPA 55%CPU    │  │ HPA 50%CPU        │
    └────────────┘  └──────────┘  └────────────────┘  └────────────────────┘
         │                │                │                    │
         └────────────────┴────────────────┴────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────────┐  ┌────▼────────┐  ┌──▼──────────┐
    │  PostgreSQL  │  │   MongoDB    │  │  Redis      │
    │  (Persistent)│  │(Persistent)  │  │(Optional)   │
    └──────────────┘  └──────────────┘  └─────────────┘
```

## 🚀 Ventajas de NGINX Ingress vs Traefik

| Aspecto | NGINX Ingress | Traefik |
|---------|---------------|---------|
| **Estabilidad** | ✅ Muy estable | ⚠️ Problemas CRDs |
| **Documentación** | ✅ Excelente | ⚠️ Confusa |
| **Comunidad** | ✅ Masiva | ⚠️ Menor |
| **Mantenimiento** | ✅ Mejor | ⚠️ Frecuentes cambios |
| **Curva aprendizaje** | ✅ Menor | ⚠️ Mayor |
| **Performance** | ✅ Mejor | ⚠️ Similar |
| **ConfigMap Hot-reload** | ✅ Sí | ⚠️ Limitado |

## 📐 Componentes Principales

### 1. NGINX Ingress Controller
- **Tipo**: Deployment (2 réplicas)
- **Propósito**: API Gateway centralizado
- **Rutas**:
  - `/api/users/*` → UserService (8002)
  - `/api/music/*` → MusicService (8081)
  - `/api/social/*` → SocialService (8083)
  - `/api/notifications/*` → NotificationService (8082)
  - `/ws*` → NotificationService (WebSocket)
  - `/upload/*` → Next.js SSR (3000)
  - `/formulario-post/*` → Formulario Post Frontend (80)

### 2. Frontend Load Balancer
- **Tipo**: Service LoadBalancer
- **Selector**: `app: frontend`
- **Propósito**: Acceso público directo al Frontend React
- **Características**: 3 réplicas, sin HPA

### 3. Microservicios Escalables
Todos con HorizontalPodAutoscaler:

| Servicio | Min | Max | CPU | Puerto |
|----------|-----|-----|-----|--------|
| UserService | 2 | 6 | 50% | 8002 |
| MusicService | 2 | 6 | 50% | 8081 |
| SocialService | 2 | 5 | 55% | 8083 |
| NotificationService | 2 | 6 | 50% | 8082 |

## 🔄 Flujo de Tráfico

### Acceso al Frontend
```
Cliente → LoadBalancer IP → Frontend Service (ClusterIP) → Frontend Pods
```

### Acceso a APIs Backend
```
Cliente → NGINX Ingress (80/443) → User/Music/Social/Notification Services
```

### WebSocket Notifications
```
Cliente → NGINX Ingress /ws → NotificationService WebSocket Handler
```

## 📁 Estructura de Manifiestos

```
k8s/
├── base/                          # Base de configuración compartida
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── nginx-deployment.yaml      # ← NUEVO: NGINX Ingress Controller
│   └── cert-manager-issuer.yaml
│
└── app/                           # Configuración específica de MusicShare
    ├── kustomization.yaml
    ├── namespace.yaml             # Namespace musicshare
    ├── ingress.yaml               # ← NUEVO: Ingress estándar de Kubernetes
    ├── frontend-deployment-service.yaml
    ├── backend-deployments-services.yaml
    ├── databases.yaml
    ├── hpa.yaml
    └── frontend-config.yaml
```

## 🔐 Seguridad y TLS

- **HTTPS automático** vía cert-manager
- **Certificados Let's Encrypt** para dominios públicos
- **Redirección HTTP → HTTPS**
- **Rate limiting** en NGINX
- **WAF básico** disponible en NGINX Plus (opcional)

## 📊 Monitoreo

- **Prometheus** - Métricas de NGINX, pods, nodos
- **Grafana** - Dashboards visuales
- **Alertas** - CPU, memoria, disponibilidad
- **Logs** - ELK Stack (Elasticsearch, Logstash, Kibana)

## 🚀 Despliegue Paso a Paso

```bash
# 1. Crear namespace
kubectl apply -f k8s/app/namespace.yaml

# 2. Instalar NGINX Ingress Controller
kubectl apply -f k8s/base/

# 3. Desplegar servicios
kubectl apply -f k8s/app/

# 4. Verificar estado
kubectl get all -n musicshare
kubectl get ingress -n musicshare

# 5. Acceder
# Frontend: http://<LoadBalancer-IP>
# API: http://<NGINX-IP>/api/users, etc.
```

## 🧪 Pruebas de Carga

```bash
# Usar k6 para test de carga
k6 run k6/baseline.js

# Observar escalado automático
kubectl get hpa -n musicshare -w
```

## 📝 Variables de Entorno

Configuradas en cada Deployment:

```yaml
env:
  - name: POSTGRES_HOST
    value: postgres
  - name: MONGODB_URI
    value: "mongodb://admin:password@mongodb:27017/musicshare?authSource=admin"
  - name: NOTIFICATION_SERVICE_URL
    value: "http://notificationservice:8082"
  - name: USER_SERVICE_URL
    value: "http://userservice:8002"
```

## 🔍 Troubleshooting

### Ver logs del NGINX Ingress
```bash
kubectl logs -n ingress-nginx deployment/nginx-ingress-controller -f
```

### Ver configuración generada
```bash
kubectl exec -n ingress-nginx <nginx-pod> -- cat /etc/nginx/nginx.conf
```

### Verificar rutas
```bash
kubectl get ingress -n musicshare -o yaml
```

## ✅ Checklist de Despliegue

- [ ] Kubernetes cluster disponible
- [ ] kubectl configurado
- [ ] Imágenes Docker publicadas
- [ ] Namespace creado
- [ ] NGINX Ingress instalado
- [ ] Cert-manager instalado
- [ ] Servicios desplegados
- [ ] HPA configurado
- [ ] LoadBalancer con IP pública
- [ ] DNS apuntando a LoadBalancer
- [ ] HTTPS funcionando
- [ ] Monitoreo activo
