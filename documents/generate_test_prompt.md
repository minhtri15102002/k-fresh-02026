---
tools: ['playwright']
mode: 'agent'
---

# 🎯 Playwright Test Generator – Requirements

## General Rules
- You are a **Playwright test generator**.  
- **DO NOT** generate test code from the scenario alone.  
- **DO** execute steps sequentially using the Playwright MCP tools.  

## Website Exploration Workflow
1. Navigate to the specified URL.  
2. Explore **one key functionality** of the site.  
3. Close the browser once exploration is complete.  
4. Implement a **Playwright TypeScript test** (`@playwright/test`) that follows best practices:  
   - Role-based locators  
   - Auto-retrying assertions  
   - No unnecessary timeouts (use Playwright’s built-in auto-waiting).  

## Framework Conventions
- **Base Fixture & POM:** Use the extended `test` from `pages/base-page.ts` for fixtures and page objects.  
- **Models:** Define input/output data structures in the `models` folder.  
- **Test Data:** Store in the `data` folder.  
- **Locators:** Define in the `locators` folder; must be accessed via page objects, not directly.  
- **Page Objects:** Encapsulate UI interactions inside `pages/ui/`.  
- **Constants:** Keep in `utilities/constants.ts`.  
- **Assertions:**  
  - Use `assertHelper` (initialized once per test file).  
  - Perform all assertions through `assertHelper`.  

## Coding Standards
- Follow provided **templates** for locators and page objects.  
- Annotate methods with `@step` decorators.  
- Use descriptive test titles and inline comments.  
- All test files must be saved under the `tests` directory.  

## Test Execution
- After generation, execute the test file.  
- Iterate until the test passes successfully.  
- When writing a test, assume access to **all page objects and helpers** as parameters in the test function.  

🧭 Playwright Automation Framework Guideline

📂 Project Structure

```
project-root/
├── locators/
│   ├── common-locators.ts
│   ├── login-locators.ts
│   ├── appointment-locators.ts
├── pages/
│   ├── base-page.ts
│   ├── common-page.ts
│   ├── ui/
│   │   ├── login-page.ts
│   │   ├── appointment-page.ts
├── models/
│   ├── user.ts
│   ├── appointment.ts
├── data/
│   ├── user-data.ts
│   ├── appointment-data.ts
├── utilities/
│   ├── assertions.ts
│   ├── constants.ts
│   ├── logging.ts
│   ├── logger.ts
├── tests/
│   ├── test-login.spec.ts
│   ├── test-appointment.spec.ts
├── translations/
│   ├── translations.ts
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── README.md
```

📑 Folder Responsibilities

| Folder / File              | Responsibility                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **`locators/`**            | Centralized locators for each page. Uses role-based locators for reliability.                                         |
| **`pages/`**               | Page Object Models (POM). `base-page.ts` for fixtures, `common-page.ts` for shared methods, `ui/` for specific pages. |
| **`models/`**              | TypeScript interfaces defining input/output data structures.                                                          |
| **`data/`**                | Static test data (e.g., users, appointments).                                                                         |
| **`utilities/`**           | Helper classes like `assertions.ts`, `constants.ts`, `logging.ts`, `logger.ts`.                                       |
| **`tests/`**               | Test files (`.spec.ts`) organized by feature/module.                                                                  |
| **`translations/`**        | Language-specific text for multi-language/i18n support.                                                               |
| **`playwright.config.ts`** | Global Playwright configuration (browsers, retries, reporters, etc.).                                                 |
| **`package.json`**         | Node.js dependencies, scripts, and project metadata.                                                                  |
| **`tsconfig.json`**        | TypeScript compiler configuration.                                                                                    |
| **`README.md`**            | Project documentation and onboarding guide.                                                                           |

# Example TypeScript Interfaces and Data
// models/user.ts
```TypeScript
export interface User {
    username: string;
    password: string;
}
```

// models/appointment.ts
```TypeScript
export interface Appointment {
    date: string;
    time: string;
    patientName: string;
    doctor: string;
    notes?: string;
}
```

// data/user-data.ts
```TypeScript
import { User } from '@models/user';


export const validUser: User = {
    username: 'John Doe',
    password: 'ThisIsAPassword',
};
```

// data/appointment-data.ts
```TypeScript
import { Appointment } from '@models/appointment';

export const validAppointment: Appointment = {
    facility: 'Tokyo CURA Healthcare Center',
    applyForHospitalReadmission: true,
    healthcareProgram: 'Medicare',
    visitDate: '15/09/2025',
    comment: 'Regular checkup and consultation'
};
```

