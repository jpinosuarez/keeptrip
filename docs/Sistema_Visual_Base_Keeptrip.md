📄 Sistema Visual Base: Keeptrip (v2.0 - Extreme Polish)
1. Paleta de Colores (La Identidad)
Los colores de Keeptrip están diseñados para evocar energía y modernidad, con un contraste alto sobre fondos limpios. Queda estrictamente prohibido inventar variables de color fuera de esta escala.
Colores de Marca (Brand Colors):
Acento Principal (Action/Brand): Naranja Atómico (#FF6B35). Utilizado para botones principales (CTA), estados activos y elementos clave.
Acento Secundario: Verde Muted Teal (#45B0A8). Utilizado para balances visuales o métricas de éxito.
Oscuro de Marca: Charcoal Blue (#2C3E50). Usado para acentos oscuros específicos o fondos contrastantes.
Neutrales y Superficies (Fondos):
Fondo Base (Background): Slate 50 (#F8FAFC). Es el fondo general de toda la aplicación. Limpio e iluminado.
Superficies (Cards): Blanco puro (#FFFFFF). Utilizado en las tarjetas del BentoGrid para resaltar sobre el fondo.
Efecto Vidrio (Glassmorphism): Transparencias claras (rgba(255, 255, 255, 0.7) y 0.85) con backdrop-filter: blur(12px) para barras flotantes y modales.
Escala de Textos (Jerarquía):
Texto Primario (Títulos): Slate 800 (#1E293B). Casi negro, pero más suave a la vista para pantallas móviles.
Texto Secundario (Descripciones): Slate 500 (#64748B).
Texto Terciario (Metadatos/Fechas): Slate 600 (#475569).

2. Tipografía (Las Voces)
Regla de Oro: Queda ESTRICTAMENTE PROHIBIDO el uso de tipografías Serif. Buscamos un diseño digital nativo y fresco.
Títulos y Encabezados: Plus Jakarta Sans, sans-serif. Usar pesos Bold / ExtraBold para jerarquía inmediata.
Cuerpo de Texto: Inter, sans-serif. Tipografía estándar de legibilidad para descripciones y botones.
Datos Técnicos: JetBrains Mono, monospace. Solo para coordenadas o datos precisos.

3. Geometría, Espacio y Elevación (UI Fundamentals)
El diseño sigue la estética de Bento Grid (tarjetas modulares).
La Regla del 8 (Espaciado Sistémico):
Escala Estricta: Todo padding, margin y gap debe ser múltiplo de 8px (8, 16, 24, 32, 48, 64). Se permite 4px solo para micro-ajustes excepcionales.
Contenedores Fluidos: Uso obligatorio de la función min() en CSS para evitar overflows en móviles (ej. width: min(100%, 400px);).
Bordes Redondeados (Border Radius):
Micro-elementos (xs/sm): 4px a 8px (Banderas, chips).
Tarjetas secundarias (md/lg): 12px a 16px (Ítems de listas).
Tarjetas Principales (xl): 24px (Bloques del BentoGrid).
Héroes y Destacados (2xl): 32px (Portadas de viajes).
Botones y Avatares: 9999px (Forma de píldora).
Elevación y Sombras (Soft Shadows):
Token Oficial: 0 4px 20px rgba(0, 0, 0, 0.07). Sombras sumamente suaves y con mucha dispersión.
Bordes sutiles: Priorizar bordes grises suaves (#E2E8F0) acompañados de la sombra oficial.

4. Ergonomía e Interacción Móvil
Diseñado para la comodidad de uso con una sola mano ("El pulgar de Mateo/Valeria").
Touch Targets: Ningún elemento interactivo puede tener un área menor a 44x44px.
Ancho de Botones: Los CTA primarios deben tener un min-width: 240px para facilitar el alcance.
Feedback Visual: Todo botón debe reducir sutilmente su escala al presionarse (scale(0.98)) para simular feedback físico.

5. Impeccable: Filosofía y Anti-Patrones
Integración del lenguaje de diseño avanzado para agentes de IA.
Comandos de Auditoría Obligatorios:
/audit: Evaluar jerarquía visual y detectar ruidos.
/polish: Refinar el ritmo vertical y consistencia.
/distill: Simplificar. Menos es más.
Anti-Patrones Prohibidos (Red Flags):
Fuentes Genéricas: Prohibido Inter/Roboto si el diseño se siente "tipo plantilla".
Iconografía Inútil: No colocar íconos redundantes que no aporten valor semántico.
Scroll Horizontal: La existencia de scroll horizontal en móviles se considera un bug crítico.

6. Iconografía y Gamificación
Librería Base: lucide-react. Estilo de línea limpia y diseño plano.
Empty States: Estandarización de metáforas visuales:
Globe: Para estados de "Sin Viajes" (Aspiracional).
Telescope: Para "Sin Resultados de Búsqueda" (Exploración).
Evolución de Recompensas: Los "Sellos" han sido reemplazados por Insignias, Emblemas o Logros. Deben ser ilustraciones vectoriales o 3D Flat moderno.
UX Writing / Vocabulario:
Término Deprecado: "Bitácora" ha sido eliminado.
Términos Oficiales: Viaje, Historia, Aventura, Ruta, Destino o Parada.

