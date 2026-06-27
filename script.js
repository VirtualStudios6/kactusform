const SUBMIT_URL = "https://formsubmit.co/ajax/ceovirtualstudios@gmail.com";
const WA_NUMERO  = "+18295846469";

const form            = document.querySelector("#projectForm");
const steps           = [...document.querySelectorAll(".form-step")];
const prevBtn         = document.querySelector("#prevBtn");
const nextBtn         = document.querySelector("#nextBtn");
const submitBtn       = document.querySelector("#submitBtn");
const currentStepText = document.querySelector("#currentStep");
const progressBar     = document.querySelector("#progressBar");
const modalOverlay    = document.querySelector("#modalOverlay");
const resetBtn        = document.querySelector("#resetBtn");
const waBtn           = document.querySelector("#waBtn");
const emailBtn        = document.querySelector("#emailBtn");

let pendingPayload = null;

const fieldExperiencia    = document.querySelector("#fieldExperiencia");
const labelExperiencia    = document.querySelector("#labelExperiencia");
const textareaExperiencia = fieldExperiencia.querySelector("textarea");

let currentStep = 0;

// --- Lógica condicional: "Describe tu experiencia" ---

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

updateExperienciaField();

// --- Navegación entre pasos ---

function updateStep() {
  steps.forEach((step, index) => {
    step.classList.toggle("is-active", index === currentStep);
  });

  currentStepText.textContent = currentStep + 1;
  progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;

  prevBtn.disabled = currentStep === 0;
  nextBtn.classList.toggle("is-hidden", currentStep === steps.length - 1);
  submitBtn.classList.toggle("is-hidden", currentStep !== steps.length - 1);
}

// --- Validación ---

function validateCurrentStep() {
  const activeStep = steps[currentStep];
  const fields     = [...activeStep.querySelectorAll(".field:not(.is-hidden)")];
  const groups     = [...activeStep.querySelectorAll(".field-group[data-required='true']")];
  let isValid = true;

  fields.forEach((field) => {
    const input = field.querySelector("input, textarea");
    if (!input) return;
    const invalid = input.hasAttribute("required") && !input.value.trim();
    field.classList.toggle("is-invalid", invalid);
    if (invalid) isValid = false;
  });

  groups.forEach((group) => {
    const checked = group.querySelector("input:checked");
    const invalid = !checked;
    group.classList.toggle("is-invalid", invalid);
    if (invalid) isValid = false;
  });

  return isValid;
}

// --- Recolecar datos ---

function getFormData() {
  const data = new FormData(form);
  const values = Object.fromEntries(data.entries());
  values.objetivos = data.getAll("objetivos");
  values.servicios = data.getAll("servicios");
  return values;
}

// --- Envío por email ---

async function enviarDatos(payload) {
  const body = {
    "Nombre":                  payload.nombre                  || "",
    "Teléfono":                payload.telefono                || "",
    "Instagram":               payload.instagram               || "",
    "Experiencia con agencia": payload.experiencia_agencia     || "",
    "Describe experiencia":    payload.descripcion_experiencia || "",
    "Negocio":                 payload.negocio                 || "",
    "Proceso del cliente":     payload.proceso_cliente         || "",
    "Objetivos":               payload.objetivos.join(", "),
    "Servicios":               payload.servicios.join(", "),
    "Referencias de marca":    payload.referencias             || "",
    "En qué podemos ayudar":   payload.ayuda                   || "",
    "Inversión mensual":       payload.inversion               || "",
    "Ventas actuales":         payload.ventas_actuales         || "",
    "Cierra ventas":           payload.cierre_ventas           || "",
    "Fecha de inicio":         payload.fecha_inicio            || "",
    "Información extra":       payload.info_extra              || "",
    _subject:  "📋 Nuevo brief Kactus: " + (payload.nombre || "Sin nombre"),
    _template: "box",
    _captcha:  "false",
  };

  const res = await fetch(SUBMIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Error al enviar");
}

// --- Sonidos ---

function crearTono(freq, dur, vol = 0.10) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch (_) {}
}

function sonarPaso() {
  crearTono(880, 0.09, 0.07);
}

function sonarExito() {
  crearTono(523, 0.35, 0.10);
  setTimeout(() => crearTono(659, 0.35, 0.09), 100);
  setTimeout(() => crearTono(784, 0.55, 0.08), 200);
  setTimeout(() => crearTono(1047, 0.70, 0.07), 330);
}

