# AI-Powered Czech Invoice Generator: Full-Stack System Architecture

| Date       | Version | Description                | Author  |
| :--------- | :------ | :------------------------- | :------ |
| 2025-08-29 | 1.0     | Initial draft              | Winston |

## 1. Introduction

This document outlines the full-stack system architecture for the AI-Powered Czech Invoice Generator. It translates the requirements from the PRD, Project Brief, and Front-End Specification into a technical blueprint for development. The goal is to design a system that is modern, scalable, secure, and pragmatic, enabling efficient development and future growth.

## 2. System Overview

The application will be a classic three-tier architecture composed of a front-end web application, a back-end API, and a relational database.

*   **Frontend**: A Next.js 14 single-page application (SPA) responsible for all user interface rendering and interaction. It will consume data from the backend API.
*   **Backend**: A monolithic Node.js service that exposes a RESTful API. It will handle all business logic, data processing, user authentication, and interactions with the database.
*   **Database**: A PostgreSQL database that will serve as the single source of truth for all application data.

This simple, decoupled structure will allow for independent development and deployment of the frontend and backend, while the monolithic backend simplifies development and deployment for the MVP.

## 3. Tech Stack

| Layer       | Technology                                  | Rationale                                                              |
| :---------- | :------------------------------------------ | :--------------------------------------------------------------------- |
| **Frontend**  | Next.js 14 (App Router), TypeScript, Tailwind CSS | Modern, performant React framework with excellent developer experience.  |
| **UI Lib**    | ShadCN (ui.shadcn.com)                      | As required, for a modern, accessible, and consistent component set.     |
| **Backend**   | Node.js (LTS), Express.js, TypeScript       | Fast, scalable, and uses the same language as the frontend (TypeScript). |
| **Database**  | PostgreSQL (latest stable)                  | Powerful, reliable, and open-source relational database.               |
| **Deployment**| Docker, Vercel (Frontend), Render/AWS (Backend) | Containerization for consistency; platform-optimized hosting.          |
| **Testing**   | Jest/Vitest, React Testing Library, Playwright | Comprehensive testing from unit to end-to-end.                         |

## 4. Repository Structure

The project will be managed in a **Turborepo monorepo** to streamline development and dependency management. The initial structure will be:

```
/
├── apps/
│   ├── api/      # Node.js/Express.js backend
│   └── web/      # Next.js frontend
├── packages/
│   ├── ui/       # (Optional) Shared React components
│   └── config/   # Shared configurations (ESLint, etc.)
└── package.json
```

## 5. Backend Architecture

*   **Monolith with Express.js**: The backend will be a single, well-structured monolithic service built with Express.js. This provides simplicity for the MVP.
*   **RESTful API**: The API will be designed following REST principles. All endpoints will be versioned under `/api/v1/`.
*   **Validation**: We will use **Zod** for all incoming request body and parameter validation to ensure data integrity at the API boundary.
*   **Directory Structure**: The API will follow a feature-based directory structure (e.g., `/users`, `/invoices`) to keep the codebase organized.

## 6. Frontend Architecture

The frontend architecture will adhere to the detailed `front-end-spec.md`. Key decisions are reiterated here:

*   **State Management**: `Zustand` for client state and `React Query` for managing server state, caching, and data synchronization.
*   **Forms**: `React Hook Form` for form state management, coupled with `Zod` for client-side validation, sharing schemas with the backend.
*   **Styling**: `Tailwind CSS` as the utility-first CSS framework, configured to work with ShadCN.
*   **Component Workflow**: All UI components will be implemented using the prescribed project-specific command for managing ShadCN components. This provides a standardized workflow.
    *   **Command**: `npx shadcn@latest mcp`
    *   **Configuration**: The development agent should use the following configuration: `{ "mcpServers": { "shadcn": { "command": "npx", "args": ["shadcn@latest", "mcp"] } } }`
    *   **Guidance**: The official ShadCN documentation for theming and blocks should be used for style and layout guidance.

