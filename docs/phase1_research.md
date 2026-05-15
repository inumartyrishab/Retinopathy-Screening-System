# Phase 1 Research And Planning

## Problem

Diabetes is increasing globally, and diabetic retinopathy can cause preventable vision loss when screening is delayed. Standard screening often depends on fundus cameras, trained technicians, and ophthalmologists. This project aims to replicate the screening workflow at low cost by combining smartphone fundus imaging, image preprocessing, transfer-learning classification, and a simple app interface.

## DR Severity Scale

Use the five-class DR grading setup common in public DR datasets:

| Class | Label | Meaning |
| --- | --- | --- |
| 0 | No DR | No visible diabetic retinopathy |
| 1 | Mild | Mild non-proliferative diabetic retinopathy |
| 2 | Moderate | Moderate non-proliferative diabetic retinopathy |
| 3 | Severe | Severe non-proliferative diabetic retinopathy |
| 4 | Proliferative | Proliferative diabetic retinopathy |

Clinically, the model should eventually support a simpler screening decision too: `referable DR` vs `non-referable DR`. A practical threshold is often class 2 or higher as referral-worthy, but that should be validated against the chosen dataset and rubric.

## Datasets

| Dataset | Use | Notes |
| --- | --- | --- |
| Kaggle EyePACS | Main training or pretraining dataset | Large real-world fundus set from the 2015 Kaggle DR challenge, five severity classes, strong class imbalance and variable image quality. |
| APTOS 2019 Blindness Detection | First prototype dataset | Smaller and easier to start with. About 3,662 labeled retinal images with five severity classes. |
| Messidor / Messidor-2 | External validation | Useful to test generalization across cameras and sites after training on Kaggle/APTOS. |

Recommended order:

1. Start with APTOS 2019 because it is small enough for fast iteration.
2. Add EyePACS when the pipeline is stable.
3. Reserve Messidor as an external validation set instead of mixing it into training immediately.

## Model Plan

Start with transfer learning rather than designing a new model.

| Candidate | Why |
| --- | --- |
| EfficientNet-B0 | Strong accuracy-to-size tradeoff; good first choice for mobile-friendly deployment. |
| ResNet50 | Reliable baseline; easy to explain and compare. |
| EfficientNet-B3/B4 | Later upgrade if hardware and training time allow. |

Training objective:

- Five-class classification: `0, 1, 2, 3, 4`.
- Also report referable DR: class `2+`.
- Metrics: validation accuracy, quadratic weighted kappa, per-class recall, confusion matrix.
- Target milestone: 75-85% validation accuracy for the first working prototype.

## Image Preprocessing Plan

Minimum viable pipeline:

1. Detect the circular fundus region.
2. Crop away black borders.
3. Normalize brightness and contrast.
4. Reduce noise and reject very blurry images.
5. Resize to model input size, such as `224x224` or `384x384`.
6. Normalize using ImageNet statistics for transfer learning.

Quality checks:

- Blur score using Laplacian variance.
- Brightness range check.
- Retina circle coverage check.
- Warning if image is too dark, too bright, or too blurry.

## App Requirements

The first app should be simple and honest:

- Upload or capture retina image.
- Show original and cleaned image.
- Show image quality warnings before prediction.
- Show DR severity class and confidence.
- Show Grad-CAM overlay.
- Show a clear disclaimer that this is not a diagnosis.

## Architecture

See `docs/architecture.mmd`.

High-level flow:

`Smartphone image -> preprocessing -> model API -> severity/confidence/Grad-CAM -> app result screen`

## Timeline

### Week 1

- Finish literature review.
- Compare EyePACS, APTOS, and Messidor.
- Choose model baseline and metrics.
- Build static app prototype.
- Draft architecture diagram.

### Week 2

- Set up Python training environment.
- Download APTOS dataset.
- Write preprocessing notebook/script.
- Create train/validation split.
- Train a tiny smoke-test model on a subset.

### Week 3

- Train EfficientNet-B0 and ResNet50 baselines.
- Add augmentation: rotation, crop, brightness, contrast, horizontal flip.
- Track metrics and confusion matrix.

### Week 4

- Improve class imbalance handling with weighted loss or balanced sampling.
- Add Grad-CAM generation.
- Save best model checkpoint.

### Week 5

- Package inference into a FastAPI endpoint.
- Return severity, confidence, quality warnings, and Grad-CAM image.
- Connect frontend prototype to API.

### Week 6

- Build robust preprocessing for smartphone-style images.
- Add auto-crop, contrast normalization, blur detection, and resize.
- Test with intentionally imperfect photos.

### Week 7

- Finalize app flow from upload/capture to cleaned image to prediction.
- Write demo script and limitations.
- Decide whether to begin hardware design next.

## Key Risks

| Risk | Mitigation |
| --- | --- |
| Poor smartphone image quality | Add quality checks and user recapture guidance. |
| Dataset bias | Validate on at least one dataset not used in training. |
| Class imbalance | Use balanced sampling, weighted loss, and per-class recall. |
| Overclaiming medical capability | State clearly that this is screening support, not diagnosis. |
| Hardware complexity | Build AI/app first, then hardware attachment. |

## Sources

- Kaggle APTOS 2019 Blindness Detection: https://www.kaggle.com/competitions/aptos2019-blindness-detection
- Kaggle Diabetic Retinopathy Detection / EyePACS: https://www.kaggle.com/c/diabetic-retinopathy-detection
- Messidor dataset: https://www.adcis.net/en/third-party/messidor/
- International Clinical Diabetic Retinopathy severity categories are commonly represented as no DR, mild, moderate, severe, and proliferative DR in these datasets.
