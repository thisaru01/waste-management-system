# Controller Architecture Diagram

## New Architecture (After Refactoring)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│                     frontend/src/services/bins.js                    │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         │
┌────────────────────────▼────────────────────────────────────────────┐
│                    BACKEND API (Express)                             │
│                    backend/src/app.js                                │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ /api/bins    │  │/api/collections│ │/api/assignments│            │
│  └──────┬───────┘  └──────┬────────┘  └──────┬────────┘             │
│         │                 │                    │                      │
│  ┌──────▼───────┐  ┌─────▼────────┐  ┌───────▼────────┐            │
│  │ Bin Routes   │  │ Collection   │  │  Assignment    │            │
│  │   Handler    │  │   Routes     │  │    Routes      │            │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────┘            │
└─────────┼──────────────────┼───────────────────┼────────────────────┘
          │                  │                   │
          │                  │                   │
┌─────────▼──────────────────▼───────────────────▼────────────────────┐
│                    CONTROLLERS LAYER                                 │
│                                                                       │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │ Bin Controller   │  │ Collection      │  │ Assignment       │   │
│  │                  │  │ Controller      │  │ Controller       │   │
│  │ ✓ listBins()     │  │ ✓ getBinByCode()│  │ ✓ listAssigned   │   │
│  │ ✓ listFlagged()  │  │ ✓ markCollected │  │   ForMe()        │   │
│  │ ✓ updateSensor() │  │ ✓ startSession()│  │ ✓ assignCollector│   │
│  │                  │  │ ✓ checkSession()│  │ ✓ clearAssignment│   │
│  └────────┬─────────┘  └────────┬────────┘  └─────────┬────────┘   │
└───────────┼──────────────────────┼─────────────────────┼────────────┘
            │                      │                     │
            │    ┌─────────────────┴──────────┬──────────┘
            │    │                            │
┌───────────▼────▼────────────────────────────▼──────────────────────┐
│                    REPOSITORY LAYER                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Bin Repository                                   │  │
│  │                                                               │  │
│  │  ✓ list()           ✓ findByCode()      ✓ assignCollector() │  │
│  │  ✓ findById()       ✓ updateSensor()    ✓ clearAssignment() │  │
│  │  ✓ startSession()   ✓ endSession()                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                    DATABASE (MongoDB)                             │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Bins         │  │ Users        │  │ Roles        │           │
│  │ Collection   │  │ Collection   │  │ Collection   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────────────┘
```

## Responsibilities by Domain

### 🗑️ Bin Management Domain
**Route:** `/api/bins`
**Controller:** `bin.controller.js`
**Purpose:** Core bin entity management and monitoring

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/bins` | GET | Admin | List all bins |
| `/api/bins/flagged` | GET | Authenticated | List bins needing collection |
| `/api/bins/:id/sensor` | PATCH | Admin | Update sensor readings (simulation) |

### 🔗 Assignment Management Domain
**Route:** `/api/assignments`
**Controller:** `assignment.controller.js`
**Purpose:** Collector-to-bin assignment operations

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/assignments/my-bins` | GET | Collector | List my assigned bins |
| `/api/assignments/bins/:id/assign` | PATCH | Authority | Assign collector to bin |
| `/api/assignments/bins/:id/unassign` | PATCH | Authority | Remove collector assignment |

### 📦 Collection Workflow Domain
**Route:** `/api/collections`
**Controller:** `collection.controller.js`
**Purpose:** Collection workflow and session management

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/collections/code/:code` | GET | Collector | Scan bin QR code |
| `/api/collections/:id/collect` | PATCH | Collector | Mark bin as collected |
| `/api/collections/:id/start-session` | POST | Collector | Start collection session |
| `/api/collections/:id/check-session` | GET | Collector | Check session status |

## Role-Based Access Control

```
┌─────────────┐
│   Admin     │──────► Can manage bins, simulate sensors
└─────────────┘

┌─────────────┐
│  Authority  │──────► Can assign/unassign collectors
└─────────────┘

┌─────────────┐
│  Collector  │──────► Can view assigned bins, scan QR, collect waste
└─────────────┘

┌─────────────┐
│   Public    │──────► Can view flagged bins (with auth)
└─────────────┘
```

## Data Flow Example: Collection Workflow

```
1. Collector scans QR code
   └─► GET /api/collections/code/:code
       └─► collection.controller.getBinByCode()
           └─► binRepo.findByCode()
               └─► Validates bin assignment
                   └─► Returns bin details

2. Collector starts collection session
   └─► POST /api/collections/:id/start-session
       └─► collection.controller.startCollectionSession()
           └─► binRepo.startSession()
               └─► Records session start time & initial fill level

3. Waste is removed (sensor updates)
   └─► PATCH /api/bins/:id/sensor (admin simulation)
       └─► bin.controller.updateBinSensor()
           └─► binRepo.updateSensor()
               └─► Updates fill level

4. System checks session
   └─► GET /api/collections/:id/check-session
       └─► collection.controller.checkCollectionSession()
           └─► Compares current vs initial fill level
               └─► Marks as collected if reduced
```

## File Structure

```
backend/src/
├── controllers/
│   ├── bin/
│   │   └── bin.controller.js          [3 methods - bin management]
│   ├── collection/
│   │   └── collection.controller.js    [4 methods - collection workflow]
│   └── assignment/
│       └── assignment.controller.js    [3 methods - assignment management]
│
├── routes/
│   ├── bin/
│   │   └── bin.routes.js
│   ├── collection/
│   │   └── collection.routes.js
│   └── assignment/
│       └── assignment.routes.js
│
├── repositories/
│   └── bin.repository.js              [Shared by all controllers]
│
└── models/
    └── bin/
        └── bin.model.js
```

## Benefits of This Architecture

✅ **Single Responsibility**: Each controller has one clear purpose
✅ **Scalability**: Each domain can be scaled independently
✅ **Maintainability**: Changes in one domain don't affect others
✅ **Testability**: Smaller, focused units are easier to test
✅ **RESTful Design**: Clear resource-based API structure
✅ **Security**: Role-based access control per domain
✅ **Extensibility**: Easy to add new features to specific domains
