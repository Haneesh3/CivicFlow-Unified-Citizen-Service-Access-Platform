# CivicFlow QA Audit & Test Report

**Role**: Lead QA & Security Tester  
**Date**: May 25, 2026  
**Scope**: CivicFlow Unified Citizen Service Access Platform (Mobile App & NestJS API)

This document contains a comprehensive QA audit identifying potential bugs, logical gaps, accessibility issues, and security edge cases in the current application. Resolving these items will elevate CivicFlow to a highly competitive, bulletproof production standard.

---

## 🐞 Critical & Major Bugs

### 1. [RESOLVED] Hard Block on Denied Location Permissions ✅
* **Component**: Mobile Client - [report.tsx](file:///c:/Users/KANDATH%20HANEESH/Desktop/CF/apps/mobile/app/report.tsx#L32-L46)
* **Severity**: **RESOLVED (May 25, 2026)**
* **Resolution**: Added a manual address text field, a warning-themed fallback indicator in case GPS is denied, and coordinates defaulting to standard city region parameters (`28.6139, 77.2090` - Delhi) to ensure the backend PostGIS ticket router routes it smoothly.
* **Bug Description**: If a citizen denies location permissions (or is on a device without GPS services active), `Location.requestForegroundPermissionsAsync()` correctly throws an alert. However, `handleSubmit` originally required the `location` state to be non-null, preventing all complaint submissions.
  ```typescript
  if (!title || !description || !location || !user) {
    Alert.alert('Error', 'Please fill all required fields');
    return;
  }
  ```
  This means citizens *cannot* submit complaints at all if they choose not to share their GPS location.
* **Expected Behavior / Fix**:
  * If GPS permissions are denied, allow the user to search/type an address manually.
  * Populate a default fallback coordinate (e.g. current city center) so the ticket can still be routed and submitted.

### 2. Missing JWT Expiration Interceptor (Silent App Freeze)
* **Component**: Mobile Client - [api.ts](file:///c:/Users/KANDATH%20HANEESH/Desktop/CF/apps/mobile/lib/api.ts)
* **Severity**: **MEDIUM**
* **Bug Description**: The backend JWT tokens are set to expire in 7 days (`expiresIn: '7d'`). In the mobile app, the JWT token is persisted in `SecureStore`. If the token expires, the app will continue to load, but all subsequent API requests will fail with `401 Unauthorized`. The app will silently freeze (not loading data), but the user will remain "logged in".
* **Expected Behavior / Fix**:
  * Add a global **response interceptor** in the axios client to catch `401` errors and automatically clear the token and redirect the user back to the login screen:
    ```typescript
    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }
    );
    ```

### 3. Missing Password Confirmation on Registration
* **Component**: Mobile Client - [register.tsx](file:///c:/Users/KANDATH%20HANEESH/Desktop/CF/apps/mobile/app/%28auth%29/register.tsx)
* **Severity**: **MEDIUM**
* **Bug Description**: The sign-up form does not include a "Confirm Password" input field. If a user makes a typo while creating their account, they will register successfully but will be completely locked out when they log out and try to sign back in.
* **Expected Behavior / Fix**:
  * Add a `confirmPassword` field to the registration form and validate that `password === confirmPassword` on the client side before calling the `/auth/register` API.

---

## 🔒 Security & Data Integrity Gaps

### 1. Plain-text OTP in Server Logs
* **Component**: NestJS API - [mail.service.ts](file:///c:/Users/KANDATH%20HANEESH/Desktop/CF/apps/api/src/auth/mail.service.ts)
* **Severity**: **LOW (Development) / HIGH (Production)**
* **Gap Description**: In development, printing the OTP verification code to the console is incredibly convenient. However, in production, printing active security verification codes to logs is a security vulnerability (log exposure).
* **Expected Behavior / Fix**:
  * Wrap the console logger inside an environment check so that OTPs are *never* printed to server logs in a production environment:
    ```typescript
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔑 MOBILE OTP CODE: ${otp}`);
    }
    ```

### 2. Case-Sensitive Email Registration Mismatch
* **Component**: NestJS API - [auth.service.ts](file:///c:/Users/KANDATH%20HANEESH/Desktop/CF/apps/api/src/auth/auth.service.ts#L23-L57)
* **Severity**: **MEDIUM**
* **Gap Description**: During registration, the database does not force the email to lowercase. If a user registers with `User@Example.com`, they must log in using the exact same capitalization. If they try `user@example.com`, the lookup fails, throwing a confusing "Invalid credentials" error.
* **Expected Behavior / Fix**:
  * Apply `.toLowerCase()` to `email` inside `register` and `login` methods of the `AuthService` to ensure all email queries remain completely case-insensitive.

---

## ♿ Accessibility & Usability (PRD Compliance)

### 1. Lack of Local Bounded Map MapView (Global Map Panning)
* **Component**: Mobile Client - [report.tsx](file:///c:/Users/KANDATH%20HANEESH/Desktop/CF/apps/mobile/app/report.tsx#L160-L178)
* **PRD Requirement**: *Section 7.2 - Location Handling: "Manual pin adjustment with city-level bounding box to avoid global map confusion..."*
* **Usability Gap**: Currently, the MapView is fixed/static with `scrollEnabled={false}` and `zoomEnabled={false}`. This makes it impossible for citizens to manually adjust the pin if the automatic GPS is slightly off (which is highly common in dense urban wards).
* **Expected Behavior / Fix**:
  * Enable scroll/zoom but set a local bounding box constraint (e.g. using `mapRegion` bounds) so that the user cannot drag the map to another continent, preventing confusion.

### 2. No Offline Draft Queue
* **Component**: Mobile Client - [report.tsx](file:///c:/Users/KANDATH%20HANEESH/Desktop/CF/apps/mobile/app/report.tsx)
* **PRD Requirement**: *Section 8 - Non-Functional: "Offline-friendly behaviors: caching of categories, draft ticket storage until connectivity is restored."*
* **Usability Gap**: If a user submits a complaint in a low-connectivity area (like an underground parking garage or remote alley), the API request immediately fails and the entire draft form data is cleared/lost.
* **Expected Behavior / Fix**:
  * Implement an offline draft database (using `AsyncStorage` or similar local caching) to queue submissions and retry them automatically when internet connectivity returns.
