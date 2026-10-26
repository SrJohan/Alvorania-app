// Genera src/app/globals.css desde replica/design/tokens.json. Uso: node scripts/tokens-to-css.mjs
import fs from "node:fs";
const t = JSON.parse(fs.readFileSync("../replica/design/tokens.json", "utf8"));
let c = `/* Generado desde replica/design/tokens.json con scripts/tokens-to-css.mjs. No editar a mano. */\n@import "tailwindcss";\n\n@theme {\n  --color-*: initial;\n`;
for (const [k, v] of Object.entries(t.color)) c += `  --color-${k}: ${v};\n`;
c += `  --font-sans: ${t.font.sans};\n  --font-display: ${t.font.display};\n  --font-mono: ${t.font.mono};\n`;
for (const [k, v] of Object.entries(t.type)) c += `  --text-${k}: ${v.size}px;\n  --text-${k}--line-height: ${v.line}px;\n  --text-${k}--font-weight: ${v.weight};\n`;
c += `  --radius-*: initial;\n`;
for (const [k, v] of Object.entries(t.radius)) c += `  --radius-${k}: ${v}px;\n`;
c += `  --shadow-*: initial;\n`;
for (const [k, v] of Object.entries(t.shadow)) c += `  --shadow-${k}: ${v};\n`;
c += `  --breakpoint-*: initial;\n`;
for (const [k, v] of Object.entries(t.layout.breakpoints)) c += `  --breakpoint-${k}: ${v}px;\n`;
c += `  --container-content: ${t.layout["content-max"]}px;\n  --container-reading: ${t.layout["reading-max"]}px;
  --container-wide: ${t.layout["wide-max"]}px;\n  --ease-brand: ${t.motion.ease};\n}\n\n`;
c += `html { scroll-behavior: smooth; }\nbody { background: var(--color-bg); color: var(--color-text); font-family: var(--font-sans); }\nh1, h2, .font-display { font-family: var(--font-display); letter-spacing: -0.035em; }\n:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }\n@media (prefers-reduced-motion: reduce) { * { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }\n`;
// Movimiento: entrada al cargar (.anim-rise), cambio de contenido (.anim-swap) y aparición al hacer scroll ([data-reveal]).
// Solo transform y opacidad. La curva sale de los tokens; con "reducir movimiento" el contenido aparece sin recorrido.
c += `\n@keyframes rise { from { opacity: 0; transform: translateY(var(--rise, 16px)); } to { opacity: 1; transform: none; } }\n.anim-rise { animation: rise 560ms ${t.motion.ease} backwards; animation-delay: var(--d, 0ms); }\n.anim-swap { --rise: 12px; animation: rise 380ms ${t.motion.ease} backwards; animation-delay: var(--d, 0ms); }\n[data-reveal] { transition: opacity 640ms ${t.motion.ease}, transform 640ms ${t.motion.ease}; transition-delay: var(--d, 0ms); }\n[data-reveal="hidden"] { opacity: 0; transform: translateY(22px); }\n@media (prefers-reduced-motion: reduce) { .anim-rise, .anim-swap { animation: none; } [data-reveal] { transition: none; } [data-reveal="hidden"] { opacity: 1; transform: none; } }\n`;
fs.writeFileSync("src/app/globals.css", c);
