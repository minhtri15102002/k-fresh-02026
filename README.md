# k-fresh-02026
# E-Commerce Playground Automation Testing

Automation testing project for the E-Commerce Playground website using Playwright, TypeScript, and the Page Object Model (POM) design pattern.

## Website Under Test

https://ecommerce-playground.lambdatest.io/

---

# Technologies Used

- Playwright
- TypeScript
- Node.js
- Page Object Model (POM)
- ESLint

---

# Project Structure

| Folder/File | Description |
|---|---|
| `.github/` | GitHub workflows and CI/CD configurations |
| `data/` | Test data files |
| `documents/` | Project documents and reports |
| `locators/` | Locator definitions for UI elements |
| `models/` | Data models and interfaces |
| `pages/` | Page Object Model (POM) classes |
| `profiles/` | Environment and profile configurations |
| `tests/ui/` | UI test cases |
| `utilities/` | Helper functions and reusable utilities |
| `.gitignore` | Git ignored files configuration |
| `README.md` | Project documentation |
| `SECURITY.md` | Security policy documentation |
| `env.loader.ts` | Environment loader configuration |
| `eslint.config.mjs` | ESLint configuration file |
| `package-lock.json` | Locked dependency versions |
| `package.json` | Project metadata and npm scripts |
| `playwright.config.ts` | Playwright test configuration |
| `tsconfig.json` | TypeScript configuration |

---

# Design Pattern

This project follows the **Page Object Model (POM)** design pattern.

Benefits of POM:
- Improves code maintainability
- Reduces duplicated code
- Makes test scripts cleaner and easier to understand
- Separates test logic from UI locators

---

# Features Covered

The automation test suite covers major functionalities such as:

- User Registration
- User Login
- Product Search
- Add Product to Cart
- Update Shopping Cart
- Checkout Process
- Wishlist
- Address Book
- Compare Products
- User Profiles

---

# Prerequisites

Before running this project, make sure the following are installed:

- Node.js (>= 18, LTS v24.x recommended, Latest v25.x supported)
- npm

Check installed versions:

```bash
node -v
npm -v
```

---

# Installation

Clone the repository:

```bash
git clone <repository-url>
```

Move to the project directory:

```bash
cd <project-folder>
```

Install dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npx playwright install
```

---

# Available Scripts

The following scripts are available in `package.json`:

| Script | Description |
|---|---|
| `npm test` | Run tests on Chromium browser |
| `npm run test:all` | Run tests on all browsers |
| `npm run test:chrome` | Run tests on Chromium |
| `npm run test:firefox` | Run tests on Firefox |
| `npm run test:webkit` | Run tests on WebKit |
| `npm run test:ui` | Open Playwright UI Mode |
| `npm run test:debug` | Run tests in debug mode |
| `npm run codegen` | Open Playwright Codegen tool |
| `npm run linter` | Run ESLint and auto-fix issues |

---

# Running Tests

## Run tests on Chromium

```bash
npm test
```

or

```bash
npm run test:chrome
```

---

## Run tests on all browsers

```bash
npm run test:all
```

---

## Run tests on Firefox

```bash
npm run test:firefox
```

---

## Run tests on WebKit

```bash
npm run test:webkit
```

---

## Run tests in UI mode

```bash
npm run test:ui
```

---

## Run tests in debug mode

```bash
npm run test:debug
```

---

# Playwright Code Generator

Generate locators and test actions automatically:

```bash
npm run codegen
```
---

# Allure Report

Open and view the Allure test report:

```bash
allure serve ./allure-results
```

---

# Linting

Run ESLint and automatically fix coding style issues:

```bash
npm run linter
```
---

# Playwright Report

After execution, open the HTML report:

```bash
npx playwright show-report
```

---

# Coding Standards

- Use TypeScript best practices
- Follow Page Object Model structure
- Keep locators separated from test logic
- Reuse common methods through utility/helper classes
- Maintain readable and scalable test scripts

---

# Example Test Flow

Example automation flow:
1. Open website
2. Login with valid account
3. Search for product
4. Add product to cart
5. Proceed to checkout
6. Verify successful operation

---

# Notes

- This project is intended for learning and automation practice purposes.
- The test website is publicly available for testing and demonstration.
- Make sure the environment and dependencies are properly installed before execution.

---

# License

This project is for educational and testing purposes only.