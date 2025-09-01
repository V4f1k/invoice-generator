# AI-Powered Czech Invoice Generator: Front-End Specification

| Date       | Version | Description                | Author |
| :--------- | :------ | :------------------------- | :----- |
| 2025-08-29 | 1.0     | Initial draft              | Sally  |

## 1. Introduction

This document provides a detailed specification for the front-end architecture and user interface of the AI-Powered Czech Invoice Generator. It is based on the project's Product Requirements Document (PRD) and Project Brief. The purpose of this specification is to guide developers in building a modern, responsive, and highly usable interface that meets all functional and non-functional requirements.

## 2. Overall UX Vision

The user experience must be clean, modern, and exceptionally simple. Our goal is to enable users to accomplish their core tasks—especially creating an invoice—with maximum speed and minimal cognitive load. The interface should feel fast, responsive, and trustworthy, establishing a sense of delight and professionalism that users are proud to have represent their brand. We will use the ShadCN component library as the foundation for our design system to achieve this vision.

## 3. Key Interaction Paradigms

To create a fluid and intuitive user experience, the application will adhere to the following interaction paradigms:

*   **Single-Page Application (SPA) Feel**: Navigation between sections (e.g., Dashboard, Customers, Invoices) will be instantaneous, without full page reloads, leveraging the Next.js App Router.
*   **Modal-Driven Creation & Editing**: Creating or editing entities like Customers, Projects, or Invoices will primarily occur within modal dialogs. This keeps the user in their current context, reducing disorientation and improving workflow efficiency.
*   **Real-time Validation**: All input fields will provide immediate, inline feedback as the user types, preventing errors before a form is submitted and reducing user frustration.
*   **Dashboard as Hub**: The main dashboard will be the central landing page, providing an at-a-glance overview of business metrics and serving as a launchpad for all key actions (e.g., "Create New Invoice").
*   **Unobtrusive AI Assistance**: AI-powered suggestions will be presented clearly but unobtrusively, enhancing the workflow without blocking or distracting the user from their primary task.

## 4. Core Screens and Views

The MVP will consist of the following core screens and views:

1.  **Login/Registration Page**: A simple, clean form for user authentication. It will include fields for email and password, with clear links for registration and password recovery.
2.  **Dashboard**: The default view after login. It will feature:
    *   A prominent "Create New Invoice" button.
    *   A summary of key metrics: total invoiced amount (current year) and a breakdown of invoiced amounts per project.
    *   Main navigation sidebar providing access to other sections.
3.  **Invoice & Quote Management View**: A unified or tabbed view listing all created invoices and quotes.
    *   The list will be searchable and filterable by status (e.g., Draft, Sent, Paid).
    *   Each item will display key information (e.g., invoice/quote number, client name, amount, due date).
    *   Actions for each item will include View, Edit, Download PDF, and Delete.
4.  **Invoice/Quote Editor**: A modal-based form for creating and editing invoices and quotes.
    *   It will feature a clear distinction between supplier and client details.
    *   A searchable dropdown will allow users to select from saved customers, auto-filling their details.
    *   Line items will be dynamically addable and removable, with real-time calculation of totals.
    *   AI-powered suggestions for line items will appear contextually when a repeat customer is selected.
5.  **Customer Management View**: A dedicated section for CRUD operations on customer data.
    *   Displays a list of all saved customers.
    *   Provides simple forms (in modals) for adding and editing customer details (Name, Address, IČO, DIČ).
6.  **Project/Order Management View**: A dedicated section for CRUD operations on projects (Zakázky).
    *   Displays a list of all projects.
    *   Provides simple forms (in modals) for adding and editing project details (Name, Description).
7.  **User/Supplier Settings Page**: A page where the logged-in user can manage their own company (supplier) information, including name, address, IČO, DIČ, and logo upload.

## 5. Component Library and Design System