// --- Confetti ---

function lanzarConfetti() {
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed", inset: "0", width: "100%", height: "100%",
    pointerEvents: "none", zIndex: "400",
  });
  document.body.appendChild(canvas);
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx     = canvas.getContext("2d");
  const colores = ["#c7ff4a", "#86f7c5", "#ffffff", "#f7f7f2", "#a8ff6a"];
  const piezas  = Array.from({ length: 110 }, () => ({
    x:     Math.random() * canvas.width,
    y:     -12 - Math.random() * 60,
    w:     Math.random() * 9 + 4,
    h:     Math.random() * 5 + 3,
    color: colores[Math.floor(Math.random() * colores.length)],
    rot:   Math.random() * Math.PI * 2,
    rotV:  (Math.random() - 0.5) * 0.15,
    vx:    (Math.random() - 0.5) * 2,
    vy:    Math.random() * 3 + 1.5,
  }));

  let frame = 0;
  (function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    piezas.forEach((p) => {
      p.y   += p.vy;
      p.x   += p.vx + Math.sin(frame / 30 + p.rot) * 0.5;
      p.rot += p.rotV;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle    = p.color;
      ctx.globalAlpha  = Math.max(0, 1 - frame / 180);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < 200) requestAnimationFrame(tick);
    else canvas.remove();
  })();
}

// --- Abrir WhatsApp con el brief pre-llenado ---

function abrirWhatsApp(payload) {
  const l = (label, val) => val ? `▸ ${label}: ${val}\n` : "";
  const msg =
    "📋 *Nuevo Brief · Kactus Agency*\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    "👤 *CONTACTO*\n" +
    l("Nombre",    payload.nombre) +
    l("Teléfono",  payload.telefono) +
    l("Instagram", payload.instagram) +
    "\n🏢 *NEGOCIO*\n" +
    l("Actividad",           payload.negocio) +
    l("Experiencia previa",  payload.experiencia_agencia) +
    "\n🎯 *MARKETING*\n" +
    l("Objetivos", payload.objetivos?.join(", ")) +
    l("Servicios", payload.servicios?.join(", ")) +
    "\n💰 *INVERSIÓN*\n" +
    l("Monto mensual",  payload.inversion) +
    l("Cierra ventas",  payload.cierre_ventas) +
    l("Fecha de inicio",payload.fecha_inicio);

  const numero = WA_NUMERO.replace(/[^\d]/g, "");
  window.open("https://wa.me/" + numero + "?text=" + encodeURIComponent(msg), "_blank");
}

// --- Eventos ---

nextBtn.addEventListener("click", () => {
  if (!validateCurrentStep()) return;
  sonarPaso();
  currentStep += 1;
  updateStep();
  const panel = document.querySelector(".form-panel");
  if (window.innerWidth < 980) {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  panel.scrollTop = 0;
});

prevBtn.addEventListener("click", () => {
  sonarPaso();
  currentStep -= 1;
  updateStep();
});

form.addEventListener("input", (event) => {
  const field = event.target.closest(".field");
  const group = event.target.closest(".field-group");
  if (field) field.classList.remove("is-invalid");
  if (group) group.classList.remove("is-invalid");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateCurrentStep()) return;

  pendingPayload = getFormData();
  sonarExito();
  lanzarConfetti();
  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
});

waBtn.addEventListener("click", () => {
  if (pendingPayload) abrirWhatsApp(pendingPayload);
});

emailBtn.addEventListener("click", async () => {
  if (!pendingPayload) return;
  const span = emailBtn.querySelector("span");
  emailBtn.disabled = true;
  span.textContent = "Enviando…";
  try {
    await enviarDatos(pendingPayload);
    span.textContent = "✓ Correo enviado";
  } catch (_) {
    span.textContent = "Error — intenta de nuevo";
    emailBtn.disabled = false;
  }
});

resetBtn.addEventListener("click", () => {
  form.reset();
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
  pendingPayload = null;
  emailBtn.querySelector("span").textContent = "Enviar por correo";
  emailBtn.disabled = false;
  currentStep = 0;
  updateExperienciaField();
  updateStep();
});

updateStep();
