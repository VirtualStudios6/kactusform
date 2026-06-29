const SUBMIT_URL = "https://formsubmit.co/ajax/hola@kactusagency.mx";

const WA_NUMERO = "+528443414579";
const MIN_FILL_TIME_MS = 3500;

const form = document.querySelector("#projectForm");
const steps = [...document.querySelectorAll(".form-step")];
const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const submitBtn = document.querySelector("#submitBtn");
const progressBar = document.querySelector("#progressBar");
const modalOverlay = document.querySelector("#modalOverlay");
const resetBtn = document.querySelector("#resetBtn");
const waBtn = document.querySelector("#waBtn");
const emailBtn = document.querySelector("#emailBtn");
const ambosBtn = document.querySelector("#ambosBtn");
const stepDotsEl = document.querySelector("#stepDots");
const formStatus = document.querySelector("#formStatus");
const startedAtInput = document.querySelector('input[name="_started_at"]');
const footerYear = document.querySelector("#footerYear");

let pendingPayload = null;
let currentStep = 0;
let isSending = false;
let previousFocus = null;
let audioCtx = null;

if (startedAtInput) startedAtInput.value = String(Date.now());
if (footerYear) footerYear.textContent = String(new Date().getFullYear());

steps.forEach(() => {
  const dot = document.createElement("div");
  dot.className = "step-dot";
  stepDotsEl.appendChild(dot);
});

const fieldExperiencia = document.querySelector("#fieldExperiencia");
const labelExperiencia = document.querySelector("#labelExperiencia");
const textareaExperiencia = fieldExperiencia.querySelector("textarea");

const experienciaLabels = {
  "Sí": "Describe tu experiencia con esa agencia *",
  "Lo hacemos nosotros mismos": "¿Cómo manejan el marketing actualmente? *",
};

function updateExperienciaField() {
  const selected = document.querySelector('input[name="experiencia_agencia"]:checked');

  if (!selected || selected.value === "No") {
    fieldExperiencia.classList.add("is-hidden");
    textareaExperiencia.required = false;
    textareaExperiencia.value = "";
    fieldExperiencia.classList.remove("is-invalid");
  } else {
    fieldExperiencia.classList.remove("is-hidden");
    textareaExperiencia.required = true;
    labelExperiencia.textContent =
      experienciaLabels[selected.value] ?? "Describe tu experiencia *";
  }
}

document.querySelectorAll('input[name="experiencia_agencia"]').forEach((radio) => {
  radio.addEventListener("change", updateExperienciaField);
});

const fechaInicioInput = form.querySelector('input[name="fecha_inicio"]');
if (fechaInicioInput) {
  fechaInicioInput.min = new Date().toISOString().slice(0, 10);
}

function updateStep() {
  steps.forEach((step, index) => {
    step.classList.toggle("is-active", index === currentStep);
  });

  progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
  prevBtn.disabled = isSending || currentStep === 0;
  nextBtn.disabled = isSending;
  nextBtn.classList.toggle("is-hidden", currentStep === steps.length - 1);
  submitBtn.classList.toggle("is-hidden", currentStep !== steps.length - 1);

  stepDotsEl.querySelectorAll(".step-dot").forEach((dot, i) => {
    dot.classList.toggle("is-active", i === currentStep);
    dot.classList.toggle("is-done", i < currentStep);
  });
}

function setStatus(message = "", type = "error") {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.toggle("is-error", Boolean(message) && type === "error");
  formStatus.classList.toggle("is-success", Boolean(message) && type === "success");
}

function setFieldError(field, message) {
  const error = field.querySelector(".error");
  field.classList.toggle("is-invalid", Boolean(message));
  if (error && message) error.textContent = message;
}

function isReasonablePhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 && /^[+\d\s().-]+$/.test(value);
}

function isReasonableInstagram(value) {
  return /^@?[a-zA-Z0-9._]{2,30}$/.test(value.trim());
}

function validateField(field) {
  const input = field.querySelector("input, textarea");
  if (!input || !input.hasAttribute("required")) return true;

  const value = input.value.trim();
  let message = "";

  if (!value) {
    message = "Completa este campo.";
  } else if (input.name === "nombre" && value.length < 3) {
    message = "Escribe un nombre de al menos 3 caracteres.";
  } else if (input.name === "telefono" && !isReasonablePhone(value)) {
    message = "Escribe un teléfono válido con lada.";
  } else if (input.name === "instagram" && !isReasonableInstagram(value)) {
    message = "Escribe un usuario de Instagram válido.";
  } else if (input.name === "fecha_inicio") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(`${value}T00:00:00`);
    if (selected < today) message = "La fecha no puede ser anterior a hoy.";
  } else if (input.tagName === "TEXTAREA") {
    if (value.length < 12) message = "Agrega un poco más de detalle.";
    if (value.length > 1200) message = "Reduce el texto a máximo 1200 caracteres.";
  }

  setFieldError(field, message);
  return !message;
}

