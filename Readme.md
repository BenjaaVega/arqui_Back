# G6 Arquisis Frontend - Plataforma de Gestión Inmobiliaria

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF.svg)](https://vitejs.dev/)
[![Auth0](https://img.shields.io/badge/Auth0-Enabled-green.svg)](https://auth0.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Una aplicación web moderna para la gestión de propiedades inmobiliarias, desarrollada con React y Vite. Permite a los usuarios explorar propiedades, agendar visitas, gestionar su perfil y wallet digital.

## Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Monitoreo](#-monitoreo)
- [API Endpoints](#-api-endpoints)
- [Autenticación](#-autenticación)
- [Desarrollo](#-desarrollo)
- [Despliegue con CloudFront + S3](#-despliegue-con-cloudfront--s3)
- [Contribución](#-contribución)

## ✨ Características

###  Autenticación y Perfil
- **Login seguro** con Auth0
- **Gestión de perfil** personalizable
- **Wallet digital** integrado
- **Historial de transacciones**

### Gestión de Propiedades
- **Exploración** de propiedades con filtros
- **Detalles completos** de cada propiedad
- **Sistema de cupos** para visitas
- **Agendamiento** de visitas (10% del precio)

### Sistema de Visitas
- **Solicitud de visitas** en tiempo real
- **Estados de validación** (PENDING, OK, ACCEPTED, REJECTED, ERROR)
- **Historial completo** de solicitudes
- **Polling automático** para actualizaciones
- **Integración MQTT** para validación asíncrona

##  Wallet y Pagos
- **Recarga de saldo** desde el frontend
- **Pago automático** de agendamientos (10% del arriendo)
- **Validación de saldo** antes de transacciones
- **Historial detallado** de movimientos

## Tecnologías

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 19.1.1 | Framework principal |
| **Vite** | 7.1.7 | Build tool y dev server |
| **React Router** | 7.8.1 | Enrutamiento |
| **** | 2.5.0 | Autenticación |
| **Axios** | 1.11.0 | Cliente HTTP |
| **Yarn** | 4.8.1 | Package manager |

## Instalación

### Prerrequisitos

- **Node.js** >= 18.0.0
- **Yarn** >= 4.8.1
- **Git**

### Instalación de Yarn (si es necesario)

```bash
# Remover instalaciones anteriores de Yarn
rm -f ~/.nvm/versions/node/*/bin/yarn
rm -f ~/.nvm/versions/node/*/bin/yarnpkg
sudo rm -f /usr/local/bin/yarn
sudo rm -f /usr/local/bin/yarnpkg

# Habilitar Corepack y preparar Yarn
corepack enable
corepack prepare yarn@4.8.1 --activate

# Actualizar shell
hash -r
exec $SHELL

# Verificar instalación
which yarn
yarn -v
```

### Clonar y Configurar

```bash
# Clonar el repositorio
git clone https://github.com/giacop002/g6_arquisis_front.git
cd g6_arquisis_front

# Instalar dependencias
yarn install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```bash
# =============================================================================
# CONFIGURACIÓN DE API BACKEND
# =============================================================================

# Para DESARROLLO LOCAL:
VITE_API_URL=http://localhost:8001

# Para PRODUCCIÓN:
# VITE_API_URL=https://e8rbromtx3.execute-api.us-east-1.amazonaws.com/produccion/

# =============================================================================
# CONFIGURACIÓN AUTH0
# =============================================================================
VITE_AUTH0_DOMAIN= rellenar...
VITE_AUTH0_CLIENT_ID= rellenar...
VITE_AUTH0_AUDIENCE= rellenar...
# =============================================================================
# CONFIGURACIÓN DE DESARROLLO
# =============================================================================
VITE_PORT= rellenar...
VITE_DEV_MODE= rellenar...
```


##  Uso

### Comandos Disponibles

```bash
# Desarrollo
yarn dev          # Inicia servidor de desarrollo (puerto 5173)

# Producción
yarn build        # Construye para producción
yarn preview      # Previsualiza build de producción

# Calidad de código
yarn lint         # Ejecuta ESLint
```

### Flujo de Usuario

1. **Autenticación**
   - Login con Auth0
   - Configuración de perfil

2. **Exploración**
   - Navegar propiedades con filtros
   - Ver detalles y cupos disponibles

3. **Agendamiento**
   - Solicitar visita (reserva cupo)
   - Validación automática vía MQTT
   - Pago automático si es aprobada

4. **Gestión**
   - Ver historial de visitas
   - Recargar wallet
   - Actualizar perfil

## 📊 Monitoreo

### Sistema de Estados

El sistema implementa un flujo completo de monitoreo de solicitudes de visita:

#### Estados de Solicitud

| Estado | Descripción | Acción del Backend |
|--------|-------------|-------------------|
| `PENDING` | Solicitud creada | Reduce cupos, publica a MQTT |
| `OK` | Recibida por broker | Confirma recepción |
| `ACCEPTED` | Aprobada y pagada | Descuenta saldo, mantiene cupo |
| `REJECTED` | Rechazada sin cargo | Devuelve cupo, sin descuento |
| `ERROR` | Error al procesar | Devuelve cupo, log de error |

#### Flujo de Monitoreo

El sistema implementa un flujo de estados que se actualiza automáticamente:

1. **PENDING** → Usuario solicita visita
2. **OK** → MQTT Listener recibe la solicitud  
3. **ACCEPTED/REJECTED/ERROR** → Validación externa completa
4. **ACCEPTED** → Descuenta saldo del wallet
5. **REJECTED/ERROR** → Devuelve cupo sin cargo

### Herramientas de Monitoreo

#### 1. **Console Logs (Desarrollo)**

```javascript
// Logs automáticos en DevTools Console
console.log("Token obtenido exitosamente para API:", "https://api.g6-arquisis.com");
console.log("Solicitudes recibidas del backend:", response.data);
console.log("Solicitudes normalizadas:", normalizedRequests);
```

#### 2. **Network Tab (DevTools)**

Monitorear peticiones HTTP:
- `GET /properties` - Carga de propiedades
- `POST /visits/request` - Solicitud de visita
- `GET /wallet` - Estado del wallet
- `POST /wallet/recharge` - Recarga de saldo- 


#### 3. **Polling Automático**

```javascript
// Actualización automática cada 10 segundos
useEffect(() => {
  const interval = setInterval(() => {
    loadVisitRequests();
  }, 10000);
  return () => clearInterval(interval);
}, [user]);
```

#### 4. **Estados Visuales**

- **Badges de estado** con colores distintivos
- **Contadores** en filtros de pestañas
- **Mensajes informativos** por estado
- **Validación de saldo** en tiempo real

### Pasos de Monitoreo Implementados

1. **Configuración de Logs**
   - ✅ Logs de autenticación Auth0
   - ✅ Logs de peticiones API
   - ✅ Logs de estados de solicitudes

2. **Monitoreo de Estados**
   - ✅ Polling automático cada 10 segundos
   - ✅ Actualización visual de badges
   - ✅ Contadores de solicitudes por estado

3. **Validación de Flujos**
   - ✅ Verificación de cupos disponibles
   - ✅ Validación de saldo del wallet
   - ✅ Manejo de errores de red

4. **Información Visual**
   - ✅ Filtros por estado funcionales
   - ✅ Mensajes descriptivos por estado
   - ✅ Fechas y timestamps

## 🔌 API Endpoints

### Autenticación
```http
POST /visits/request
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "url": "https://portalinmobiliario.com/..."
}
```

### Propiedades
```http
GET /properties?page=1&limit=24&location=Providencia&price=500000
Authorization: Bearer <jwt_token>
```

### Historial
```http
GET /my-properties
Authorization: Bearer <jwt_token>
```

### Wallet
```http
GET /wallet
POST /wallet/recharge
POST /wallet/purchase
Authorization: Bearer <jwt_token>
```








##  Desarrollo

### Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Footer/         # Pie de página
│   ├── Navbar/         # Navegación principal
│   ├── PropertieCard/  # Tarjeta de propiedad
│   └── VisitHistory/   # Historial de visitas
├── pages/              # Páginas principales
│   ├── Landing/        # Página de inicio
│   ├── Login/          # Autenticación
│   ├── MainPage/       # Listado de propiedades
│   ├── Profile/        # Perfil de usuario
│   └── Wallet/         # Gestión de wallet
├── lib/                # Utilidades
│   └── api.js          # Cliente HTTP
├── utils/              # Helpers
└── assets/             # Recursos estáticos
```

### Scripts de Desarrollo

```bash
# Desarrollo con hot reload
yarn dev

# Build de producción
yarn build

# Linting
yarn lint

# Preview de producción
yarn preview
```

## 🚀 Despliegue con CloudFront + S3

### Arquitectura de Despliegue

El proyecto está configurado para desplegarse en AWS usando **Amazon S3** como almacenamiento estático y **CloudFront** como CDN global.

**Flujo de despliegue:**
1. **Desarrollador** ejecuta `yarn build`
2. **Archivos estáticos** se generan en `/dist`
3. **S3 Bucket** almacena los archivos
4. **CloudFront Distribution** sirve el contenido globalmente
5. **Usuarios** acceden vía CloudFront

**CI/CD Pipeline:**
- GitHub Actions ejecuta build automático
- Deploy automático a S3
- Invalidación automática de CloudFront

### Configuración AWS

**Nota:** Esta sección documenta la configuración teórica para AWS. Los recursos reales deben ser configurados por el equipo de DevOps.

#### **S3 Bucket**
- Bucket para almacenar archivos estáticos
- Configuración de hosting estático
- Política de acceso público

#### **CloudFront Distribution**
- CDN global para distribución de contenido
- Configuración de cache y headers
- Manejo de errores 404 para SPA routing

### Scripts de Despliegue

#### **Build para Producción**

```bash
# Construir el proyecto
yarn build

# Los archivos se generan en la carpeta /dist
# Estos archivos deben ser subidos manualmente a S3
```

**URLs actuales del proyecto:**
- **CloudFront URL**: `https://dbdcin4y3ybd.cloudfront.net`
- **Custom Domain**: `https://www.iic2173-e0-repablo6.me`
- **Alternate Domain**: `https://iic2173-e0-repablo6.me`

**Nota:** Las secciones de monitoreo, optimizaciones y troubleshooting no están implementadas actualmente. Estas son configuraciones teóricas para futuras implementaciones.