We will use the **ShadCN** component library (available at https://ui.shadcn.com/) exclusively. This choice ensures a modern, accessible, and consistent look and feel across the application.

*   **Consistency**: We will not deviate from the core design principles of ShadCN. All new components will be built by composing existing ShadCN primitives.
*   **Theming**: A simple, professional theme will be defined (colors, typography, spacing) and applied globally. The theme will be minimalist to ensure user-uploaded logos can be integrated elegantly.
*   **Iconography**: We will use a consistent icon set (e.g., from `lucide-react`) for all interactive elements.

## 6. Accessibility

The application must adhere to **WCAG 2.1 Level AA** standards. This is non-negotiable. Key considerations include:

*   **Keyboard Navigation**: All interactive elements must be reachable and operable via the keyboard alone.
*   **Semantic HTML**: Use correct HTML5 elements (e.g., `<nav>`, `<main>`, `<button>`) to ensure screen readers can interpret the page structure.
*   **ARIA Attributes**: Use ARIA attributes where necessary to provide additional context, especially for complex components like modals and dynamic forms.
*   **Color Contrast**: All text must have a contrast ratio of at least 4.5:1 against its background.

## 7. State Management

*   **Client-Side State**: For simple, local UI state (e.g., modal visibility), we will use React's built-in `useState` and `useContext` hooks. For more complex, shared state that doesn't need to be persisted on the server, we will use **Zustand** for its simplicity and minimal boilerplate.
*   **Server-Side State (Data Caching)**: We will use **React Query** (or SWR) to manage the fetching, caching, and synchronization of data from our API. This will handle loading and error states automatically and keep the UI in sync with the backend.

## 8. Data Fetching and Caching

All data will be fetched from the backend API.

*   **API Client**: A lightweight, centralized API client (e.g., using `axios` or a custom `fetch` wrapper) will be created to handle all requests. This client will be responsible for attaching the JWT authentication token to all necessary requests.
*   **Caching Strategy**: React Query will be configured with a `stale-while-revalidate` caching strategy to ensure the UI feels fast while data remains fresh.

## 9. Forms and Validation

*   **Form Management**: We will use **React Hook Form** for managing form state and submissions due to its performance and integration capabilities.
*   **Validation**: We will use **Zod** to define validation schemas for all forms. These schemas will be used on both the client-side (with React Hook Form) and the server-side to ensure data integrity and provide a single source of truth for our data models. Real-time, per-field validation will be implemented.

## 10. Authentication and Security

*   **JWT Handling**: Upon successful login, the JWT received from the backend will be stored securely in an `HttpOnly` cookie to prevent XSS attacks.
*   **Session Management**: The frontend will rely on the presence and validity of this token to manage the user's session. The API client will automatically handle token renewal if refresh tokens are implemented.
*   **Protected Routes**: A middleware or higher-order component will be used to protect routes that require authentication, redirecting unauthenticated users to the login page.

## 11. Error Handling and User Feedback

A consistent strategy for user feedback is crucial for a good experience.

*   **Toasts/Notifications**: For non-blocking feedback (e.g., "Invoice saved successfully," "Customer deleted"), we will use a toast notification system (e.g., from `react-hot-toast`).
*   **Form Errors**: Validation errors will be displayed inline, next to the relevant form field. A summary of errors may be shown at the top of the form on submission failure.
*   **Critical Errors**: For critical, blocking errors (e.g., the API is down), a dedicated error page or modal will be displayed with a clear message and a suggested action (e.g., "Please try again later").

## 12. Open Questions

*   What is the exact data shape and schema for each of the core models (Supplier, Customer, Project, Invoice, Quote)? A detailed API contract is needed.
*   What are the specific endpoints and request/response payloads for the AI suggestion service?
*   Are there any specific formatting requirements for the invoice/quote numbers beyond being unique and sequential?

## 13. Internationalization (i18n)

To support both English and Czech, the front-end will implement a full internationalization framework.

*   **Framework**: A library like `next-intl` will be used to manage translations.
*   **Translation Keys**: All static UI strings must be replaced with translation keys that reference entries in locale files (e.g., `en.json`, `cs.json`). Hardcoded strings are not permitted.
*   **Language Switching**: A UI control (e.g., a dropdown) will be implemented to allow users to switch between supported languages. This preference will be persisted in `localStorage`.
*   **PDF Generation**: When triggering a PDF download, the currently active language must be passed to the API so the generated document matches the UI language.