## 7. Database Design

The PostgreSQL database schema will be designed to be relational and normalized. The core tables for the MVP will include:

*   `users`: Stores user account information (id, email, password_hash).
*   `suppliers`: Stores user's company details, linked one-to-one with `users`.
*   `customers`: Stores client information, linked many-to-one to a `supplier`.
*   `projects`: Stores project information, linked many-to-one to a `supplier`.
*   `invoices`: The central table for invoice data, linked to a `customer` and optionally a `project`.
*   `invoice_items`: Line items for an invoice, linked many-to-one to an `invoice`.
*   `quotes` and `quote_items`: Structured identically to invoices for managing quotes.

Primary keys will be UUIDs to prevent enumeration attacks. Timestamps (`created_at`, `updated_at`) will be present on all tables.

## 8. Authentication and Authorization

We will implement JWT-based authentication with the following flow:

1.  User submits credentials to a `/api/v1/auth/login` endpoint.
2.  The backend validates credentials and generates a JWT.
3.  The JWT is sent back to the client in a secure, `HttpOnly` cookie.
4.  For all subsequent requests to protected API endpoints, the browser automatically sends the cookie.
5.  A global middleware on the backend validates the JWT from the cookie on every request to a protected route.

## 9. PDF Generation Service

PDFs will be generated on the server-side to ensure consistency and performance.

*   **Technology**: We will use **Puppeteer** (a headless Chrome library) to render a dedicated, hidden HTML page with the invoice data and CSS.
*   **Process**: An API endpoint (e.g., `/api/v1/invoices/{id}/pdf`) will fetch the invoice data, render the React template to an HTML string, and use Puppeteer to print this HTML to a PDF buffer, which is then sent to the client.

## 10. AI Suggestion Service

This will be a simple, stateless API endpoint as defined in the PRD.

*   **Endpoint**: `GET /api/v1/suggestions/invoice-items?customerId={id}`
*   **Logic**: The service will query the `invoice_items` table, group by item description for the given `customerId`, count occurrences, and return the top 3-5 most frequent item descriptions.

## 11. Deployment and DevOps

*   **Containerization**: The backend API will be containerized using a multi-stage `Dockerfile` to create a small, optimized production image.
*   **Frontend Deployment**: The Next.js frontend will be deployed to **Vercel** to take advantage of its performance optimizations and tight integration.
*   **Backend Deployment**: The Dockerized backend service will be deployed to a platform like **Render** or **AWS ECS/Fargate**.
*   **CI/CD**: A **GitHub Actions** workflow will be set up to run on every pull request, executing linting, type-checking, and automated tests for both the `api` and `web` applications.

## 12. Testing Strategy

*   **Unit Tests**: `Jest` or `Vitest` will be used for unit testing backend logic and frontend components.
*   **Integration Tests**: `Supertest` will be used for testing API endpoints. `React Testing Library` will be used for testing component integrations on the frontend.
*   **End-to-End (E2E) Tests**: `Playwright` will be used to simulate user journeys across the entire application (e.g., logging in, creating an invoice, downloading a PDF).

## 13. Open Questions

*   What is the definitive logic for generating unique, sequential invoice numbers per supplier? Does it need to be gapless?
*   What are the exact data schemas and validation rules for Czech-specific fields like IČO and DIČ?

## 14. Internationalization (i18n)

To support both Czech and English languages, the following architectural approach will be used:

*   **Frontend**: The Next.js application will use a library such as `next-intl` to manage translations. All UI strings will be stored in JSON files (e.g., `en.json`, `cs.json`) and accessed via translation keys. A UI control will allow users to switch languages, and this preference will be persisted.
*   **Backend**: The PDF generation endpoint (`GET /api/v1/invoices/{id}/pdf`) will be modified to accept a language query parameter (e.g., `?lang=cs`). The PDF rendering service will use this parameter to load the appropriate set of translated labels before generating the document.