function validateCurrentStep() {
  const activeStep = steps[currentStep];
  const fields = [...activeStep.querySelectorAll(".field:not(.is-hidden)")];
  const groups = [...activeStep.querySelectorAll(".field-group[data-required='true']")];
  let isValid = true;

  fields.forEach((field) => {
    if (!validateField(field)) isValid = false;
  });

  groups.forEach((group) => {
    const invalid = !group.querySelector("input:checked");
    group.classList.toggle("is-invalid", invalid);
    if (invalid) isValid = false;
  });

  return isValid;
}

function validateAntiSpam() {
  const honeypot = form.querySelector('input[name="_gotcha"]');
  const startedAt = Number(startedAtInput?.value || Date.now());
  if (honeypot?.value) return "No pudimos validar el formulario. Intenta de nuevo.";
  if (Date.now() - startedAt < MIN_FILL_TIME_MS) {
    return "Espera unos segundos antes de enviar el formulario.";
  }
  return "";
}

function getFormData() {
  const data = new FormData(form);
  const values = Object.fromEntries(data.entries());
  values.objetivos = data.getAll("objetivos");
  values.servicios = data.getAll("servicios");
  return values;
}

async function enviarDatos(payload) {
  const body = {
    Nombre: payload.nombre || "",
    Teléfono: payload.telefono || "",
    Instagram: payload.instagram || "",
    "Experiencia con agencia": payload.experiencia_agencia || "",
    "Describe experiencia": payload.descripcion_experiencia || "",
    Negocio: payload.negocio || "",
    "Proceso del cliente": payload.proceso_cliente || "",
    Objetivos: payload.objetivos.join(", "),
    Servicios: payload.servicios.join(", "),
    "Referencias de marca": payload.referencias || "",
    "En qué podemos ayudar": payload.ayuda || "",
    "Inversión mensual": payload.inversion || "",
    "Ventas actuales": payload.ventas_actuales || "",
    "Cierra ventas": payload.cierre_ventas || "",
    "Fecha de inicio": payload.fecha_inicio || "",
    "Información extra": payload.info_extra || "",
    _subject: `Nuevo brief Kactus: ${payload.nombre || "Sin nombre"}`,
    _template: "box",
    _captcha: "false",
  };

  const res = await fetch(SUBMIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  let json = null;
  try {
    json = await res.json();
  } catch (_) {
    json = null;
  }

  const accepted =
    res.ok &&
    json &&
    (json.success === true ||
      json.success === "true" ||
      json.success === "True");

  if (!accepted) {
    const message =
      json?.message ||
      json?.error ||
      (!json
        ? "FormSubmit no devolvió una respuesta válida. Intenta de nuevo."
        : "") ||
      (res.status === 403
        ? "FormSubmit rechazó el envío. Revisa captcha o confirma el correo receptor."
        : "No pudimos enviar el formulario. Intenta de nuevo en unos minutos.");
    throw new Error(message);
  }

  return json;
}

function crearTono(freq, dur, vol = 0.1) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (_) {}
}

function sonarPaso() {
  crearTono(880, 0.09, 0.07);
}

function sonarExito() {
  crearTono(523, 0.35, 0.1);
  setTimeout(() => crearTono(659, 0.35, 0.09), 100);
  setTimeout(() => crearTono(784, 0.55, 0.08), 200);
  setTimeout(() => crearTono(1047, 0.7, 0.07), 330);
}

function lanzarConfetti() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "400",
  });
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext("2d");
  const colores = ["#c7ff4a", "#86f7c5", "#ffffff", "#f7f7f2", "#a8ff6a"];
  const piezas = Array.from({ length: 110 }, () => ({
    x: Math.random() * canvas.width,
    y: -12 - Math.random() * 60,
    w: Math.random() * 9 + 4,
    h: Math.random() * 5 + 3,
    color: colores[Math.floor(Math.random() * colores.length)],
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.15,
    vx: (Math.random() - 0.5) * 2,
    vy: Math.random() * 3 + 1.5,
  }));

  let frame = 0;
  (function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    piezas.forEach((p) => {
      p.y += p.vy;
      p.x += p.vx + Math.sin(frame / 30 + p.rot) * 0.5;
      p.rot += p.rotV;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / 180);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < 200) requestAnimationFrame(tick);
    else canvas.remove();
  })();
}

