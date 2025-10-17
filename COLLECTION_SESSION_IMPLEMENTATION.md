# Collection Session Implementation

## Overview

This document describes the comprehensive bin collection workflow system with session management, assignment validation, and automatic status updates.

## Features Implemented

### 1. **Assignment Validation**

- Collectors can only access bins assigned to them
- Clear error messages when scanning unassigned bins
- Visual warnings to guide collectors to scan correct bins

### 2. **15-Minute Collection Session**

- Automatic session start when collector confirms collection
- Real-time countdown timer (MM:SS format)
- Session monitoring every 10 seconds
- Automatic session expiration after 15 minutes

### 3. **Automatic Bin Status Updates**

- Monitors bin fill level during the session
- Automatically marks bin as "collected" when level reduces
- No manual marking required - fully automated
- Session ends immediately upon successful collection

### 4. **Visual Feedback System**

- ✓ Success animation when bin is assigned to collector
- ⏱ Active session display with countdown timer
- ✓ Collection completed notification
- ⚠️ Session expired warning
- 🚫 Assignment error alerts

## Architecture

### Backend Components

#### 1. **Bin Model Updates** (`backend/src/models/bin/bin.model.js`)

Added new fields:

- `sessionStartedAt`: Timestamp when collection session starts
- `sessionInitialFillLevel`: Bin fill level at session start
- `status`: Added new "in-collection" state

#### 2. **Bin Repository** (`backend/src/repositories/bin.repository.js`)

New methods:

- `startSession(id, sessionData)`: Initializes a collection session
- `endSession(id)`: Clears session data after completion/expiration

#### 3. **Bin Controller** (`backend/src/controllers/bin/bin.controller.js`)

New endpoints:

**POST `/api/bins/:id/start-session`**

- Starts a 15-minute collection session
- Records initial fill level
- Validates collector assignment
- Returns: Session data with 15-minute duration

**GET `/api/bins/:id/check-session`**

- Checks current session status
- Compares current vs initial fill levels
- Auto-marks as collected if level reduced
- Returns: Session status, elapsed time, remaining time

**GET `/api/bins/code/:code` (Enhanced)**

- Validates bin is assigned to requesting collector
- Returns 403 error if not assigned
- Provides detailed assignment information

#### 4. **Routes** (`backend/src/routes/bin/bin.routes.js`)

Added routes for session management endpoints

### Frontend Components

#### 1. **Custom Hook** (`frontend/src/hooks/useCollectionSession.js`)

**Purpose**: Encapsulates all session management logic

**Features**:

- Automatic monitoring every 10 seconds
- Real-time countdown timer (updates every second)
- Session state management (idle, active, completed, expired)
- Automatic cleanup on unmount
- Ref-based design to prevent stale closures

**Exports**:

```javascript
{
  sessionData,        // Server session data
  remainingTime,      // { minutes, seconds, formatted }
  isActive,          // Boolean: session is active
  isCompleted,       // Boolean: collection successful
  isExpired,         // Boolean: session timed out
  resetSession,      // Function: reset to idle
  checkSession,      // Function: manual check
}
```

**Design Patterns**:

- **Single Responsibility**: Only manages session state
- **Separation of Concerns**: UI logic separate from business logic
- **Custom Hook Pattern**: Reusable across components

#### 2. **API Services** (`frontend/src/services/bins.js`)

New methods:

- `startCollectionSession(id)`: Initiates collection session
- `checkCollectionSession(id)`: Polls session status

#### 3. **CollectorScanBin Component** (`frontend/src/pages/CollectorScanBin.jsx`)

**Complete rewrite with state machine pattern**

**States**:

```javascript
IDLE; // Ready to scan
SCANNING; // Simulated QR scan in progress
BIN_FOUND; // Valid bin found and assigned
SESSION_ACTIVE; // 15-minute collection in progress
ASSIGNMENT_ERROR; // Bin not assigned to collector
```

**Workflow**:

1. Collector scans/enters bin ID
2. System validates bin exists
3. System checks if bin is assigned to collector
4. If assigned: Show bin details + "Start Collection" button
5. If not assigned: Show error + prompt to scan correct bin
6. Collector starts collection session (15 minutes)
7. System monitors bin level every 10 seconds
8. When level reduces: Auto-mark as collected + show success
9. If 15 minutes pass without collection: Show expired message + prompt to rescan

**Key Functions**:

- `performBinLookup()`: Core lookup with assignment validation
- `handleAssignmentError()`: Handles unassigned bins
- `handleStartCollection()`: Initiates session
- `renderSessionFeedback()`: Visual feedback for completed/expired states
- `renderActiveSession()`: Live session monitoring UI

