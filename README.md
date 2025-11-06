# SimulaCredit

SimulaCredit es una aplicación web para simular créditos hipotecarios y gestionar clientes y propiedades. Permite calcular cuotas, ver indicadores financieros, generar reportes y descargar resultados en PDF y Excel.

**Qué Hace**

- Simulación de préstamos: calcula cuota mensual, cronograma y métricas (TCEA, VAN, TIR, duración modificada) desde `src/lib/financialCalculations.ts`.
- Gestión de clientes: registro, listado y administración desde componentes en `src/components` y servicios en `src/services`.
- Catálogo de propiedades: visualiza proyectos y detalles con imágenes y atributos principales.
- Resultados y reportes: pantallas de “Resultados” y “Reportes” con tablas y filtros simples.
- Exportación: descarga PDF y Excel para resultados y reportes mediante `jspdf`, `jspdf-autotable` y `xlsx` (utilidades en `src/utils/exportUtils.ts`).
- Ayudas contextuales: tooltips y alertas de éxito en secciones clave.

**Cómo Se Desarrolló**

- Frontend con Vite + React + TypeScript y el plugin `@vitejs/plugin-react-swc` para compilación rápida.
- Componentes de UI basados en [shadcn/ui] y iconos de `lucide-react` para un diseño consistente.
- Datos y servicios: capa de servicios (`authService`, `clientService`, `propertyService`, `simulationService`, `userService`) sobre `src/lib/supabase.ts`.
- Estado y datos remotos: uso de TanStack Query (`@tanstack/react-query`) en listados y catálogos.
- Exportación de archivos: se añadieron funciones reutilizables en `src/utils/exportUtils.ts` y se conectaron botones en `SimpleReports.tsx` y `SimulationResultsWithHelp.tsx`.
- Ajustes recientes: reemplazo de componentes de Figma eliminados por `<img>`; corrección de `vite.config.ts` quitando `jsxRuntime` inválido; armonización de tipos (`LoanConfig.interestRate`).

**Estructura Principal**

- `src/components`: pantallas y componentes (Catálogo, Detalle, Simulador, Resultados, Reportes, Configuración, Gestión de Usuarios).
- `src/lib/financialCalculations.ts`: funciones financieras y conversión de tasas.
- `src/services`: capa de acceso a datos (Supabase).
- `src/utils/exportUtils.ts`: utilidades para PDF/Excel.
- `src/App.tsx`: navegación principal y definición de tipos.

**Requisitos**

- Node.js 18+ recomendado.
- Configurar variables de entorno para Supabase en `.env` si se usarán servicios remotos.

**Instalación y Ejecución**

- Instalar dependencias: `npm i`
- Arrancar entorno de desarrollo: `npm run dev`
- El servidor de desarrollo abre en `http://localhost:3000/` (definido en `vite.config.ts`).

**Descarga de Archivos**

- PDF: resumen de simulación y tabla de amortización; reportes de clientes y simulaciones.
- Excel: hojas con datos equivalentes a los PDF.

**Notas**

- Los cálculos financieros pueden ampliarse según tus necesidades (p. ej., costos, seguros, impuestos).
