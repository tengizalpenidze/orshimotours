# Replit Configuration for Orshimo Tours Application

## Overview

This is a full-stack tour booking application built with React, Express, and PostgreSQL. The application allows customers to browse available tours in Georgia and make booking requests, while providing an admin panel for tour and booking management. The system supports multi-language functionality (English, Russian, Georgian) and multi-currency display (GEL/USD).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with a custom design system and CSS variables for theming
- **State Management**: TanStack Query for server state and local React state for UI
- **Routing**: Wouter for client-side routing
- **Internationalization**: Custom i18n implementation supporting English, Russian, and Georgian
- **File Uploads**: Uppy integration for file management with dashboard modal interface

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Email Service**: SendGrid integration for booking notifications
- **File Storage**: Google Cloud Storage with custom ACL policy system

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database serverless
- **Database Schema**: Comprehensive schema including users, tours, tour availability, bookings, and sessions
- **Object Storage**: Google Cloud Storage for file uploads with ACL-based access control
- **Session Storage**: PostgreSQL-backed session store for authentication persistence

### Authentication and Authorization
- **Authentication Provider**: Replit Auth using OpenID Connect flow
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session storage
- **Authorization**: Role-based access with admin panel protection
- **File Access Control**: Custom ACL system for object storage with group-based permissions

### External Dependencies
- **Database**: Neon Database (PostgreSQL serverless)
- **Email Service**: SendGrid for transactional emails
- **Object Storage**: Google Cloud Storage with Replit sidecar integration
- **Authentication**: Replit Auth OIDC provider
- **Currency Exchange**: External API for GEL to USD exchange rates
- **UI Components**: Radix UI primitives for accessible component foundation
- **File Upload**: Uppy with AWS S3 compatibility for direct uploads

### API Design
- RESTful API structure with clear separation between public and authenticated endpoints
- Tour management endpoints for CRUD operations
- Booking system with email notification workflow
- Object storage endpoints with ACL-based access control
- Exchange rate API for currency conversion
- Admin-only endpoints protected by authentication middleware

### Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Type Safety**: TypeScript across the entire stack with strict configuration
- **Database Migrations**: Drizzle Kit for schema management
- **Development Server**: Custom Express setup with Vite middleware integration
- **Linting**: ESLint integration through Replit plugins

## Recent Changes

### Deployment Support (Latest)
- **Dual-Mode Deployment**: Application now supports both Replit and external platforms (Render, etc.)
- **Object Storage**: Updated to support both Replit sidecar and direct GCS credentials for file uploads
- **Authentication Limitation**: Admin features (tour management, bookings view, calendar) only available on Replit due to Replit Auth dependency
- **Public Features**: Tour browsing, booking system, and email notifications work on all platforms
- **Render Configuration**: Complete render.yaml and deployment documentation for Render platform

### Authentication Architecture Note
The admin panel uses Replit Auth (OpenID Connect) which is only available on Replit infrastructure. External deployments (Render, etc.) have admin features disabled but all customer-facing features remain fully functional. For production use, manage tours via Replit deployment while serving customers via external deployment on same database.