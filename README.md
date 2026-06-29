# Kactus Form

Landing + formulario estático para Kactus Agency, una agencia de marketing digital enfocada en México. El proyecto está pensado para desplegarse en Vercel bajo `kactusagency.mx`.

## Estructura

- `index.html`: landing principal.
- `form/index.html`: formulario de brief.
- `styles.css`: estilos base y del formulario.
- `landing.css`: estilos específicos de la landing.
- `script.js`: validación, envío por FormSubmit, modal, WhatsApp y estados de UX.
- `logo.png`: logo usado en landing y formulario.

`Code.gs` fue eliminado porque Google Apps Script / Google Sheets ya no se usa en este proyecto.

## Correr localmente

Puedes abrir `index.html` directamente en el navegador, pero para probar rutas como `/form/` conviene usar un servidor local:

```bash
npx serve .
```

Luego abre la URL local que indique la terminal.

## Despliegue en Vercel

Este proyecto no requiere build. En Vercel debe publicarse como sitio estático desde la raíz del repositorio.

No se modificó DNS ni configuración de Vercel.

## Configuración de contacto

Los datos actuales son temporales de prueba del desarrollador. Antes de entregar al cliente, cámbialos en [script.js](script.js):

```js
const SUBMIT_URL = "https://formsubmit.co/ajax/hola@kactusagency.mx";
const WA_NUMERO = "+528443414579";
```

- Correo receptor de FormSubmit: cambia el correo dentro de `SUBMIT_URL`.
- Número de WhatsApp: cambia `WA_NUMERO`.
- Correo visible en landing: actualmente no hay correo visible en la landing.
- Links de contacto visibles: actualmente los CTAs apuntan a `/form/`.

## Envío con FormSubmit

El formulario envía los leads a FormSubmit desde `script.js` usando `fetch`. El código valida:

- respuesta HTTP con `res.ok`;
- JSON de FormSubmit;
- `success: true`;
- `success: false` como error;
- errores de red, cuota, captcha o correo receptor no confirmado.

El modal de éxito solo se muestra cuando FormSubmit acepta el envío. Si falla, el formulario no se limpia automáticamente.

## Anti-spam

Se mantiene `_captcha: "false"` para evitar un captcha visible que pueda romper la experiencia AJAX. La protección básica actual usa:

- honeypot oculto (`_gotcha`);
- tiempo mínimo de llenado;
- bloqueo de doble submit mientras se procesa el envío.

Si el spam aumenta, considera activar un captcha o mover el envío a un backend propio.

## Imagen Open Graph

Las previews sociales apuntan a:

```text
/assets/og-kactus.jpg
```

Antes de entrega final, colocar una imagen 1200x630 en `assets/og-kactus.jpg` para que WhatsApp, Facebook, X/Twitter y otras redes muestren una preview profesional.

## Antes de entregar al cliente

- Cambiar el correo receptor de FormSubmit por el correo final del cliente.
- Cambiar el número de WhatsApp por el número final del cliente.
- Subir `assets/og-kactus.jpg` en 1200x630.
- Probar un envío real.
- Confirmar que el correo receptor de FormSubmit esté verificado.
- Probar `kactusagency.mx` y `www.kactusagency.mx`.
- Probar el formulario en móvil.
- Probar la preview al compartir por WhatsApp.
- Revisar textos legales/privacidad si el cliente lo requiere.

## Pruebas manuales

1. Landing desktop.
2. Landing mobile, especialmente el CTA principal “Cuéntanos tu proyecto”.
3. Click en “Cuéntanos tu proyecto” y navegación a `/form/`.
4. Formulario multi-step.
5. Validaciones por campo y por grupo de opciones.
6. Doble click en “Enviar briefing”.
7. Error de FormSubmit usando una URL inválida temporalmente.
8. Modal con teclado, Tab/Shift+Tab y cierre con Escape.
9. WhatsApp con mensaje prellenado.
10. “Enviar otro formulario”.
11. Preview social si existe `assets/og-kactus.jpg`.
