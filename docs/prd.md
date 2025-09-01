# AI-Powered Czech Invoice Generator Product Requirements Document (PRD)

## Goals and Background Context

### Goals
*   To deliver a modern, simple, open-source, AI-powered invoice generator for the Czech market.
*   To ensure the application is fast, reliable, and secure, addressing the shortfalls of the previous system.
*   To provide a superior, mobile-first user experience using the ShadCN component library.
*   To guarantee 100% correct Czech business and payment standard compliance (SPAYD QR codes, etc.).
*   To achieve high user satisfaction and drive adoption through a superior feature set and user interface.
*   To create a platform for future growth with a robust, API-centric architecture.

### Background Context
Czech businesses, particularly SMBs and freelancers, currently rely on invoicing tools that are often outdated, insecure, or lack proper localization. This project was initiated to replace a legacy generator that, while functional, suffers from these issues. The goal is to capture the market of users dissatisfied with the status quo by providing a delightful, modern, and trustworthy solution that meets their specific needs. This PRD outlines the requirements for the Minimum Viable Product (MVP) to achieve this vision.

### Change Log
| Date       | Version | Description                | Author |
| :--------- | :------ | :------------------------- | :----- |
| 2025-08-27 | 1.0     | Initial draft of the PRD.  | John   |

## Requirements

### Functional
1.  **FR1**: The system shall provide full Create, Read, Update, and Delete (CRUD) functionality for Suppliers, Customers, Projects/Orders (Zakázky), Invoices, and Quotes.
2.  **FR2**: The system shall allow users to link an Invoice to a specific Project/Order.
3.  **FR3**: The system shall provide a simple dashboard displaying the total amount invoiced and a summary of invoiced amounts per project.
4.  **FR4**: The user interface shall be built using the ShadCN component library to ensure a modern and intuitive user experience.
5.  **FR5**: The system shall generate professional, pixel-perfect PDF documents for invoices and quotes from at least two distinct templates.
6.  **FR6**: The system shall guarantee the uniqueness of invoice numbers (per supplier) and generate 100% compliant Czech SPAYD QR codes for payment on all invoices.
7.  **FR7**: The system shall provide at least one helpful, optional AI-powered suggestion to the user during invoice creation (e.g., suggesting items for a repeat customer).
8.  **FR8**: The system shall support core Czech localization, including correct handling of IČO, DIČ, and VAT calculations.
9.  **FR9**: The system shall provide secure user authentication and session management.
10. **FR10**: The system shall support internationalization (i18n) for both the user interface and generated PDF documents. Initial language support will include English and Czech, with a UI mechanism for users to switch between them.

### Non-Functional
1.  **NFR1**: The application's source code shall be publicly available and maintained in a GitHub repository under an open-source license.
2.  **NFR2**: The user interface shall be mobile-first and responsive, providing a seamless experience on desktops, tablets, and smartphones.
3.  **NFR3**: The average page load time for the application shall be under 2 seconds.
4.  **NFR4**: The application shall maintain a service uptime of 99.9% or higher.
5.  **NFR5**: The system shall implement modern security best practices, including but not limited to JWT-based authentication, server-side input validation, and API rate limiting.
6.  **NFR6**: The primary database for the application shall be PostgreSQL.
7.  **NFR7**: The backend shall be built using the Node.js runtime environment.
8.  **NFR8**: The frontend shall be a Next.js application written in TypeScript.

## User Interface Design Goals

### Overall UX Vision
The user experience must be clean, modern, and exceptionally simple. The primary goal is to enable users to accomplish their core tasks (like creating an invoice) with maximum speed and minimal cognitive load. The interface should feel fast, responsive, and trustworthy, establishing a sense of delight and professionalism that users are proud to have represent their brand.