# Example Locators
// locators/login-locators.ts
```TypeScript
import { Page, Locator } from '@playwright/test';
import { CommonLocators } from './common-locators';
import { TRANSLATIONS } from '@translations/translations';
import { Constants } from '@utilities/constants';

export class LoginLocators extends CommonLocators {
    constructor(page: Page) {
        super(page);
        this.initializeLocators();
    }

    protected initializeLocators(): void {
        super.initializeLocators();

        // Inputs
        this.inputUsername = this.page.locator('input[name="username"]');
        this.inputPassword = this.page.locator('input[name="password"]');

        // Navigation & buttons
        this.btnAppointment = this.page.getByRole('link', { name: 'Make Appointment' });
        this.menuToggle = this.page.locator('#menu-toggle');
        this.btnLogin = this.roleButtonName(TRANSLATIONS.labels[Constants.LANGUAGE].lblLogin);
        this.btnLogout = this.text(TRANSLATIONS.labels[Constants.LANGUAGE].lblLogout);
        this.btnSignIn = this.roleButtonName(TRANSLATIONS.labels[Constants.LANGUAGE].lblSignIn);
    }

    // Inputs
    inputUsername!: Locator;
    inputPassword!: Locator;

    // Actions
    btnAppointment!: Locator;
    btnSignIn!: Locator;
    btnLogin!: Locator;
    btnLogout!: Locator;

    // Misc
    menuToggle!: Locator;
}
```

# Example Pages
// page/login-locpageators.ts
```TypeScript
import { Page } from '@playwright/test';
import { LoginLocators } from '@locators/login-locators';
import { CommonPage } from '@common-page';
import { step } from '@utilities/logging';
import { assertHelper } from '@utilities/assertions';
import { User } from '@models/user';

export class LoginPage extends LoginLocators {
  commonPage: CommonPage;

  constructor(page: Page) {
    super(page); // initializes locators
    this.commonPage = new CommonPage(page); // shared helper for common actions
  }

  /**
     * Navigate to URL
     * @param url
     */
    @step('Navigate to URL')
    async navigate(url: string = this.baseURL): Promise<void> {
        await this.commonPage.navigate(url);
    }

  /**
   * Perform login
   * @param user User model containing credentials
   */
  @step('Login with username and password')
  async login(user: User): Promise<void> {
    await this.commonPage.fill(this.inputUsername, user.username);
    await this.commonPage.fill(this.inputPassword, user.password);
    await this.commonPage.click(this.btnLogin);
  }

  /**
   * Logout from application
   */
  @step('Logout from the application')
  async logout(): Promise<void> {
    await this.commonPage.click(this.menuToggle);
    await this.commonPage.click(this.btnLogout);
  }
}
```

# Example Pages

// pages/ui/appointment-page.ts
```TypeScript
import { Page } from '@playwright/test';
import { AppointmentLocators } from '@locators/appointment-locators';
import { CommonPage } from '@common-page';
import { step } from '@utilities/logging';
import { assertHelper } from '@utilities/assertions';
import { Appointment } from '@models/appointment';

export class AppointmentPage extends AppointmentLocators {

  commonPage: CommonPage;

  constructor(page: Page) {
    super(page); // initializes locators
    this.commonPage = new CommonPage(page); // shared helper for common actions
  }

  /**
   * Navigate to Appointment Page
   */
  @step('Navigate to Appointment Page')
  async goto(): Promise<void> {
    await this.commonPage.navigate('/appointments');
    await assertHelper.toBeVisible(this.btnCreateAppointment);
  }

  /**
   * Create a new appointment
   * @param appointment Appointment model containing details
   */
  @step('Create Appointment')
  async createAppointment(appointment: Appointment): Promise<void> {
    await this.commonPage.click(this.btnCreateAppointment);
    await this.commonPage.fill(this.inputDate, appointment.date);
    await this.commonPage.fill(this.inputTime, appointment.time);
    await this.commonPage.fill(this.inputPatientName, appointment.patientName);
    await this.commonPage.fill(this.inputDoctor, appointment.doctor);
    if (appointment.notes) {
      await this.commonPage.fill(this.inputNotes, appointment.notes);
    }
    await this.commonPage.click(this.btnSaveAppointment);

    // Verify appointment success
    await assertHelper.toBeVisible(this.successMessage);
  }

  /**
   * Search for an appointment by patient name
   * @param patientName
   */
  @step('Search Appointment')
  async searchAppointment(patientName: string): Promise<void> {
    await this.commonPage.fill(this.inputSearchPatient, patientName);
    await this.commonPage.click(this.btnSearch);
    await assertHelper.toBeVisible(this.searchResultRow);
  }
}
```

# Example Tests

