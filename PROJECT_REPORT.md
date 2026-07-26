# Project Report - Wildlife Population Intelligence System (WPIS)

Detailed overview of implementation milestones, outcomes, and domain-specific evaluations.

---

## 📋 Executive Summary

The Wildlife Population Intelligence System (WPIS) is a production-hardened platform built to assist national park researchers and forest department beat teams. By automating species classification and ecological metric calculations, WPIS removes manual analysis bottlenecks while maintaining strict domain accuracy.

---

## 🎯 Implementation Milestones

### Milestone 1: Design & Core Setup
- Established standard FastAPI schemas and PostgreSQL database integrations.
- Built JWT-based user authentication and Google OAuth login pathways.

### Milestone 2: AI Detections & Analytics
- Programmed YOLOv8 and BirdNET Librosa model services.
- Constructed Shannon diversity and Simpson dominance equations to process field observations.

### Milestone 3: Habitat Suitability & Health Scoring
- Integrated vegetation canopy index (NDVI) area tracking.
- Implemented the composite weighted Health Score models.

### Milestone 4: Reporting, Notifications & Maps
- Configured asynchronous PDF, multi-sheet Excel, and CSV export background tasks.
- Redesigned 7 Leaflet maps with custom metric scale controls, bounds fit, and styled markers.
- Added Patrol Planning and Incident Logs for Forest Department field officers.

---

## 🔬 Wildlife Science Validation

- Standardized Indian fauna localized translation dictionaries.
- Dynamic conservation recommendations formulate Anti-Poaching and Water Excavation orders directly from active database anomalies.
- Diversity indicators update mathematically from active sightings data.