### Key Interaction Paradigms
*   **Single-Page Application (SPA) Feel**: Navigation between sections should be instantaneous, without full page reloads.
*   **Modal-Driven Creation**: Creating or editing items like customers, projects, or invoices will primarily be done through well-designed modal dialogs to keep the user in context.
*   **Real-time Validation**: Input fields will provide immediate feedback to prevent errors before the user submits a form.
*   **Dashboard as Hub**: The main dashboard will serve as the central landing page, providing an at-a-glance overview and quick access to all key actions.

### Core Screens and Views
To deliver the required functionality, the MVP will need the following conceptual screens:
*   Dashboard (including simple financial overview)
*   Invoice & Quote List (with search and filter capabilities)
*   Invoice/Quote Editor
*   Customer Management View
*   Project/Order Management View
*   User/Supplier Settings Page
*   Login/Registration Page

### Accessibility: WCAG AA
The application should adhere to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standard.

### Branding
The application will have a clean, professional, and minimalist brand identity. The design must elegantly incorporate the user's own uploaded logo onto invoices and into the UI.

### Target Device and Platforms: Web Responsive
The application will be a responsive web app, designed to work flawlessly on modern browsers across desktop, tablet, and mobile devices.

## Technical Assumptions

### Repository Structure: Monorepo
The project will be managed within a single monorepo (e.g., using Turborepo) to simplify dependency management and streamline development across the frontend and backend.

### Service Architecture: Monolith
For the MVP, we will develop the backend as a single, well-structured monolithic service. This approach is favored for its simplicity in development, testing, and deployment for an initial product launch. It can be strategically broken down into microservices later if scale requires it.

### Testing Requirements: Unit + Integration
The project will require a solid foundation of automated testing, including:
*   Unit Tests for individual functions and components.
*   Integration Tests to verify interactions between different parts of the system (e.g., API endpoints and the database).

### Additional Technical Assumptions and Requests
*   **Frontend**: Next.js 14 with TypeScript.
*   **UI Components**: ShadCN component library.
*   **Backend**: Node.js (e.g., with Express.js or NestJS).
*   **Database**: PostgreSQL.
*   **Deployment**: The application will be containerized using Docker.

## Epic List

1.  **Epic 1: Foundational Setup & Core Invoicing**
    *   **Goal:** Establish the project's technical foundation (including user authentication) and deliver the core user journey of creating, saving, and printing a basic invoice for a manually entered customer.

2.  **Epic 2: Customer, Project & Quote Management**
    *   **Goal:** Introduce full CRUD functionality for Customers and Projects (Zakázky), allowing users to save client details and link invoices to specific projects. This epic also includes the functionality for creating and managing Quotes.

3.  **Epic 3: Dashboard & AI-Powered Workflow**
    *   **Goal:** Enhance the user experience by implementing the simple dashboard for financial overviews and introducing the first AI-powered suggestion feature to accelerate the invoicing workflow.

## Epic 1: Foundational Setup & Core Invoicing

**Expanded Goal:** The objective of this epic is to establish the project's complete technical foundation, from the code repository to a live, authenticated user session. By the end of this epic, a registered user will be able to log in, enter their company's details, create a basic invoice for a manually entered client, save it, and generate a professional, compliant PDF of that invoice. This represents the single most critical user journey in the entire application.

#### Story 1.1: Project & CI/CD Foundation
*   **As a** Developer,
*   **I want** the initial monorepo structure with frontend and backend applications set up and connected to a basic CI/CD pipeline,
*   **so that** we have a stable, verifiable, and automated foundation to build upon.
*   **Acceptance Criteria:**
    1.  The monorepo is initialized with separate packages for the Next.js frontend and the Node.js backend.
    2.  A developer can run a single command (e.g., `npm run dev`) to start both applications locally.
    3.  The backend application has a public `/health` endpoint that returns a `200 OK` status.
    4.  A basic CI pipeline is configured to run on pull requests (e.g., linting and installing dependencies).

