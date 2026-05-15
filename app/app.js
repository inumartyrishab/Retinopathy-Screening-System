const imageInput = document.getElementById("imageInput");
const originalCanvas = document.getElementById("originalCanvas");
const processedCanvas = document.getElementById("processedCanvas");
const heatmapCanvas = document.getElementById("heatmapCanvas");
const originalMeta = document.getElementById("originalMeta");
const processedMeta = document.getElementById("processedMeta");
const confidenceLabel = document.getElementById("confidenceLabel");
const confidenceBar = document.getElementById("confidenceBar");
const severityLabel = document.getElementById("severityLabel");
const resultNote = document.getElementById("resultNote");
const qualityScore = document.getElementById("qualityScore");
const qualityList = document.getElementById("qualityList");
const modelStatus = document.getElementById("modelStatus");

const severityClasses = [
  "No DR",
  "Mild DR",
  "Moderate DR",
  "Severe DR",
  "Proliferative DR"
];

drawEmptyState(originalCanvas, "Original image");
drawEmptyState(processedCanvas, "Preprocessed retina");
drawEmptyState(heatmapCanvas, "Grad-CAM overlay");

imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(image.src);
    processImage(image, file);
  };
  image.src = URL.createObjectURL(file);
});

function processImage(image, file) {
  drawImageContain(originalCanvas, image);
  originalMeta.textContent = `${image.naturalWidth} x ${image.naturalHeight}`;

  const processed = preprocessImage(image);
  const quality = scoreImageQuality(processed.imageData);
  drawProcessedImage(processed.imageData);
  drawHeatmap(processedCanvas, heatmapCanvas, quality);
  updateQuality(quality);
  updatePrediction(quality);

  processedMeta.textContent = "Auto contrast + crop preview";
  modelStatus.textContent = file.name.length > 24 ? `${file.name.slice(0, 21)}...` : file.name;
}

function preprocessImage(image) {
  const size = 512;
  const scratch = document.createElement("canvas");
  scratch.width = size;
  scratch.height = size;
  const ctx = scratch.getContext("2d", { willReadFrequently: true });

  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sx = (image.naturalWidth - side) / 2;
  const sy = (image.naturalHeight - side) / 2;
  ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  let min = 255;
  let max = 0;

  for (let i = 0; i < data.length; i += 4) {
    const value = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  const range = Math.max(1, max - min);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(((data[i] - min) / range) * 255 * 1.08);
    data[i + 1] = clamp(((data[i + 1] - min) / range) * 255 * 1.05);
    data[i + 2] = clamp(((data[i + 2] - min) / range) * 255);
  }

  return { imageData };
}

function scoreImageQuality(imageData) {
  const data = imageData.data;
  let brightness = 0;
  let contrastSum = 0;
  let lastLum = null;
  let edgeEnergy = 0;
  let visiblePixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    brightness += lum;
    contrastSum += Math.abs(lum - 128);
    if (lastLum !== null) edgeEnergy += Math.abs(lum - lastLum);
    if (lum > 24) visiblePixels += 1;
    lastLum = lum;
  }

  const pixels = data.length / 4;
  const avgBrightness = brightness / pixels;
  const contrast = contrastSum / pixels;
  const sharpness = edgeEnergy / pixels;
  const coverage = visiblePixels / pixels;

  const brightnessScore = 1 - Math.min(1, Math.abs(avgBrightness - 128) / 128);
  const contrastScore = Math.min(1, contrast / 58);
  const sharpnessScore = Math.min(1, sharpness / 18);
  const coverageScore = Math.min(1, coverage / 0.72);
  const overall = Math.round((brightnessScore * 0.25 + contrastScore * 0.25 + sharpnessScore * 0.25 + coverageScore * 0.25) * 100);

  return {
    avgBrightness,
    contrast,
    sharpness,
    coverage,
    overall,
    warnings: buildQualityWarnings(avgBrightness, contrast, sharpness, coverage)
  };
}

function buildQualityWarnings(brightness, contrast, sharpness, coverage) {
  const warnings = [];

  if (brightness < 72) warnings.push("Image may be too dark for reliable screening.");
  if (brightness > 190) warnings.push("Image may be overexposed.");
  if (contrast < 22) warnings.push("Low contrast; retinal lesions may be harder to distinguish.");
  if (sharpness < 7) warnings.push("Possible blur detected; recapture may improve accuracy.");
  if (coverage < 0.48) warnings.push("Retina region appears small or heavily bordered.");
  if (warnings.length === 0) warnings.push("Image quality is acceptable for prototype processing.");

  return warnings;
}

function updatePrediction(quality) {
  const qualityPenalty = Math.max(0, (82 - quality.overall) / 100);
  const pseudoSignal = Math.min(4, Math.floor((quality.contrast + quality.sharpness * 4) / 38));
  const predictedClass = Math.max(0, Math.min(4, pseudoSignal));
  const confidence = Math.round(Math.max(42, Math.min(91, 78 - qualityPenalty * 26 + predictedClass * 2)));

  severityLabel.textContent = severityClasses[predictedClass];
  severityLabel.className = predictedClass >= 3 ? "severity is-risk" : predictedClass >= 1 ? "severity is-warn" : "severity is-good";
  confidenceLabel.textContent = `${confidence}% confidence`;
  confidenceBar.style.width = `${confidence}%`;
  resultNote.textContent = "Placeholder output based on image statistics. Phase 2 will replace this with EfficientNet/ResNet inference.";
}

function updateQuality(quality) {
  qualityScore.textContent = `${quality.overall}/100`;
  qualityScore.className = quality.overall >= 75 ? "is-good" : quality.overall >= 55 ? "is-warn" : "is-risk";
  qualityList.innerHTML = "";

  quality.warnings.forEach((warning) => {
    const item = document.createElement("li");
    item.textContent = warning;
    qualityList.appendChild(item);
  });
}

function drawImageContain(canvas, image) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#101820";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = (canvas.width - width) / 2;
  const y = (canvas.height - height) / 2;
  ctx.drawImage(image, x, y, width, height);
}

function drawProcessedImage(imageData) {
  const ctx = processedCanvas.getContext("2d");
  const scratch = document.createElement("canvas");
  scratch.width = imageData.width;
  scratch.height = imageData.height;
  scratch.getContext("2d").putImageData(imageData, 0, 0);

  ctx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
  ctx.fillStyle = "#101820";
  ctx.fillRect(0, 0, processedCanvas.width, processedCanvas.height);
  const size = Math.min(processedCanvas.width, processedCanvas.height) * 0.92;
  const x = (processedCanvas.width - size) / 2;
  const y = (processedCanvas.height - size) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(processedCanvas.width / 2, processedCanvas.height / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(scratch, x, y, size, size);
  ctx.restore();
}

function drawHeatmap(sourceCanvas, targetCanvas, quality) {
  const ctx = targetCanvas.getContext("2d");
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  ctx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height);

  const centerX = targetCanvas.width * (0.48 + (quality.contrast % 10) / 90);
  const centerY = targetCanvas.height * (0.47 + (quality.sharpness % 8) / 80);
  const radius = Math.max(targetCanvas.width, targetCanvas.height) * 0.32;
  const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
  gradient.addColorStop(0, "rgba(255, 58, 48, 0.58)");
  gradient.addColorStop(0.42, "rgba(255, 184, 0, 0.36)");
  gradient.addColorStop(1, "rgba(8, 127, 140, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
}

function drawEmptyState(canvas, label) {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#101820";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#9fb0ba";
  ctx.font = "600 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}
