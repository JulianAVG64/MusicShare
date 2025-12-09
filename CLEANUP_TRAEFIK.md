# 🧹 Limpieza de Configuración Antigua (Traefik)

## ⚠️ Archivos Obsoletos

Los siguientes archivos ya **no se usan** porque hemos migrado de Traefik a NGINX:

### En `k8s/base/`

```
traefik-crd.yaml                ← YA NO NECESARIO
traefik-deployment-updated.yaml ← YA NO NECESARIO
```

### En `k8s/app/`

```
ingressroutes.yaml              ← YA NO NECESARIO
```

### En `k8s/`

```
TRAEFIK_SETUP.md                ← YA NO NECESARIO
```

## 🚀 Opción A: Limpieza Automática

```powershell
# Windows PowerShell
cd "C:\Users\Home\Documents\Decimo semestre\Arquisoft\MusicShare"

# Eliminar archivos obsoletos
Remove-Item k8s/base/traefik-crd.yaml -Force
Remove-Item k8s/base/traefik-deployment-updated.yaml -Force
Remove-Item k8s/app/ingressroutes.yaml -Force
Remove-Item k8s/TRAEFIK_SETUP.md -Force

Write-Host "✓ Archivos obsoletos eliminados"
```

O en Linux/Mac:

```bash
cd ~/MusicShare  # o tu ruta

rm -f k8s/base/traefik-crd.yaml
rm -f k8s/base/traefik-deployment-updated.yaml
rm -f k8s/app/ingressroutes.yaml
rm -f k8s/TRAEFIK_SETUP.md

echo "✓ Archivos obsoletos eliminados"
```

## 🔄 Opción B: Limpieza desde Kubernetes (Si ya desplegaste Traefik)

Si ya tienes Traefik desplegado en tu cluster, elimínalo:

```bash
# Eliminar recursos de Traefik del cluster
kubectl delete ingressroute -n musicshare --all
kubectl delete middleware -n musicshare --all
kubectl delete tlsoptions -n musicshare --all
kubectl delete tlsstores -n musicshare --all
kubectl delete traefikservices -n musicshare --all

# Ver que se eliminaron
kubectl get ingressroute -n musicshare
kubectl get middleware -n musicshare
```

## ✅ Verificación

Después de limpiar, verifica que todo esté correcto:

```powershell
# Verificar que los archivos fueron eliminados
ls k8s/base/traefik* 2>$null
# Debe estar vacío

ls k8s/app/ingressroutes* 2>$null  
# Debe estar vacío

# Verificar kustomize
kubectl kustomize k8s/base
# No debe dar errores

kubectl kustomize k8s/app
# No debe dar errores
```

## 📋 Checklist de Limpieza

- [ ] Archivos Traefik eliminados de `k8s/base/`
- [ ] `ingressroutes.yaml` eliminado de `k8s/app/`
- [ ] `TRAEFIK_SETUP.md` eliminado
- [ ] Recursos Traefik eliminados del cluster (si aplicable)
- [ ] `kustomize` sin errores
- [ ] Nuevo `ingress.yaml` presente en `k8s/app/`
- [ ] `nginx-ingress-controller.yaml` presente en `k8s/base/`

## 🎯 Resultado Esperado

Después de la limpieza:

```
k8s/base/
├── cert-manager-issuer.yaml
├── kustomization.yaml          (actualizado)
└── nginx-ingress-controller.yaml (✅ NUEVO)

k8s/app/
├── backend-deployments-services.yaml
├── cert-manager-issuer.yaml
├── databases.yaml
├── frontend-config.yaml
├── frontend-deployment-service.yaml (mejorado)
├── hpa.yaml
├── ingress.yaml                (✅ NUEVO)
├── kustomization.yaml          (actualizado)
└── namespace.yaml
```

## 🚀 Siguiente Paso

Después de limpiar, puedes desplegar sin problemas:

```bash
kubectl apply -k k8s/
```

## 💾 Backup (Opcional)

Si quieres mantener los archivos antiguos como referencia:

```powershell
# Crear carpeta de backup
New-Item -ItemType Directory -Force -Path "k8s/backup-traefik" | Out-Null

# Mover archivos en lugar de eliminarlos
Move-Item k8s/base/traefik-*.yaml k8s/backup-traefik/
Move-Item k8s/app/ingressroutes.yaml k8s/backup-traefik/
Move-Item k8s/TRAEFIK_SETUP.md k8s/backup-traefik/

Write-Host "✓ Archivos respaldados en k8s/backup-traefik/"
```

Luego puedes eliminar la carpeta después cuando estés seguro que todo funciona:

```powershell
Remove-Item k8s/backup-traefik -Recurse -Force
```

## ⚠️ Importante

- **NO elimines estos archivos ANTES de desplegar NGINX**
- Verifica primero que NGINX está corriendo
- Luego elimina los archivos de Traefik
- Esto asegura que no habrá conflictos

## 🔄 Proceso Recomendado

1. ✅ Despliega NGINX: `kubectl apply -k k8s/base/`
2. ✅ Verifica NGINX: `kubectl get pods -n ingress-nginx`
3. ✅ Verifica Ingress: `kubectl get ingress -n musicshare`
4. ✅ Elimina Traefik del cluster: `kubectl delete ingressroute -n musicshare --all`
5. ✅ Elimina archivos: `Remove-Item k8s/base/traefik-*`

---

**Próximo paso**: Sigue [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) para desplegar completamente.