#### Story 1.2: User Registration & Authentication
*   **As a** new user,
*   **I want** to register for an account using my email and a password and then log in,
*   **so that** I can securely access and manage my private invoicing data.
*   **Acceptance Criteria:**
    1.  A user can create a new account.
    2.  A user can log in with their credentials to receive a JWT access token.
    3.  API routes that require authentication are protected and return a `401 Unauthorized` error if no valid token is provided.
    4.  The frontend securely stores the token and uses it for subsequent API requests.

#### Story 1.3: Supplier Information Management
*   **As a** logged-in user,
*   **I want** to enter, save, and edit my company's (supplier) details,
*   **so that** my correct business information automatically appears on all my invoices.
*   **Acceptance Criteria:**
    1.  A "Settings" page exists for logged-in users.
    2.  On this page, a user can save their company name, address, IČO, and DIČ.
    3.  This information is correctly associated with their user account in the database.

#### Story 1.4: Basic Invoice Creation Form
*   **As a** logged-in user,
*   **I want** a simple form to create a new invoice with line items,
*   **so that** I can capture all the necessary details for billing a client.
*   **Acceptance Criteria:**
    1.  The UI provides a clear "Create New Invoice" action.
    2.  The form includes fields for manually entering client information.
    3.  The form includes fields for invoice metadata (e.g., issue date, due date).
    4.  The user can dynamically add, edit, and remove line items (description, quantity, unit price).
    5.  The form automatically calculates the total for each line and the grand total for the invoice.

#### Story 1.5: Save and View Invoice
*   **As a** logged-in user,
*   **I want** to save my completed invoice and view it on a dedicated page,
*   **so that** my work is safely stored and I can review it before sending.
*   **Acceptance Criteria:**
    1.  A "Save Invoice" action persists the invoice data to the database.
    2.  A unique, sequential invoice number is automatically generated and saved upon creation.
    3.  After saving, the user is redirected to a read-only view of the newly created invoice.

#### Story 1.6: Compliant PDF Generation
*   **As a** logged-in user,
*   **I want** to download a PDF of a saved invoice,
*   **so that** I have a professional, standards-compliant document to send to my client.
*   **Acceptance Criteria:**
    1.  The invoice view page has a "Download PDF" button.
    2.  The generated PDF is clean, professional, and uses the first available template.
    3.  The PDF correctly displays all supplier, client, and invoice information.
    4.  A correctly formatted Czech SPAYD QR code is included on the PDF.

## Epic 2: Customer, Project & Quote Management

**Expanded Goal:** The objective of this epic is to evolve the application from a simple invoice generator into a lightweight business management tool. By the end of this epic, a user will be able to manage a database of their clients and projects, link invoices to them for better tracking, and manage the full lifecycle of a quote, including converting it into an invoice. This eliminates repetitive data entry and provides a more organized workflow.

#### Story 2.1: Customer Management (CRUD)
*   **As a** logged-in user,
*   **I want** to create, view, update, and delete my clients in a dedicated "Customers" section,
*   **so that** I can maintain a central address book and avoid re-typing customer details for every invoice.
*   **Acceptance Criteria:**
    1.  A "Customers" page is added to the main navigation.
    2.  The page displays a list of all saved customers.
    3.  The user can add a new customer with all required fields (name, address, IČO, DIČ).
    4.  The user can edit the details of any existing customer.
    5.  The user can delete a customer.

#### Story 2.2: Select Customer During Invoicing
*   **As a** logged-in user,
*   **I want** to select a saved customer from a list when creating an invoice,
*   **so that** their details are auto-filled, saving me time and reducing errors.
*   **Acceptance Criteria:**
    1.  The invoice creation form is updated with a searchable dropdown or selection field for customers.
    2.  Selecting a customer from the list automatically populates the client detail fields on the form.
    3.  The user retains the option to manually enter details for a one-off client without saving them.