// tests/test-login.spec.ts
```TypeScript
import { test } from '@pages/base-page';
import { validUser } from '@data/user-data';
import { AssertHelper } from '@utilities/assertions';

const assertHelper = new AssertHelper();

test.describe('Login Tests', () => {
  test('should login successfully with valid credentials',
  {
    tag: ['@smoke-test']
  }, async ({ loginPage }) => {
    // Navigate to login page
    await loginPage.navigate();

    // Perform login
    await loginPage.login(validUser);

    // Verify successful login (logout button is visible)
    await assertHelper.toBeVisible(loginPage.btnLogout);
  });
});
```

// tests/test-appointment.spec.ts
```TypeScript
import { test } from '@pages/base-page';
import { validUser } from '@data/user-data';
import { validAppointment } from '@data/appointment-data';
import { assertHelper } from '@utilities/assertions';

const assertHelper = new AssertHelper();

test.describe('Appointment Management', () => {

  test('should create a new appointment successfully', async ({ loginPage, appointmentPage }) => {
    // Login first
    await loginPage.navigate();
    await loginPage.login(validUser);

    // Navigate to Appointment page
    await appointmentPage.goto();

    // Create new appointment
    await appointmentPage.createAppointment(validAppointment);

    // Verify appointment created successfully
    await assertHelper.toBeVisible(appointmentPage.successMessage);
  });

  test('should search for an existing appointment', async ({ loginPage, appointmentPage }) => {
    // Login first
    await loginPage.navigate();
    await loginPage.login(validUser);

    // Search for the appointment
    await appointmentPage.searchAppointment(validAppointment.patientName);

    // Verify search result
    await assertHelper.toBeVisible(appointmentPage.searchResultRow);
  });
});
```

---------

# Coding Standards
- Use **TypeScript** for type safety.  
- Follow **Playwright best practices** (e.g., role-based locators, Page Object Model).  
- Write **clear, maintainable code** with meaningful comments.  
- Use **async/await** for asynchronous operations.  
- Apply consistent naming conventions:  
  - `camelCase` → variables, functions  
  - `PascalCase` → classes, interfaces  
  - `UPPER_CASE` → constants  
- Modularize code to **promote reusability**.  
- Adhere to **DRY (Don’t Repeat Yourself)** principles.  
- Enforce linting & formatting with **ESLint + Prettier**.  
- Commit messages must be **clear and descriptive**.  
- Tests should be **readable, maintainable, and meaningful**.  
- Use **descriptive test names** that convey intent.  

---

# Testing Guidelines
- Each test must be **independent and idempotent**.  
- Ensure tests are **reliable, not flaky**.  
- Use **fixtures** for setup/teardown.  
- Validate both **UI elements** and **backend responses**.  
- Organize tests by **features and scenarios**.  
- Tag tests (`@smoke`, `@regression`, etc.) for selective execution.  

---

# Documentation
- Keep an **up-to-date README** with setup & usage instructions.  
- Document **complex logic** and design decisions in code comments.  
- Maintain a **CHANGELOG** for significant updates.  
- Use **JSDoc** for functions, classes, and utilities.  
- Ensure **documentation matches code** (sync regularly).  
- Provide **examples** for common tasks and usage.  
- Add **troubleshooting tips & FAQs**.  
- Maintain **test case documentation** with scenarios & expected outcomes.  

---

# Version Control
- Use **Git** with meaningful commit messages.  
- Follow a **branching strategy** (e.g., GitFlow, feature branches).  
- Merge changes **frequently** to avoid conflicts.  
- **Tag releases** for traceability.  
- Use **Pull Requests** for reviews before merging.  

---

# Review Process
- All code must undergo **peer review** via Pull Requests.  
- Use **automated static analysis** (SonarQube, ESLint) for quality checks.  
- Verify **test coverage** before merging.  
- Maintain a **review checklist** for consistency.  
- Encourage **constructive feedback** and **knowledge sharing**.  

---

# Continuous Integration (CI)
- Integrate with CI tools (e.g., **GitHub Actions**, **Azure DevOps Pipelines**).  
- Run automated **tests on pull requests and merges**.  
- Ensure **tests pass before merging**.  
- Enforce coding standards and run **linters in CI**.  
- Monitor pipelines and resolve **failures promptly**.  

---

# Maintenance
- Regularly **update dependencies** (npm packages, Playwright, etc.).  
- **Refactor** code for performance & readability.  
- Review test cases for **ongoing relevance**.  
- Archive or remove **obsolete tests**.  
- Track **technical debt** and address it proactively.  

---

# Ignore
- Do **not commit sensitive information** (passwords, API keys, tokens).  
- Avoid hardcoding values → use **environment variables** or config files.  
- Do not commit **large generated files** (test results, screenshots).  
- Add proper entries in **.gitignore** for logs, cache, temp files.  
