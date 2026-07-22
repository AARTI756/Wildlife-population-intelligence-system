# WPIS Layout Refinements & YOLOv11 Model Integration Walkthrough

We have successfully integrated the trained **YOLO11 Wildlife Species Detection model**, completed the **Wildlife Audio Analysis Dashboard** UI refactoring, added extensive **AI Image Analysis enhancements**, and fixed the **Quick Login** connection issue.

---

## Part 1 — YOLOv11 Model Integration Achievements

### 1. Singleton Model Loading on Application Startup
*   Implemented `YOLOService` class (`backend/app/services/yolo_service.py`) using a thread-safe singleton design.
*   Loads the weights file `backend/models/best.pt` once when FastAPI starts via the lifespan handler (`backend/app/main.py`), preventing expensive model reloading on each client request.

### 2. Live Wildlife Image Analysis Endpoint
*   Updated `/api/uploads/image` inside `backend/app/routers/uploads.py` to validate images, execute YOLOv11 inference, draw bounding boxes, map species database profiles, save camera trap observations, and return the structured JSON results.
*   Added `detections` to the `UploadedImageOut` schema (`backend/app/schemas/upload.py`) to serialize predictions.

### 3. Emerald Bounding Boxes directly on Upload Files
*   Added drawing annotations function using OpenCV to outline detected objects on the uploaded image file before saving it to disk. Bounding boxes are drawn in emerald-green with species name and confidence labels.
*   Enables the frontend to display boxed images out-of-the-box in all pages (Observation History, Reports, and Map) using the standard upload image URL.

### 4. Database Seeding & Species Taxonomic Mapping
*   Created `species_profiles` table (`backend/app/models/species.py` / `backend/app/schemas/species.py`) storing full taxonomic classifications (kingdom, phylum, class, order, family, genus, species), habitat, diet, distribution, IUCN status, and description.
*   Seeded 13 initial species profiles matching key YOLO classes (Tiger, Leopard, Elephant, Lion, Gaur, Sambar, Chital, Nilgai, Peacock, Rhinoceros, Sloth Bear, Wild Boar, Dhole) on database setup.
*   Mapped raw detections to db profiles dynamically, using a robust fallback query system for missing entries.

### 5. Automated Observation Log Persistence
*   Automatically logs observation entries in the `observations` table on every successful upload detection, grouping by species, matching active camera traps at the monitoring site, calculating detection counts, and saving AI metadata.

### 6. Interactive Sidebar Results Panel
*   Upgraded `WildlifeImageUpload.jsx` to dynamically render YOLOv11 detection lists and detailed species information cards containing taxonomic groupings, habitat, diet, and colored IUCN status badges (yellow for Vulnerable, red for Endangered, green for Least Concern).
*   Configured pipeline checklist indicators to display active green checkmarks when model inference completes.

---

## Part 2 — Wildlife Audio Analysis Refactoring Achievements

### 1. Unified Dashboard Grid & Spacing
*   Reduced vertical margins to optimize vertical space usage on standard monitors.
*   Added max content-width limits to present cards beautifully on ultra-wide desktop monitors.

### 2. Redesigned Bioacoustic Summary Card
*   Consolidated summary telemetry counters (Detected Species count, Total Detections, Average Confidence, Recording Duration, Noise Quality Rating) and the ecological description paragraph into a single card.

### 3. Compact Detected Species Cards
*   Redesigned detected species lists to display horizontal compact grids featuring bird thumbnails, names, confidence scores, and call counts.

### 4. Horizontal Timeline Cards
*   Replaced the bullet-list timeline with a vertical stack of horizontal card components featuring timestamps, bird thumbnails, names, and confidences.

### 5. Collapsible Environmental Noise Assessments
*   Grouped all acoustic assessment metrics into a collapsed-by-default card, shrinking the page scroll height.

### 6. Fully Asynchronous Caching Bird Images
*   Created a unified `getSpeciesImage` service that asynchronously retrieves images via priority fallbacks (Local -> Wikimedia -> eBird query -> silhouette) and caches the results in `localStorage` to avoid duplicate API requests.

---

## Part 3 — AI Image Analysis & Telemetry Enhancements (Milestone 2 Refinements)

### 1. Removed Pipeline Development Panel
*   Completely removed the pipeline diagram, static model weights text, and configuration workflow steps from the UI.

### 2. Aligned UI with Acoustic Monitoring Suite
*   Refactored the page to use a single-column `max-w-5xl` centered layout, matching the Acoustic Monitoring Suite's card spacing, typography, colors, and shadows.

### 3. Original vs. Detected Dual Image View with Lightbox Zoom
*   Displayed the original uploaded image beside the YOLO annotated bounding-box image in a responsive layout.
*   Added a high-resolution, full-screen lightbox modal for zooming in on camera trap captures.

### 4. Multiple Expandable Detection Cards
*   Organized multiple detections into separate collapsible/expandable cards (open by default) to cleanly display taxonomy details, habitat, diet, description, and status badges.
*   Enforced color-coded confidence indicators: Green (90%+), Blue (75-89%), Orange (60-74%), and Red (<60%).

### 5. Case-Insensitive Fuzzy Species Mapping
*   Implemented a normalization helper mapping hyphens, underscores, spaces, and case differences (e.g. `'Brown-bear'` maps to `'Sloth Bear'`).

### 6. Possible Species Felidae Ambiguity Refinement
*   Added a prediction refinement layer where Felidae detections under 75% confidence are flagged as `Possible Species` instead of `Confirmed Species`, presenting a list of close candidates (e.g. `Cat`, `Lynx`, `Fox`).

### 7. Telemetry Metadata Persistence
*   Structured and stored complete metadata (species, scientific name, bounding box coordinates, filename, timestamp, etc.) in the database `Observation` notes column.

---

## Part 4 — Quick Login & CORS Resolution

### 1. Switched API Client Base Target to Loopback IP
*   Changed the default API baseURL in `api.js` from `localhost` to `127.0.0.1` to avoid Windows IPv6 resolution issues (where browsers resolve `localhost` to `[::1]` first, failing to connect to IPv4 uvicorn).

### 2. Resolved CORS Credentials Policy
*   FastAPI forbids `allow_origins=["*"]` when `allow_credentials=True`. Configured explicit localhost and loopback origins in the `main.py` CORS middleware.

### 3. Real Error Detail Extraction and Telemetry Logging
*   Enabled Axios error message extraction (`extractErrorMessage`) in the Quick Login alert boundary to display actual backend warnings (e.g. "User account is inactive" or "Incorrect credentials") instead of a generic failure warning.
*   Added console logging for request payloads, API endpoints, response statuses, and errors.