#### Story 2.3: Project Management (CRUD)
*   **As a** logged-in user,
*   **I want** to create, view, update, and delete projects or orders (zakázky),
*   **so that** I can organize my work and track revenue against specific engagements.
*   **Acceptance Criteria:**
    1.  A "Projects" page is added to the main navigation.
    2.  The page displays a list of all created projects.
    3.  The user can add a new project with at least a name and an optional description.
    4.  The user can edit and delete existing projects.

#### Story 2.4: Link Invoice to Project
*   **As a** logged-in user,
*   **I want** to associate an invoice with a specific project,
*   **so that** I can easily see which invoices belong to which body of work.
*   **Acceptance Criteria:**
    1.  The invoice form is updated with an optional dropdown to select a project.
    2.  The selected project is saved as a property of the invoice.
    3.  The project association is visible on the invoice view page.

#### Story 2.5: Quote Creation and Management
*   **As a** logged-in user,
*   **I want** to create, save, view, and download a PDF for a Quote,
*   **so that** I can send professional offers to potential clients.
*   **Acceptance Criteria:**
    1.  A "Quotes" section is added to the application.
    2.  The quote creation form and workflow are identical to the invoice workflow, but use a distinct numbering scheme (e.g., "Q-2025001").
    3.  Quotes are saved and managed separately from invoices.
    4.  Quotes can be downloaded as a standards-compliant PDF.

#### Story 2.6: Convert Quote to Invoice
*   **As a** logged-in user,
*   **I want** to convert an approved quote into a new invoice with a single click,
*   **so that** I can begin the billing process instantly without duplicating my work.
*   **Acceptance Criteria:**
    1.  A "Convert to Invoice" action is available on a saved quote.
    2.  Executing the action creates a new, unsaved invoice pre-populated with all the data from the quote.
    3.  The new invoice is assigned a new, unique invoice number, distinct from the quote number.

## Epic 3: Dashboard & AI-Powered Workflow

**Expanded Goal:** The objective of this epic is to deliver on the promise of an intelligent invoicing tool. By the end of this epic, users will be greeted with a simple, actionable dashboard that provides an overview of their business activity. Furthermore, the application will provide its first AI-powered enhancement, designed to learn from the user's behavior to suggest common invoice items, saving time and reducing repetitive data entry.

#### Story 3.1: Simple Dashboard Display
*   **As a** logged-in user,
*   **I want** to see a simple dashboard with key financial metrics when I log in,
*   **so that** I can get an immediate overview of my business activity.
*   **Acceptance Criteria:**
    1.  The default page after login is a dashboard.
    2.  The dashboard displays the total invoiced amount (for the current year).
    3.  The dashboard displays a summary of amounts invoiced per project.
    4.  The data presented is accurate and updates in near real-time.

#### Story 3.2: AI Suggestion Service (Backend)
*   **As a** developer,
*   **I want** a backend API endpoint that can generate suggestions based on a user's invoicing history,
*   **so that** the frontend has a fast and reliable service to power AI-driven features.
*   **Acceptance Criteria:**
    1.  A new, secure API endpoint is created (e.g., `/api/suggestions/invoice`).
    2.  When provided with a `customerId`, the endpoint returns a list of the most frequent line item descriptions previously invoiced to that specific customer.
    3.  The service is performant and returns a response in under 500ms.

#### Story 3.3: AI-Powered Item Suggestion
*   **As a** logged-in user,
*   **I want** to be shown a list of suggested items when creating an invoice for a repeat customer,
*   **so that** I can add common items with a single click instead of re-typing them.
*   **Acceptance Criteria:**
    1.  When a saved customer is selected on the invoice form, the new suggestion service is called.
    2.  A list of suggested items is displayed clearly but unobtrusively.
    3.  Clicking a suggestion adds it as a new line item to the invoice.
    4.  The feature does not block or slow down the user's ability to enter items manually.
    5.  If there are no suggestions, nothing is shown.
