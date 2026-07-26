# Changelog - Wildlife Population Intelligence System (WPIS)

All notable changes to the WPIS codebase are documented below.

---

## [v1.0.0] - 2026-07-26

### Added
- **Forest Department Command Panel**: Added **Active Patrol Planner** (anti-poaching beat prioritizer) and **Security & Alert Incidents Log** (human disturbance logs) to the main dashboard workspace.
- **Reports Export Center**: Added background task queueing for PDF, Excel, and CSV files.
- **Alerts Engine**: Added automatic background rule runner for device offline and endangered species detections.

### Fixed
- **Geospatial Maps**: Configured Leaflet maps with metric-only scale controls, top-right zoom controls, and custom bounds auto-fitting on load.
- **Indian Species Localizer**: Resolved generic "Lion" vs "Asiatic Lion" standards and translated all non-indigenous species terms to native Indian fauna.
- **Duplicate Database Surveys**: Updated duplicate database records directly to represent three unique tiger reserve monitoring beats.