**SOLID Principles Applied**:

- **Single Responsibility**: Each function has one clear purpose
- **Open/Closed**: Easy to extend with new scan states
- **Separation of Concerns**: Business logic in hooks, UI in component
- **Dependency Inversion**: Uses abstractions (hooks, services)

## User Experience Flow

### Happy Path (Assigned Bin)

1. Collector scans BIN-123
2. ✓ "Bin Assigned to You!" with green checkmark animation
3. Displays bin details (fill level, location, etc.)
4. "Start Collection (15 min)" button
5. Collector clicks button
6. Blue session panel appears with countdown timer
7. Shows initial vs current fill levels
8. Collector empties bin
9. System detects level reduction
10. ✓ "Collection Completed!" with success animation
11. "Scan Next Bin" button appears

### Error Path (Unassigned Bin)

1. Collector scans BIN-456 (not assigned to them)
2. 🚫 Red error panel appears
3. "This bin is not assigned to you"
4. Shows bin code and who it's assigned to
5. "⚠️ Please scan a bin that is assigned to you"
6. "Try Again" button to reset

### Session Expired Path

1. Collector starts session but doesn't collect within 15 minutes
2. ⏱ Orange warning panel appears
3. "Session Expired"
4. "Bin level was not reduced within 15 minutes"
5. "Please scan the bin again to restart the collection session"
6. "Scan Again" button

## Technical Highlights

### Clean Code Practices

- **Descriptive naming**: Functions clearly describe their purpose
- **JSDoc comments**: All functions documented
- **Error handling**: Comprehensive try-catch blocks
- **Type safety**: Proper null checks and validations

### Performance Optimizations

- **useCallback**: Prevents unnecessary re-renders
- **useRef**: Avoids stale closures in intervals
- **Debounced polling**: 10-second intervals (not aggressive)
- **Automatic cleanup**: Intervals cleared on unmount

### Accessibility

- Clear visual indicators for each state
- Color-coded feedback (green=success, red=error, orange=warning, blue=info)
- Large, readable fonts and icons
- High contrast UI elements

### Scalability

- Easy to add new scan states
- Simple to modify session duration
- Polling interval configurable
- Session logic encapsulated in reusable hook

## Configuration

### Backend

Session duration is hardcoded to 15 minutes in:

- `bin.controller.js`: `checkCollectionSession` function
- Can be made configurable via environment variables

### Frontend

Monitoring intervals in `useCollectionSession.js`:

- Session check: 10,000ms (10 seconds)
- Timer update: 1,000ms (1 second)

## Testing Scenarios

### Test Case 1: Assigned Bin Collection

1. Login as collector4
2. Scan a bin assigned to collector4
3. Verify bin details shown
4. Start collection session
5. Verify timer counts down
6. Reduce bin fill level (via admin panel)
7. Verify automatic "collected" status

### Test Case 2: Unassigned Bin Error

1. Login as collector4
2. Scan a bin assigned to collector3
3. Verify error message appears
4. Verify bin code and assignee shown
5. Verify "Try Again" resets state

### Test Case 3: Session Expiration

1. Login as collector4
2. Scan assigned bin and start session
3. Wait 15 minutes without reducing level
4. Verify "Session Expired" message
5. Verify "Scan Again" option

## Future Enhancements

1. **QR Code Scanner Integration**: Replace simulated scanner with real camera
2. **Offline Support**: Cache sessions for offline collection
3. **GPS Validation**: Verify collector is at bin location
4. **Photo Evidence**: Capture before/after photos
5. **Push Notifications**: Alert when session about to expire
6. **Session History**: Log all collection attempts
7. **Performance Metrics**: Track average collection time
8. **Batch Collection**: Collect multiple bins in one session

## Database Schema Changes

```javascript
// Bin Model
{
  // ... existing fields
  sessionStartedAt: Date,           // null when no active session
  sessionInitialFillLevel: Number,  // null when no active session
  status: String,                    // Added "in-collection" enum value
}
```

## API Endpoints Summary

| Method | Endpoint                      | Auth      | Description                            |
| ------ | ----------------------------- | --------- | -------------------------------------- |
| GET    | `/api/bins/code/:code`        | collector | Get bin by code (validates assignment) |
| POST   | `/api/bins/:id/start-session` | collector | Start 15-min collection session        |
| GET    | `/api/bins/:id/check-session` | collector | Check session status & auto-collect    |

## Conclusion

This implementation provides a robust, user-friendly, and automated bin collection system that ensures collectors only access their assigned bins, provides real-time feedback, and automatically tracks collection success. The code follows SOLID principles, is well-documented, and is easy to maintain and extend.
