# Settings Feature Testing Guide

## Backend API Endpoints

All endpoints require authentication (Bearer token in Authorization header).

### 1. Get All Settings
```
GET /api/settings
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "userId",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main St",
  "phone": "+1234567890",
  "emailNotifications": true,
  "smsNotifications": false,
  "inAppNotifications": true
}
```

### 2. Get Profile
```
GET /api/settings/profile
Authorization: Bearer <token>
```

### 3. Update Profile
```
PATCH /api/settings/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main St",
  "phone": "+1234567890"
}
```

**Notes:**
- Email cannot be changed (read-only)
- Address and phone are optional
- Phone must be 7-20 characters with valid format if provided
- Names are required and max 50 characters

### 4. Get Notification Preferences
```
GET /api/settings/notifications
Authorization: Bearer <token>
```

### 5. Update Notification Preferences
```
PATCH /api/settings/notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "emailNotifications": true,
  "smsNotifications": false,
  "inAppNotifications": true
}
```

### 6. Change Password
```
POST /api/settings/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@456",
  "confirmPassword": "NewPassword@456"
}
```

**Password Requirements:**
- Minimum 8 characters
- Maximum 100 characters
- Must contain:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*(),.?":{}|<>)
- New password must be different from current password
- New password and confirm password must match

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

## Testing Steps

### 1. Test Profile Update
1. Navigate to `/settings` in the app
2. Update your name, address, or phone
3. Click "Save Profile"
4. You should see "Profile updated successfully!"

### 2. Test Notification Preferences
1. Toggle the notification checkboxes
2. Click "Save Preferences"
3. You should see "Notification preferences updated successfully!"
4. Refresh the page to verify changes persisted

### 3. Test Password Change
1. Enter your current password
2. Enter a new strong password (must meet requirements above)
3. Confirm the new password
4. Click "Update Password"
5. You should see "Password changed successfully!"
6. Try logging out and back in with the new password

## Common Issues & Solutions

### Issue: "Current password is incorrect"
**Solution:** Make sure you're entering the correct current password

### Issue: "Password must contain at least..."
**Solution:** Ensure new password meets all strength requirements:
- At least 8 characters
- Has uppercase, lowercase, number, and special character

### Issue: "New password and confirm password do not match"
**Solution:** Make sure both password fields are identical

### Issue: "Invalid phone number format"
**Solution:** Phone should be 7-20 characters, can include: 0-9, +, -, (), space

### Issue: "Failed to update profile"
**Solution:** Check browser console for specific error message

## User Model Fields

The following fields were added to the User model:
- `address` (String, optional)
- `phone` (String, optional)
- `emailNotifications` (Boolean, default: true)
- `smsNotifications` (Boolean, default: false)
- `inAppNotifications` (Boolean, default: true)

## Architecture

Following SOLID principles:
- **Validator**: `settingsValidator.js` - Centralized validation logic
- **Service**: `settings.service.js` - Business logic
- **Controller**: `settings.controller.js` - HTTP handlers
- **Routes**: `settings.routes.js` - Route definitions
- **Repository**: `user.repository.js` - Data access (updated with findById and update methods)

All components follow Single Responsibility Principle and use proper error handling.
