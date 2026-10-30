# ERPAppDemo

An Angular-based Institute ERP application for managing institute
operations through separate feature modules and layered application
structure.

## Project Overview

ERPAppDemo is organized into feature areas such as:

-   **User Management** -- user-related administration and access
    workflows.
-   **Account** -- student registration, payment management, fee
    summaries, invoices/receipts, and payment history.
-   **Group Leader** -- batch management, student-to-batch assignment,
    batch schedules, and attendance workflows.

The application uses a layered structure to keep presentation
components, application services, domain models/DTOs, and
infrastructure/API access separated.

## Technology Stack

-   Angular
-   TypeScript
-   HTML5 and CSS3
-   Bootstrap (where used by the UI)
-   RxJS
-   Angular `HttpClient`
-   REST APIs
-   Git / GitHub

> The exact Angular, Node.js, and npm versions should be taken from the
> project's `package.json`, Angular workspace configuration, and the
> team's supported environment. Use the versions configured for the
> checked-out project.



### Layer Responsibilities

  -----------------------------------------------------------------------
  Layer                               Responsibility
  ----------------------------------- -----------------------------------
  `Presentation`                      Angular components, templates,
                                      styles, forms, and user
                                      interactions

  `Application`                       Services and application workflows
                                      that coordinate API calls

  `Domain`                            Entity models, interfaces, and
                                      request/response DTOs

  `Infrastructure`                    HTTP/API clients and external
                                      service integration
  -----------------------------------------------------------------------

## Group Leader -- Batch Management

The Group Leader Batch feature communicates with the Batch Management
REST API.

Main workflows include:

-   Create, view, refresh, delete, and restore batches.
-   View students assigned to a batch.
-   Add students to a batch.
-   Generate and view batch schedules.
-   Create attendance sessions and manage attendance workflows.
-   Display student counts for batches.

### Batch Management API Endpoints

  -------------------------------------------------------------------------------------
  Method                  Endpoint                              Purpose
  ----------------------- ------------------------------------- -----------------------
  GET                     `/Batch/get-all`                      Retrieve batches

  POST                    `/Batch/create`                       Create a batch

  GET                     `/Batch/get-by-id/{batchId}`          Retrieve one batch

  PUT                     `/Batch/update/{batchId}`             Update a batch

  DELETE                  `/Batch/delete/{batchId}`             Delete a batch

  PUT                     `/Batch/restore/{batchId}`            Restore a batch

  GET                     `/BatchStudent/get-all`               Retrieve batch-student
                                                                assignments

  GET                     `/BatchStudent/batch/{batchId}`       Retrieve students
                                                                assigned to a batch

  POST                    `/BatchStudent/create`                Assign a student to a
                                                                batch

  POST                    `/BatchSchedule/generate/{batchId}`   Generate a batch
                                                                schedule

  GET                     `/BatchSchedule/get-all`              Retrieve all batch
                                                                schedules

  GET                     `/BatchSchedule/batch/{batchId}`      Retrieve schedules for
                                                                one batch

  POST                    `/BatchScheduleAttendance/create`     Create an attendance
                                                                session
  -------------------------------------------------------------------------------------

The API may expose additional endpoints. Check the service's Swagger UI
for the current contract and request schemas before changing API
integrations.

## Prerequisites

Install the versions supported by the project:

-   Node.js
-   npm
-   Angular CLI (if the project uses a globally installed CLI)

Check installed versions:

``` bash
node --version
npm --version
ng version
```

## Getting Started

1.  Clone or download the project.
2.  Open a terminal in the directory containing `package.json`.
3.  Install dependencies:

``` bash
npm install
```

4.  Start the Angular development server:

``` bash
ng serve
```

5.  Open the local URL printed by Angular CLI in the terminal (commonly
    `http://localhost:4200`).

If the repository defines npm scripts, use the corresponding scripts
from `package.json`, for example:

``` bash
npm start
```

## Build

To create a development build:

``` bash
ng build
```

To use the production configuration:

``` bash
ng build --configuration production
```

The generated build output is written to the directory configured in
`angular.json` (commonly under `dist/`).

## API Configuration

The frontend consumes REST APIs. Before running the application, verify:

-   The API host and endpoint paths are correct.
-   Required authentication headers or tokens are supplied by the
    existing authentication flow.
-   The API server is reachable from the browser.
-   CORS is configured on the API server for the frontend origin.
-   Request and response property names match the API Swagger
    definitions.

Do not commit API secrets, passwords, private tokens, or
environment-specific credentials to source control. Prefer the project's
existing environment/configuration mechanism for environment-specific
values.

## Development Guidelines

-   Keep changes within the relevant feature module.
-   Preserve the existing login and authentication flow when working on
    protected pages.
-   Keep UI components in `Presentation`, workflow/API coordination in
    `Application`, shared models and DTOs in `Domain`, and HTTP
    integration in `Infrastructure`.
-   Avoid unnecessary full-page reloads. After create, update, delete,
    restore, student assignment, or attendance actions, refresh the
    affected data and update the UI when the API operation succeeds.
-   Avoid repeated API calls when a single list endpoint can provide the
    required data.
-   Confirm API request and response schemas in Swagger before
    implementing or changing integrations.
-   Do not modify unrelated modules as part of a feature-specific bug
    fix.

## Troubleshooting

### Dependencies or Angular CLI are missing

Run:

``` bash
npm install
```

Then use the project's local Angular CLI through its npm scripts, if
available.

### API request fails in the browser

Check the browser Network tab and verify the request URL, HTTP status,
authentication headers, and API availability. For CORS errors, the API
server must allow the frontend origin.

### Data does not refresh after an action

Check that the API request succeeded and that the component refreshes
the affected list/count after the success response. Prefer refreshing
only the affected data rather than reloading the entire browser page.

### Build fails

Read the first Angular/TypeScript error in the terminal output. Also
verify that the installed Node.js version is supported by the Angular
version used in this repository.

## Repository

Add or update the repository URL here:

``` text
<YOUR_GITHUB_REPOSITORY_URL>
```

## License

Add the license and usage terms applicable to this project.
