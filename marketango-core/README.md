# Marketango Core

Sistema central de autenticación, usuarios, clientes y permisos para el ecosistema Marketango.

**Servicios:**
- `api.marketango.co` — API REST completa (clientes, usuarios, integraciones)
- `auth.marketango.co` — Endpoints de autenticación (mismo proceso, rutas `/api/v1/auth/*`)

---

## Stack

- Node.js 20 + Express
- MySQL 8 (via `mysql2`)
- JWT + bcrypt
- Docker + Nginx

---

## Estructura

```
src/
├── app.js              # Express app
├── server.js           # Entry point
├── database/           # Conexión MySQL y migraciones SQL
├── middleware/         # auth, roles, rateLimiter, validate
├── models/             # Queries a DB (sin ORM)
├── services/           # Lógica de negocio
├── controllers/        # Manejo de requests/responses
├── routes/             # Definición de rutas
└── utils/              # logger (winston), response helpers
```

---

## Configuración

```bash
cp .env.example .env
# Editar .env con tus valores reales
```

Variables requeridas:

| Variable | Descripción |
|---|---|
| `DB_HOST` | Host MySQL |
| `DB_USER` | Usuario MySQL |
| `DB_PASSWORD` | Password MySQL |
| `DB_NAME` | Nombre de la base de datos |
| `JWT_SECRET` | Secret JWT (mínimo 32 caracteres) |
| `JWT_EXPIRES_IN` | Duración del access token (ej: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Duración del refresh token (ej: `7d`) |
| `API_PORT` | Puerto del servidor (default: `3000`) |
| `CORS_ORIGINS` | Orígenes permitidos (separados por coma) |

---

## Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# editar .env

# 3. Levantar MySQL con Docker
docker compose up db -d

# 4. Ejecutar migraciones
node scripts/migrate.js

# 5. Iniciar servidor
npm run dev
```

Con Docker completo:

```bash
docker compose up -d
docker compose exec api node scripts/migrate.js
```

---

## API Reference

### Auth

```
POST /api/v1/auth/register   # Crear usuario
POST /api/v1/auth/login      # Obtener tokens
POST /api/v1/auth/refresh    # Renovar access token
POST /api/v1/auth/logout     # Cerrar sesión (requiere JWT)
```

### Clientes

```
GET    /api/v1/clients         # Listar (admin, team)
POST   /api/v1/clients         # Crear (admin)
GET    /api/v1/clients/:id     # Ver (admin, team)
PUT    /api/v1/clients/:id     # Actualizar (admin)
DELETE /api/v1/clients/:id     # Eliminar (admin)
```

### Usuarios

```
GET    /api/v1/users           # Listar (admin)
PUT    /api/v1/users/:id       # Actualizar rol/status (admin)
DELETE /api/v1/users/:id       # Eliminar (admin)
```

### Integraciones

```
GET  /api/v1/clients/:id/integrations  # Listar (admin, team)
POST /api/v1/clients/:id/integrations  # Crear (admin)
```

### Roles

| Rol | Permisos |
|---|---|
| `admin` | Acceso total |
| `team` | Lectura de clientes e integraciones |
| `client` | Acceso solo a sus propios datos (futuro) |

---

## Integración con otros módulos

### Verificar JWT desde writer.marketango.co

**Opción A (recomendada) — Compartir JWT_SECRET:**

```js
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Opción B — Llamar a auth.marketango.co:**

```js
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const response = await fetch('https://auth.marketango.co/api/v1/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return res.status(401).json({ error: 'Unauthorized' });
  next();
}
```

### Consultar clientes desde cualquier módulo

```js
async function getClients(userToken) {
  const res = await fetch('https://api.marketango.co/api/v1/clients', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  const { data } = await res.json();
  return data.clients;
}
```

---

## Despliegue en VPS

### Prerequisitos

```bash
# En el VPS
apt update && apt install -y docker.io docker-compose-plugin git
systemctl enable docker && systemctl start docker
```

### Primer despliegue

```bash
# Clonar repositorio
git clone https://github.com/tu-org/marketango-bis.git /var/www/marketango
cd /var/www/marketango/marketango-core

# Configurar variables de entorno
cp .env.example .env
nano .env  # Rellenar con valores reales de producción

# Iniciar
docker compose up -d --build

# Ejecutar migraciones
docker compose exec api node scripts/migrate.js
```

### Despliegues posteriores (manual)

```bash
bash scripts/deploy.sh
```

### Despliegue automático (GitHub Actions)

Configura estos secrets en GitHub → Settings → Secrets:

| Secret | Valor |
|---|---|
| `VPS_HOST` | IP o dominio del VPS |
| `VPS_USER` | Usuario SSH (ej: `ubuntu`) |
| `VPS_SSH_KEY` | Clave privada SSH (contenido del archivo `~/.ssh/id_rsa`) |
| `VPS_PATH` | Ruta en el VPS (ej: `/var/www/marketango`) |

Cada push a `main` que toque archivos en `marketango-core/` dispara el pipeline automáticamente.

---

## Nginx

Copiar la configuración de `docker/nginx.conf` al VPS:

```bash
cp docker/nginx.conf /etc/nginx/sites-available/marketango-core
ln -s /etc/nginx/sites-available/marketango-core /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Obtener certificados SSL:

```bash
certbot --nginx -d api.marketango.co -d auth.marketango.co
```

---

## Seguridad en VPS

- **SSH:** Solo clave privada, deshabilitar autenticación por contraseña
  ```
  # /etc/ssh/sshd_config
  PasswordAuthentication no
  ```
- **Firewall:** Solo puertos 22, 80, 443
  ```bash
  ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw enable
  ```
- **Fail2ban:** Protección contra ataques de fuerza bruta
  ```bash
  apt install fail2ban && systemctl enable fail2ban
  ```
- **MySQL:** Solo accesible desde la red interna Docker, nunca expuesto al exterior
- **`.env`:** Nunca en el repositorio. Configurar manualmente en el VPS
- **JWT_SECRET:** Mínimo 32 caracteres aleatorios. Generar con:
  ```bash
  openssl rand -base64 48
  ```
- **Actualizaciones:** Mantener imagen base Docker actualizada periódicamente

---

## Tests

```bash
npm test
```

Los tests usan mocks del modelo de DB y no requieren conexión a MySQL.

---

## Health Check

```bash
curl https://api.marketango.co/api/v1/health
# {"status":"ok","timestamp":"2026-..."}
```
