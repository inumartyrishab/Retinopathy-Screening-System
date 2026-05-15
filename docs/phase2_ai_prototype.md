# Phase 2 AI Prototype Plan

## Goal

Train a working diabetic retinopathy severity classifier before starting hardware design.

## First Training Milestone

- Dataset: APTOS 2019.
- Model: EfficientNet-B0.
- Classes: `0 No DR`, `1 Mild`, `2 Moderate`, `3 Severe`, `4 Proliferative`.
- Target: 75-85% validation accuracy plus a confusion matrix and per-class recall.

## Folder Plan

```text
data/
  aptos/
    train_images/
    train.csv
models/
  efficientnet_b0_best.pt
notebooks/
  01_dataset_exploration.ipynb
  02_training_baseline.ipynb
backend/
  main.py
```

## Training Steps

1. Download APTOS from Kaggle.
2. Inspect class distribution.
3. Split into train/validation sets with stratification.
4. Apply preprocessing: crop fundus, resize, normalize.
5. Add augmentation: horizontal flip, rotation, brightness/contrast jitter.
6. Fine-tune EfficientNet-B0.
7. Save best checkpoint by validation kappa or validation accuracy.
8. Generate Grad-CAM for sample predictions.
9. Wrap inference with FastAPI.
10. Connect the app to the API.

## Minimal API Contract

```json
{
  "severity_class": 2,
  "severity_label": "Moderate DR",
  "confidence": 0.82,
  "referable_dr": true,
  "quality_warnings": ["Possible blur detected"],
  "gradcam_url": "/outputs/sample-gradcam.png"
}
```

## Validation Notes

Do not report only overall accuracy. DR datasets are imbalanced, so the prototype should include:

- Confusion matrix.
- Per-class precision and recall.
- Quadratic weighted kappa.
- Referable DR sensitivity and specificity.
- External validation on Messidor when possible.
