# Menú digital con panel de recepción en la nube

Esta versión de **Tacos Serrano** agrega un flujo de pedidos estilo Uber Eats: los clientes arman su pedido desde un menú interactivo y la cocina recibe las órdenes en vivo con alertas sonoras.

## Estructura

- `src/` contiene la SPA construida con Vite + React.
- `cloud-server/` incluye un microservicio Express + WebSocket que guarda los pedidos en memoria y los transmite en tiempo real.

## Cómo ejecutar localmente

### 1. Servidor en la nube (recepción)

```bash
cd cloud-server
npm install
npm run dev
```

El servicio queda escuchando en `http://localhost:4000`, expone REST (`/api/orders`) y un WebSocket en `ws://localhost:4000/ws`.

### 2. Aplicación web del menú

```bash
npm install
npm run dev
```

El frontend usará `http://localhost:4000` por defecto. Podés sobreescribir la URL con un archivo `.env` en la raíz del proyecto:

```ini
VITE_API_URL=https://tu-dominio.com
VITE_WS_URL=wss://tu-dominio.com
```

## Flujo de trabajo

1. El cliente selecciona productos, completa su contacto y envía el pedido.
2. La orden se guarda en el backend, que asigna un código corto (ej. `A1B2C`).
3. El panel de recepción recibe una notificación en vivo, reproduce un tono y muestra el pedido como *Pendiente*.
4. El personal puede actualizar el estado a *En preparación* o *Listo* desde el mismo panel; el backend lo replica a todos los clientes conectados.

> **Nota:** El servidor guarda los pedidos en memoria para simplificar la demo. En producción podrías reemplazarlo por una base de datos o integrarlo con un POS.
