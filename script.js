const SUBMIT_URL = "https://formsubmit.co/ajax/ceovirtualstudios@gmail.com";

const form            = document.querySelector("#projectForm");
const steps           = [...document.querySelectorAll(".form-step")];
const prevBtn         = document.querySelector("#prevBtn");
const nextBtn         = document.querySelector("#nextBtn");
const submitBtn       = document.querySelector("#submitBtn");
const currentStepText = document.querySelector("#currentStep");
const progressBar     = document.querySelector("#progressBar");
const successCard     = document.querySelector("#successCard");
const resetBtn        = document.querySelector("#resetBtn");

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

// --- Envío a Google Sheets ---

async function enviarDatos(payload) {
  const body = {
    ...payload,
    objetivos: payload.objetivos.join(", "),
    servicios: payload.servicios.join(", "),
    _subject:  "📋 Nuevo brief Kactus: " + (payload.nombre || "Sin nombre"),
    _template: "table",
    _captcha:  "false",
  };

  const res = await fetch(SUBMIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Error al enviar");
}

// --- Eventos ---

nextBtn.addEventListener("click", () => {
  if (!validateCurrentStep()) return;
  currentStep += 1;
  updateStep();
  const panel = document.querySelector(".form-panel");
  if (window.innerWidth < 980) {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  panel.scrollTop = 0;
});

prevBtn.addEventListener("click", () => {
  currentStep -= 1;
  updateStep();
});

form.addEventListener("input", (event) => {
  const field = event.target.closest(".field");
  const group = event.target.closest(".field-group");
  if (field) field.classList.remove("is-invalid");
  if (group) group.classList.remove("is-invalid");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateCurrentStep()) return;

  const payload = getFormData();

  // Estado de carga
  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando…";

  try {
    await enviarDatos(payload);
    form.hidden = true;
    successCard.hidden = false;
  } catch (_) {
    submitBtn.textContent = "Error de conexión — intenta de nuevo";
    submitBtn.disabled = false;
    return;
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Enviar briefing";
});

resetBtn.addEventListener("click", () => {
  form.reset();
  form.hidden = false;
  successCard.hidden = true;
  currentStep = 0;
  updateExperienciaField();
  updateStep();
});

updateStep();