function construirMsgWA(payload) {
  const line = (label, val) => (val ? `- ${label}: ${val}\n` : "");
  return (
    "*Nuevo Brief - Kactus Agency*\n\n" +
    "*Contacto*\n" +
    line("Nombre", payload.nombre) +
    line("Teléfono", payload.telefono) +
    line("Instagram", payload.instagram) +
    "\n*Negocio*\n" +
    line("Actividad", payload.negocio) +
    line("Experiencia previa", payload.experiencia_agencia) +
    "\n*Marketing*\n" +
    line("Objetivos", payload.objetivos?.join(", ")) +
    line("Servicios", payload.servicios?.join(", ")) +
    "\n*Inversión*\n" +
    line("Monto mensual", payload.inversion) +
    line("Cierra ventas", payload.cierre_ventas) +
    line("Fecha de inicio", payload.fecha_inicio)
  );
}

function abrirWhatsApp(payload) {
  const numero = WA_NUMERO.replace(/[^\d]/g, "");
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(construirMsgWA(payload))}`;
  window.location.href = url;
}

function setSubmittingState(submitting) {
  isSending = submitting;
  prevBtn.disabled = submitting || currentStep === 0;
  nextBtn.disabled = submitting;
  submitBtn.disabled = submitting;
  resetBtn.disabled = submitting;
  waBtn.disabled = submitting;
  emailBtn.disabled = true;
  ambosBtn.disabled = submitting;
}

function focusableModalElements() {
  return [
    ...modalOverlay.querySelectorAll(
      "button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])",
    ),
  ].filter((el) => !el.disabled && el.offsetParent !== null);
}

function openSuccessModal() {
  previousFocus = document.activeElement;
  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  emailBtn.querySelector("span").textContent = "Correo enviado";
  emailBtn.disabled = true;
  ambosBtn.querySelector("span").textContent = "Abrir WhatsApp";
  setTimeout(() => focusableModalElements()[0]?.focus(), 0);
}

function closeSuccessModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
  previousFocus?.focus?.();
}

function resetFormState() {
  form.reset();
  pendingPayload = null;
  setStatus();
  emailBtn.querySelector("span").textContent = "Correo enviado";
  emailBtn.disabled = true;
  ambosBtn.querySelector("span").textContent = "Abrir WhatsApp";
  ambosBtn.disabled = false;
  waBtn.disabled = false;
  resetBtn.disabled = false;
  currentStep = 0;
  if (startedAtInput) startedAtInput.value = String(Date.now());
  updateExperienciaField();
  updateStep();
}

function scrollToCurrentStep() {
  const panel = document.querySelector(".form-panel");
  if (!panel) return;
  const top = panel.getBoundingClientRect().top + window.scrollY - 16;
  window.scrollTo({ top, behavior: "smooth" });
}

nextBtn.addEventListener("click", () => {
  if (!validateCurrentStep()) return;
  sonarPaso();
  currentStep += 1;
  updateStep();
  if (window.innerWidth < 980) scrollToCurrentStep();
});

prevBtn.addEventListener("click", () => {
  sonarPaso();
  currentStep -= 1;
  updateStep();
  if (window.innerWidth < 980) scrollToCurrentStep();
});

form.addEventListener("input", (event) => {
  const field = event.target.closest(".field");
  const group = event.target.closest(".field-group");
  if (field) field.classList.remove("is-invalid");
  if (group) group.classList.remove("is-invalid");
  setStatus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isSending) return;
  if (!validateCurrentStep()) return;

  const spamError = validateAntiSpam();
  if (spamError) {
    setStatus(spamError);
    return;
  }

  pendingPayload = getFormData();
  setSubmittingState(true);
  setStatus("Enviando tu brief...", "success");

  try {
    await enviarDatos(pendingPayload);
    sonarExito();
    lanzarConfetti();
    setStatus();
    openSuccessModal();
  } catch (err) {
    setStatus(err.message || "No pudimos enviar el formulario. Intenta de nuevo.");
  } finally {
    setSubmittingState(false);
    updateStep();
  }
});

waBtn.addEventListener("click", () => {
  if (pendingPayload) abrirWhatsApp(pendingPayload);
});

emailBtn.addEventListener("click", () => {
  emailBtn.querySelector("span").textContent = "Correo enviado";
});

ambosBtn.addEventListener("click", () => {
  if (!pendingPayload) return;
  const capturedPayload = pendingPayload;
  const span = ambosBtn.querySelector("span");
  ambosBtn.disabled = true;
  waBtn.disabled = true;
  emailBtn.disabled = true;
  resetBtn.disabled = true;
  span.textContent = "Abriendo WhatsApp...";
  setTimeout(() => abrirWhatsApp(capturedPayload), 600);
});

resetBtn.addEventListener("click", () => {
  if (isSending || resetBtn.disabled) return;
  closeSuccessModal();
  resetFormState();
});

modalOverlay.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeSuccessModal();
    return;
  }

  if (event.key !== "Tab") return;
  const items = focusableModalElements();
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

updateExperienciaField();
updateStep();
