# Suministros Rubio - Tienda Online & Portal de Servicios

Este es el proyecto frontend para la tienda online y portal de servicios de **Suministros Rubio** (Emiliano y Federico Rubio, S.L.), una empresa histórica de Villarrobledo (Albacete) dedicada a la distribución de suministros industriales, agrícolas, sistemas de riego, energía solar y telecomunicaciones.

Desarrollado en **Angular 17** con arquitectura standalone y compilador optimizado.

---

## 🛠️ Arquitectura del Proyecto (Feature-Based Structure)

El código fuente del frontend en `src/app/` está organizado siguiendo un diseño por dominios/características de negocio para facilitar el mantenimiento y la escalabilidad del proyecto:

*   **`🔐 auth/` (Seguridad y Acceso)**
    *   Formularios unificados de inicio de sesión (`login`) y creación de cuenta modular en pasos (`register`).
*   **`🛍️ shop/` (Comercio Electrónico)**
    *   `articulos/`: Catálogo interactivo de productos con filtrado dinámico mediante etiquetas e implementación de **Scroll Infinito** nativo (`IntersectionObserver`).
    *   `categoria/`: Visualización estructurada de secciones y familias de productos.
    *   `cart/`: Carrito de compra lateral (Sidebar drawer).
    *   `checkout/`: Formulario de facturación y pasarela de pago.
    *   `payment/`: Redirección y confirmación del estado del cobro.
*   **`👤 user/` (Gestión del Cliente)**
    *   `profile/`: Visualización de perfil de cliente e historial de pedidos.
*   **`⚙️ shared/` (Componentes Compartidos de Diseño)**
    *   `header/`: Barra de navegación fija, buscador integrado interactivo y control de menú móvil/escritorio.
    *   `footer/`: Pie de página modular que contiene `FooterBrand`, `FooterLinks`, `FooterBottom`, así como el gestor de consentimiento de cookies y políticas legales.
    *   `loading/`: Spinner de carga interceptado globalmente ante peticiones HTTP.
*   **`ℹ️ info/` (Servicios Corporativos & SEO Local)**
    *   Páginas de servicio técnico optimizadas para SEO geolocalizado en Castilla-La Mancha:
        *   `riego-solar/`: Dimensionamiento de bombeo solar fotovoltaico directo.
        *   `seguridad-homologada/`: Instalación de CCTV Uniview y alarmas inteligentes sin cuotas.
        *   `enlaces-inalambricos/`: WiFi rural de largo alcance y conectividad en bodegas.
    *   Páginas generales de `contacto`, `sobre-nosotros` y `condiciones-compra`.

---

## 🚀 Optimización SEO & Experiencia de Usuario (UX)

*   **Títulos Dinámicos de Pestaña**: Integración de la directiva `title` de Angular en [app.routes.ts](src/app/app.routes.ts) para actualizar dinámicamente el título del navegador según la pantalla activa.
*   **Diseño Fluido y Transiciones**: Integración de divisores SVG curvados en secciones críticas, animaciones de hover y rediseño completo de formularios.
*   **Geolocalización Real**: Mapa de Google Maps interactivo incrustado en el inicio enlazado con la ficha de empresa oficial en Villarrobledo.
*   **Autoría SEO**: Declaración en la cabecera HTML del creador y autor de la web: **Cristian Jiménez Martínez (CJ)**.

---

## 💻 Comandos de Desarrollo

### Requisitos Previos
*   Node.js v18 o superior.
*   Angular CLI v17.3.0.

### Instalación de Dependencias
```bash
npm install
```

### Servidor de Desarrollo local
Ejecuta el servidor de desarrollo en local:
```bash
npm run start
# o alternativamente: ng serve
```
Abre tu navegador en `http://localhost:4200/`. El servidor se recargará automáticamente al detectar cambios en los archivos de origen.

### Compilación para Producción (Build)
Para compilar los recursos de distribución de producción optimizados:
```bash
npm run build
```
Los archivos optimizados se generarán en la carpeta `dist/fedeweb/browser`, listos para desplegar en tu hosting.

---

## ✒️ Autoría
*   **Creador y Desarrollador**: [Cristian Jiménez Martínez (CJ)](https://www.linkedin.com/in/cristian-jimenez-martinez/)
*   **Cliente**: Suministros Rubio (Emiliano y Federico Rubio, S.L.)
