# Backend Placeholder

This folder is reserved for the Phase 2 FastAPI inference service.

Planned endpoint:

```text
POST /predict
```

Expected behavior:

1. Accept an uploaded retina image.
2. Run the same preprocessing used during model training.
3. Run PyTorch inference.
4. Return DR severity, confidence, referable/non-referable flag, quality warnings, and a Grad-CAM image.

The current browser app in `app/` uses local placeholder logic only. That keeps Phase 1 demoable before the model exists.
