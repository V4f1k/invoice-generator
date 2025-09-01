# Project Brief: AI-Powered Czech Invoice Generator

## Executive Summary

This project aims to create a modern, AI-powered invoice and quote generator specifically designed for the Czech market. The application will replace an existing system, addressing its technical limitations and outdated user experience. It will provide a simple, fast, and mobile-first solution for small to medium-sized businesses (SMBs), freelancers, and accounting firms, with a core value proposition centered on superior Czech localization, a modern user experience using ShadCN components, and helpful AI-driven features.

## Problem Statement

Czech businesses, particularly SMBs and freelancers, often rely on invoicing tools that are either outdated, overly complex, or lack proper localization for Czech accounting standards. The existing generator, while functionally sound, suffers from an outdated UI, critical security vulnerabilities, poor scalability, and a lack of modern features like helpful AI or a robust API. This results in a frustrating user experience, potential data integrity issues, and a product that is not competitive in the modern SaaS landscape. The urgency is to capture the market of users who are dissatisfied with legacy systems and are seeking a delightful, mobile-first, and efficient solution.

## Proposed Solution

We will build a new full-stack application from the ground up, leveraging a modern technology stack. The solution will be a web application centered around five core principles we defined:

1.  **Reliable Data Operations**: Fast, secure, and tested CRUD operations for all data.
2.  **Intuitive User Experience**: A modern, simple UI built with ShadCN components.
3.  **Professional PDF Generation**: Pixel-perfect PDF invoices from multiple templates.
4.  **Correct & Unique QR Codes**: Guaranteed unique invoice numbers and 100% correct Czech SPAYD QR codes.
5.  **Helpful, Optional AI**: An AI assistant that provides optional, fast suggestions without being intrusive.

The architecture will be API-centric, ensuring it is headless and ready for future integrations.

## Target Users

*   **Primary User Segment: Czech SMBs (2-50 employees)**: Businesses that need a reliable, multi-user invoicing system that adheres to all Czech standards.
*   **Secondary User Segment: Czech Freelancers & Sole Proprietors (OSVČ)**: Individuals who need a fast, simple, and mobile-friendly way to create and manage invoices.
*   **Tertiary User Segment: Czech Accounting Firms**: Firms that manage invoicing for multiple clients and would benefit from the multi-supplier support.

## Goals & Success Metrics

*   **Business Objectives**:
    *   Successfully replace the old generator and migrate its users.
    *   Achieve 1,000+ monthly active users within 12 months post-launch.
*   **User Success Metrics**:
    *   Time to create and send a new invoice is under 60 seconds.
    *   User satisfaction score (CSAT) is 4.5/5 or higher.
*   **Key Performance Indicators (KPIs)**:
    *   **User Churn**: <5% monthly churn rate.
    *   **Performance**: <2 second page load time and 99.9% uptime.

## MVP Scope

### Core Features (Must Have):
*   **Reliable Data Operations:** Secure, tested CRUD for Suppliers, Customers, Projects/Orders (Zakázky), Invoices, and Quotes on a robust PostgreSQL database. Invoices must be linkable to projects.
*   **Simple Dashboard:** A basic dashboard view showing total amount invoiced and invoiced amounts per project.
*   **Intuitive UX:** A clean, mobile-first UI built with ShadCN, featuring an effortless workflow and instant feedback.
*   **Professional PDF Generation:** Generation of pixel-perfect PDFs using a modern library (e.g., React PDF) with at least two professional templates.
*   **Correct & Unique QR Codes:** Guaranteed unique invoice numbers and 100% correct Czech SPAYD QR code generation.
*   **Helpful AI:** At least one helpful, optional AI suggestion feature (e.g., suggesting items for a repeat customer).
*   **Core Czech Localization**: Full support for IČO, DIČ, Czech currency, and VAT.
*   **User Authentication**: Secure user login and session management.
*   **Internationalization (i18n)**: Support for both English and Czech in the UI and on generated PDFs.

### Out of Scope for MVP:
*   Advanced business intelligence dashboard and reporting.
*   Third-party accounting system integrations (e.g., Pohoda, FlexiBee).
*   Real-time collaboration features.

## Post-MVP Vision

*   **Phase 2 Features**: Introduce an analytics dashboard, email automation for sending invoices, and a wider variety of PDF templates.
*   **Long-term Vision**: Become the market-leading invoicing solution in the Czech Republic by building out a full API ecosystem for third-party integrations and expanding into advanced automation and business intelligence features.

## Technical Considerations

*   **Platform Requirements**: Web application, targeting modern evergreen browsers with a mobile-first responsive design.
*   **Technology Preferences**:
    *   **Frontend:** Next.js 14, TypeScript, Tailwind CSS, ShadCN component library.
    *   **Backend:** Node.js with a modern framework (e.g., Express.js, NestJS).
    *   **Database:** PostgreSQL.
    *   **Hosting/Infrastructure:** Dockerized, ready for deployment on cloud platforms like Vercel (for frontend) and AWS/GCP/Render (for backend).
*   **Architecture Considerations**:
    *   **Repository Structure:** Monorepo (e.g., using Turborepo) to manage both frontend and backend code.
    *   **Security/Compliance:** Implement JWT-based authentication, input validation (e.g., with Zod), rate limiting, and adhere to GDPR principles.

## Constraints & Assumptions

*   **Constraints**:
    *   The initial launch will be focused exclusively on the Czech market.
*   **Key Assumptions**:
    *   A superior user experience built with a modern component library (ShadCN) will be a key differentiator and driver of adoption.
    *   Users of the old system are willing to migrate to a new, improved platform.
    *   The core feature set of the old application is a valid foundation for the MVP of the new application.

## Risks & Open Questions

*   **Key Risks**:
    *   **AI Utility Risk:** The AI features might not be perceived as useful by users, wasting development effort. Mitigation: Make AI features optional and gather user feedback before expanding.
    *   **Market Adoption Risk:** The market may be saturated, or users may be unwilling to switch from existing solutions. Mitigation: Focus on superior UX and Czech-specific features as key differentiators.
*   **Open Questions**:
    *   What is the most effective strategy for migrating users from the old system?
    *   What pricing model will be used for the new SaaS product?

## Appendices

*   **C. References**: The full analysis of the previous system is available in `old-generator/PRODUCT-ANALYSIS.md`.

## Next Steps

1.  Review and finalize this Project Brief.
2.  Handoff to the Product Manager (PM) to begin the creation of the detailed Product Requirements Document (PRD).
