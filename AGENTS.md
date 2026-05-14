# Contexto del Proyecto: 1001 Albums App

## Rol del Agente
Actúa como un Desarrollador Senior de React Native, experto en Expo, TypeScript y diseño de interfaces de usuario avanzadas. Escribe código limpio, modular, tipado estrictamente y optimizado para rendimiento en dispositivos móviles.

## Stack Tecnológico Principal
- **Framework:** React Native con Expo (Managed Workflow)
- **Lenguaje:** TypeScript (Estricto)
- **Navegación:** React Navigation (Native Stack)
- **Almacenamiento:** `@react-native-async-storage/async-storage`
- **Animaciones y UI:** `moti` y `react-native-reanimated`

## Reglas de Arquitectura
1. **Separación de Responsabilidades:** Mantén la lógica de negocio fuera de los componentes de UI. Utiliza Custom Hooks (ej. `useAlbums.ts`) para gestionar el estado, el almacenamiento local y la lógica de filtrado/aleatoriedad.
2. **Estructura de Directorios:**
    - `/src/components`: Componentes visuales reutilizables (botones, tarjetas).
    - `/src/screens`: Pantallas principales de la navegación.
    - `/src/hooks`: Lógica de negocio y gestión de estado.
    - `/src/data`: Archivos JSON estáticos y assets.
    - `/src/types`: Interfaces y tipos globales de TypeScript.
    - `/src/theme`: Paleta de colores, tipografía y espaciados globales.

## Reglas de Código y Estilo
1. **TypeScript Estricto:** Nunca utilices `any`. Define interfaces claras para los modelos de datos (ej. `Album`), los parámetros de navegación y las props de los componentes.
2. **Estilos:** No utilices estilos en línea (`style={{...}}`). Utiliza siempre `StyleSheet.create` de React Native al final del archivo del componente.
3. **Componentes Funcionales:** Usa siempre componentes funcionales con React Hooks.

## Directrices de UI/UX (Estética Cinematográfica)
1. **Dark Mode por Defecto:** La aplicación debe tener un diseño con fondo oscuro intenso (ej. `#121212` o `#0A0A0A`) que evoque una sensación premium y de sala de cine.
2. **Tipografía y Contraste:** Usa colores claros (blancos rotos, grises ceniza) para el texto principal. Los acentos y botones principales deben tener un color que contraste elegantemente sin ser chillón.
3. **Animaciones Fluidas:** Todas las transiciones de estado importantes (aparición de un nuevo disco, apertura de modales, feedback de botones) deben estar animadas utilizando `moti`. Las animaciones deben ser sutiles, orgánicas y fluidas (evita rebotes exagerados; prioriza *fade-ins* y escalados suaves).
4. **SafeArea:** Envuelve siempre las pantallas principales en un `SafeAreaView` para respetar los *notches* y los bordes del dispositivo.

## Comportamiento del Agente
- Al proponer nuevo código, proporciona solo las partes relevantes o el archivo completo si es necesario.
- Si una petición rompe las reglas de arquitectura, adviértelo y sugiere la alternativa alineada con este documento.
- Asume el uso de `pnpm` para cualquier sugerencia de instalación de paquetes.pnpm