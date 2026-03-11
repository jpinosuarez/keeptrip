🚀 Plan Maestro - Fase 2.5: Extreme UI/UX Polish (Keeptrip)
📌 Visión de Calidad
Keeptrip debe dejar de sentirse como una "web optimizada para móvil" para transformarse en una Experiencia Nativa Premium. No buscamos solo funcionalidad; buscamos "Delight" (deleite). Cada transición, cada sombra y cada micro-espacio debe comunicar que este es un producto de alta gama para exploradores exigentes.

🛠 Herramienta Obligatoria: Vocabulario Impeccable
A partir de esta fase, cada tarea de UI debe ser precedida por un comando de Impeccable. La IA debe auditar antes de proponer código.

Comandos Clave a invocar:
/audit: Evaluar la jerarquía visual actual y detectar ruidos innecesarios.

/polish: Refinar el "vertical rhythm" (ritmo vertical) y la consistencia de los espaciados.

/distill: Simplificar elementos sobrecargados. Menos es más.

/bolder: Aumentar el contraste tipográfico y la presencia de los elementos de marca.

🎨 El Sistema Visual "Keeptrip + Impeccable"
1. Espacio y Geometría (La Regla del 8)
Escala Estricta: Todo padding, margin y gap debe ser múltiplo de 8px (8, 16, 24, 32, 48, 64). Excepcionalmente se permite 4px para micro-ajustes.

Contenedores Fluidos: Uso obligatorio de la función min() para evitar overflows.

Ejemplo: width: min(100%, 400px);

Espacio Negativo: "Dejar respirar" es una orden de marca. Si un componente se siente apretado, duplica el padding.

2. Capas y Profundidad (Glassmorphism 2.0)
Sombras (Soft Shadows): Prohibidas las sombras duras o negras. Usar solo el token: 0 4px 20px rgba(0,0,0,0.07).

Elevación: Los modales y overlays deben usar backdrop-filter: blur(12px) con una opacidad blanca del 70% al 85%.

3. Interacción Móvil (Ergonomía Mateo/Valeria)
Touch Targets: Ningún elemento interactivo puede medir menos de 44x44px.

Ancho de Botones: Los CTA primarios deben tener un min-width: 240px para ser alcanzados fácilmente por el pulgar.

Feedback Visual: Todo botón debe tener un estado de :active que reduzca sutilmente su escala (scale(0.98)) para simular presión física.

🚫 Anti-Patrones Prohibidos (Design Red Flags)
Fuentes Genéricas: Prohibido el uso de Inter, Roboto o Arial si no están definidas en theme.js.

Iconografía Inútil: No pongas un ícono encima de cada título si no aporta valor semántico (Evitar el "efecto plantilla").

Bordes Pesados: Preferir el uso de profundidad (sombras suaves) sobre bordes negros o grises oscuros.

Scroll Horizontal: Cualquier rastro de scroll horizontal en móviles se considera un bug crítico de UI.

🎯 Próximos Objetivos de Pulido
Home (TripGrid): Auditar el contraste de los títulos sobre las imágenes. ¿La capa de degradado es suficiente para leer con sol de frente?

Visor de Viaje: Refinar la transición entre el Mapa y el Timeline. Debe sentirse como una sola pieza de software, no dos secciones pegadas.

Buscador (SearchModal): Mejorar los "Empty States" de búsqueda para que no se sientan genéricos.

💡 Instrucción para la IA:
"Antes de cada cambio, realiza un /audit visual basado en este documento. Describe los problemas de jerarquía que encuentres y propón una solución que use el vocabulario de diseño de Impeccable antes de tocar el CSS."