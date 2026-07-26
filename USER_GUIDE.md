# User Manual & Operating Guide

This user guide describes how to operate the Wildlife Population Intelligence System (WPIS) based on different user roles.

---

## 🔑 Login & Accessing Workspaces

1. Open `http://localhost:5173`.
2. Login using predefined credentials or sign up for a new account.
3. Depending on your role, the interface adapts to display designated features:

### 1. Wildlife Researcher Dashboard
- **Activities**: Log species observations, manage active camera trap registries, and upload files.
- **Workflow**:
  - Go to **Wildlife Image Analysis** or **Bioacoustic Recognition**.
  - Drag and drop an audio/image file, select an active survey, and click **Process Telemetry**.
  - The AI classifies the species and adds the verification metadata to the **Observation History** records.

### 2. Conservation Officer Dashboard
- **Activities**: Track reserve metrics, review biodiversity indexes ($H'$ and $D$), and generate reports.
- **Workflow**:
  - Go to **Reports Center**, specify filters (Site, Species, and Date range), select the export format (PDF, Excel, or CSV), and click **Request Export**.
  - Download the resulting report file from the **Report History** table.

### 3. Forest Department Command
- **Activities**: Perform Protected Area Monitoring, review Wildlife Movement maps, schedule anti-poaching patrol beats, and track incidents.
- **Workflow**:
  - View the **Active Patrol Planner** on the dashboard home screen. High-priority beats are highlighted for zones with active critical alerts.
  - Review the **Security & Alert Incidents Log** to deploy resources where human disturbance logs or animal alerts are registered.

### 4. System Administrator Dashboard
- **Activities**: Manage users, configure system roles, register camera/audio sensor nodes, and review audit telemetry.
