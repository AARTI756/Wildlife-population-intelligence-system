# Wildlife Population Intelligence System - Architecture & ERD (Milestone 1)

This document contains visual diagrams for the platform's architecture and database relationships.

## 1. System Architecture Diagram

```mermaid
graph TD
    subgraph Client Layer [Frontend Client - React.js]
        A[React Pages & Components] --> B[Auth Context & hooks]
        B --> C[Axios Client]
    end

    subgraph Service Layer [Backend Server - FastAPI]
        C -->|HTTP REST + JWT| D[API Router / Gateway]
        
        D --> E[Auth & RBAC Middleware]
        D --> F[Resource Routers]
        
        F --> G[Pydantic Validation Schemas]
        F --> H[SQLAlchemy Models]
    end

    subgraph Data Layer [Database - PostgreSQL]
        H -->|ORM Queries| I[(wildlife_db)]
    end
```

## 2. Database ER Diagram

The database schema is fully normalized and enforces foreign keys for user ownership and device installations.

```mermaid
erDiagram
    users {
        int id PK
        string username
        string email
        string hashed_password
        datetime created_at
        datetime updated_at
    }

    roles {
        int id PK
        string name
        string description
    }

    user_roles {
        int user_id FK
        int role_id FK
    }

    surveys {
        int id PK
        string name
        date date
        string monitoring_location
        float latitude
        float longitude
        string habitat_type
        string monitoring_device
        boolean protected_area
        int created_by FK
        datetime created_at
        datetime updated_at
    }

    monitoring_sites {
        int id PK
        string name
        string location
        float latitude
        float longitude
        string description
        boolean protected_area
        datetime created_at
        datetime updated_at
    }

    camera_traps {
        int id PK
        string name
        string status
        int battery_level
        int location_id FK
        float latitude
        float longitude
        string model
        date installation_date
    }

    audio_sensors {
        int id PK
        string name
        string status
        int battery_level
        int location_id FK
        float latitude
        float longitude
        string model
        date installation_date
    }

    observations {
        int id PK
        int survey_id FK
        string species_name
        int count
        datetime timestamp
        string observation_type
        string device_id
        text notes
        int created_by FK
        datetime created_at
    }

    users ||--o{ user_roles : "has"
    roles ||--o{ user_roles : "assigned_to"
    users ||--o{ surveys : "creates"
    users ||--o{ observations : "logs"
    surveys ||--o{ observations : "contains"
    monitoring_sites ||--o{ camera_traps : "houses"
    monitoring_sites ||--o{ audio_sensors : "houses"
```
