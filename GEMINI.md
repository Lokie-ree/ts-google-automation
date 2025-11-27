# GEMINI.md

This file provides a comprehensive overview of the `pelican-beta-automation` project, its structure, and how to use it.

## Project Overview

This is a TypeScript-based command-line tool designed to automate the generation of Google Docs and Forms for the Pelican AI beta program. It uses the Google Workspace APIs to create these documents from Markdown templates.

**Key Technologies:**

*   **TypeScript:** The core language for the project.
*   **Node.js:** The runtime environment.
*   **Google APIs:** Specifically `googleapis` and `@google-cloud/local-auth` for interacting with Google Docs and Forms.
*   **Commander.js:** For creating the command-line interface.
*   **Marked:** For parsing the Markdown content templates.
*   **Chalk & Ora:** For providing a user-friendly CLI experience with colored output and spinners.

**Architecture:**

The project follows a modular structure:

*   `src/cli.ts`: The main entry point for the CLI, defining the available commands.
*   `src/auth/`: Handles authentication with the Google Workspace APIs.
*   `src/generators/`: Contains the logic for generating the Google Docs and Forms.
*   `src/parsers/`: Includes the Markdown parser to process the content templates.
*   `src/types/`: Defines the data structures and constants used throughout the project.
*   `docs/`: Contains the Markdown templates for the documents and forms.

## Building and Running

### Prerequisites

*   Node.js and npm
*   Google Cloud project with the Google Docs and Google Forms APIs enabled.
*   OAuth 2.0 credentials (client ID and secret) saved in a `.env` file.

### Installation

1.  Clone the repository.
2.  Install the dependencies:
    ```bash
    npm install
    ```

### Configuration

1.  Create a `.env` file in the root of the project.
2.  Add the following environment variables to the `.env` file, using the values from your Google Cloud project:
    ```
    GOOGLE_CLIENT_ID=your_client_id
    GOOGLE_CLIENT_SECRET=your_client_secret
    ```

### Commands

*   **Authenticate:**
    This command will open a browser window to authenticate with your Google account.
    ```bash
    npm run auth
    ```

*   **Generate all content:**
    This command generates all the Google Docs and Forms.
    ```bash
    npm run generate:all
    ```

*   **Generate a single form:**
    ```bash
    npm run generate:form <form-type>
    ```
    Replace `<form-type>` with either `post-framework-survey` or `weekly-checkin`.

*   **Generate a single document:**
    ```bash
    npm run generate:doc <doc-type>
    ```
    Replace `<doc-type>` with either `framework` or `welcome-kit`.

*   **Export links:**
    This command exports the generated links in a format suitable for Convex email templates.
    ```bash
    npm run links:export
    ```

*   **Build:**
    This command compiles the TypeScript code to JavaScript.
    ```bash
    npm run build
    ```

## Development Conventions

*   **Code Style:** The project uses Prettier for code formatting. (Inferred from the presence of `prettier` in `.gitignore` and the consistent style).
*   **Commits:** Commit messages should follow the Conventional Commits specification.
*   **Testing:** There are currently no tests in the project (`"test": "echo \"Error: no test specified\" && exit 1"`). Adding tests is a high-priority improvement.
*   **Dependencies:** Use npm to manage dependencies.
*   **Branching:** Use a feature-branching workflow. Create a new branch for each new feature or bug fix.
