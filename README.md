# Low-Cost Diabetic Retinopathy Screening System

This project is a prototype for a low-cost diabetic retinopathy (DR) screening workflow:

1. Capture a retinal/fundus image with a smartphone attachment.
2. Preprocess the image for model input.
3. Classify DR severity with a pretrained CNN fine-tuned on fundus datasets.
4. Display severity, confidence, image quality notes, and Grad-CAM explainability.

The current repo focuses on Phase 1 planning and an app prototype. The classifier shown in the static app is a UI placeholder until a trained PyTorch model and API are connected.

## Project Phases

| Phase | Focus | Output |
| --- | --- | --- |
| Phase 1 | Research and planning | Literature review, architecture diagram, chosen stack |
| Phase 2 | AI prototype | Transfer-learning DR classifier with severity and confidence |
| Phase 3 | Image pipeline | Phone image preprocessing from raw capture to model-ready retina image |

## Chosen Stack

| Component | Choice |
| --- | --- |
| AI model | EfficientNet-B0 first, ResNet50 as baseline |
| Training | PyTorch + torchvision/timm |
| Backend | FastAPI |
| Frontend prototype | Static HTML/CSS/JS now; React Native or Flutter later for mobile |
| Image processing | OpenCV, PIL/Pillow, NumPy |
| Explainability | Grad-CAM |
| Hardware concept | 3D printed smartphone fundus attachment with macro lens and controlled illumination |

## Files

- `docs/phase1_research.md` - research summary, grading scale, datasets, risks, and Week 1-7 timeline.
- `docs/architecture.mmd` - Mermaid system architecture diagram.
- `app/index.html` - browser prototype.
- `app/styles.css` - app styling.
- `app/app.js` - upload, preprocessing preview, quality scoring, and placeholder result logic.

## Run The Prototype

Open `app/index.html` in a browser, or run a tiny local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/app/`.

## Medical Disclaimer

This is a student/research prototype, not a medical device. It must not be used for diagnosis or treatment decisions without clinical validation, regulatory review, and qualified clinician oversight.
