# University Housing System

Frontend application for managing university housing operations for students and admins.

## Tech Stack

- React + Vite
- Firebase Authentication (token source)
- REST API integration for core business operations
- CSS modules/files for UI styling

## Main Features

- Authentication:
  - Login / register
  - Role-based access (admin, student/member)
- Student features:
  - Submit housing application
  - View and update own applications
  - Cancel own application
  - Request room change
- Admin features:
  - Manage users
  - Review housing applications (approve, reject, under review)
  - Manage room change requests
  - Manage buildings and rooms
  - Assign students to rooms by student ID
  - Manage meals (CRUD)
  - Manage reports with filters and admin actions

## Reports Endpoints Used

- `GET /api/reports` (with `page`, `limit`, `type`, `status`, `severity`)
- `GET /api/reports/{id}`
- `PUT /api/reports/{id}`
- `DELETE /api/reports/{id}`
- `PATCH /api/reports/{id}/status`

## Applications Endpoints Used

- `POST /api/applications`
- `GET /api/applications/my`
- `GET /api/applications`
- `PUT /api/applications/{id}/{status}`
- `DELETE /api/applications/{id}`

## Rooms Endpoints Used

- `PATCH /api/rooms/{roomId}/assign` with body:
  - `{ "studentId": "..." }`

## Project Structure

- `src/pages` - dashboard and route pages
- `src/components` - feature components and UI sections
- `src/components/admin` - admin tabs/modules (including reports)
- `src/services` - API and domain service layer
- `src/config` - API configuration
- `src/styles` - CSS files

## Getting Started

1. Install dependencies:
   - `npm install`
2. Run development server:
   - `npm run dev`
3. Open the app in your browser using the local Vite URL.

## Build

- Production build:
  - `npm run build`
- Preview build:
  - `npm run preview`
