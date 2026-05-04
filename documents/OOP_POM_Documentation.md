# OOP Structure & Page Object Model (POM) — Current Playwright Project

---

## 1. Architecture Overview

### Applied Pattern

The project applies the **Page Object Model (POM)** — a design pattern that fully separates **test scenarios** (test scripts) from **UI interaction logic**.

Beyond a standard POM, the project further separates **Locators** into their own dedicated classes, resulting in **3 clear layers**:

```
[Locator Class]  →  [Page Class]  →  [Test Spec]
(defines              (encapsulates     (test scenarios
 elements)             UI behaviour)     & assertions)
```

### Overall Dependency Flow

From a high-level OOP perspective, the project follows this dependency direction:

```
Test Spec
  └── Page Object  ──→  Locator Class  ──→  Playwright API
        └──→  Test Data / Model
        └──→  Utilities (CommonPage, AssertHelper, Constants, Logger)
```

- **Test Spec** only knows about Page Objects — it never calls Playwright directly.
- **Page Objects** depend on Locator Classes (via inheritance) and Utilities (via composition).
- **Locator Classes** depend only on the Playwright `Locator` / `Page` API.
- **Models & Data** feed typed data objects into Page Object methods.
- **Utilities** provide cross-cutting concerns (actions, assertions, constants, logging).

### Basic Flow

1. **Test Spec** (`tests/ui/*.spec.ts`) imports `test` from `pages/base-page.ts`.
2. **`base-page.ts`** uses `test.extend()` to inject all Page Objects as fixtures — each test receives pre-initialised page objects via destructuring.
3. **Page Class** (e.g. `ProductPage`) extends the corresponding **Locator Class** (`ProductLocators`) and uses the declared locators to perform UI actions through `CommonPage`.
4. **Locator Class** extends `CommonLocators` — the root class that holds all shared locators and element-finding utility methods.
5. **Assertions** are only performed inside test files, or through `AssertHelper` when verifying complex UI state within a page workflow.

**Inheritance chain:**

```
CommonLocators
    └── [Feature]Locators   (e.g. ProductLocators, LoginLocators)
              └── [Feature]Page   (e.g. ProductPage, LoginPage)

CommonLocators
    └── CommonPage          (shared UI action library)
```

---

## 2. OOP Analysis

This section evaluates how the four core OOP principles are applied in the project, along with additional design patterns observed in the codebase.

### 2.1 The Four OOP Principles

#### ① Encapsulation

**Definition:** Hide internal implementation details and expose only what is necessary through a well-defined interface.

**How the project applies it:**

| What is encapsulated | Where |
|---|---|
| Element selectors (XPath, CSS, Semantic) | Locator Classes (`locators/*.ts`) — tests never write selectors |
| UI interactions (click, fill, hover…) | `CommonPage` — all browser actions go through one place |
| Page-level workflows | Feature Page Classes (`LoginPage`, `ProductPage`…) |
| Page initialisation & tab-switching logic | `CommonLocators.setPage()` + `locatorInitialization()` |
| Folder-level separation of concerns | `pages/`, `locators/`, `models/`, `data/`, `utilities/` |

**Code example:**
```typescript
// The test calls only one high-level Page Object method.
// LoginPage hides all internal details such as locators, fill actions, and click actions.
await loginPage.login(user);
// Anti-pattern:
// The test directly accesses selectors and performs low-level UI actions.
// This exposes implementation details and makes the test tightly coupled to the UI.
await page.locator('//input[@name="email"]').fill(user.email);
await page.locator('//input[@name="password"]').fill(user.password);
await page.locator('//input[@type="submit"]').click();
```

---

#### ② Abstraction

**Definition:** Model real-world concepts as clean interfaces/types and expose meaningful method names that hide complexity.

**How the project applies it:**

| Abstraction | Detail |
|---|---|
| **Typed data models** | `User`, `UserProfile`, `Product`, `Address`, `Order` interfaces in `models/` |
| **Object-as-parameter methods** | `login(user: UserProfile)` instead of `login(email, password, firstName, ...)` |
| **Business-readable method names** | `fillRegistrationForm()`, `clickProductLink()`, `addProductsToCompare()` |
| **Test reads like a business flow** | `registerPage.fillRegistrationForm(user)` → `registerPage.submitRegistrationForm()` |

**Code example:**
```typescript
// UserProfile abstracts user data into one typed object
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  password: string;
}

// login(user) abstracts the login flow behind one business-level method
async login(user: UserProfile): Promise<void> { ... }

// Test calls one clear business action instead of multiple UI steps
await loginPage.login(user);
```

---

#### ③ Inheritance

**Definition:** A child class reuses and extends the behaviour of a parent class.

**How the project applies it:**

```
CommonLocators          ← root: page reference, shared locators, helper finders
    └── LoginLocators   ← adds: inputEmail, inputPassword, flashMessage
    └── ProductLocators ← adds: lblProductTitle, btnCompare, toastMessage...
    └── CommonPage      ← adds: all UI action methods (click, fill, hover...)
          └── (used via composition in Page Classes)

LoginLocators
    └── LoginPage       ← adds: login(), expectSuccessfulLogin()

ProductLocators
    └── ProductPage     ← adds: openProductDetail(), addProductsToCompare()...
```

**Benefit:** Every Page Class automatically inherits all shared locators (`btnSubmit`, `btnContinue`, etc.) and helper methods (`locatorByXpath()`, `roleButtonName()`…) without repeating code.

---

#### ④ Polymorphism

**Definition:** The same method name behaves differently depending on the actual (runtime) class.

**How the project applies it:**

The key example is **method overriding** of `locatorInitialization()`:

```typescript
// CommonLocators — parent class
locatorInitialization(): void {
  this.btnSubmit = this.page.locator('//input[@type="submit"]');
  // ... shared locators
}
```

Then child classes such as `ProductLocators` and `LoginLocators` define the same method name, `locatorInitialization()`, but each class initializes different page-specific locators. `ProductLocators` extends `CommonLocators`, calls `super.locatorInitialization()` first, and then adds product-specific locators such as `lblProductTitle`, `lblProductPrice`, `btnBuyNow`, `btnAddCart`, and `btnCompare`.

```typescript
// ProductLocators — child class
locatorInitialization(): void {
  super.locatorInitialization(); // initialize shared locators first

  this.lblProductTitle = this.page.locator('h1').first();
  this.btnCompare = (productName: string): Locator =>
    this.productThumbnaiByName(productName).getByTitle('Compare this Product');
}
```

`LoginLocators` also extends `CommonLocators` and overrides `locatorInitialization()`, but it initializes login-specific locators such as `inputEmail`, `inputPassword`, `btnSubmit`, and `flashMessage`.

```typescript
// LoginLocators — another child class
locatorInitialization(): void {
  super.locatorInitialization(); // initialize shared locators first

  this.inputEmail = this.page.locator('//input[@name="email"]');
  this.inputPassword = this.page.locator('//input[@name="password"]');
  this.btnSubmit = this.page.locator('//input[@type="submit"]');
}
```

**Runtime behaviour:** When `setPage(newPage)` is called on any page object, it internally calls `this.locatorInitialization()`. Thanks to JavaScript's prototype chain, the **correct child-class override** is executed automatically — not the base version. This is runtime polymorphism in action.

```typescript
// CommonLocators
setPage(page: Page): void {
    this.page = page;
    this.locatorInitialization(); // ← calls the child's version at runtime
}
```

---

### 2.2 Additional Design Principles

#### Composition over Inheritance (where appropriate)

Instead of inheriting `CommonPage` (which would create an overly deep hierarchy), Page Classes **compose** it as a member:

```typescript
// pages/login-page.ts
export class LoginPage extends LoginLocators {
    commonPage: CommonPage;    // ← Composition

    constructor(page: Page) {
        super(page);
        this.commonPage = new CommonPage(page); // inject shared action lib
    }

    // Public method for tests to call — no locators exposed
    async login(user: UserProfile): Promise<void> {
        await this.commonPage.fill(this.inputEmail, user.email);     // reuse
        await this.commonPage.fill(this.inputPassword, user.password);
        await this.commonPage.click(this.btnSubmit);
    }
}
```

Similarly, `AssertHelper` is composed into Page Classes that need complex assertions:
```typescript
export class ProductPage extends ProductLocators {
    commonPage:   CommonPage;    // UI actions
    assertHelper: AssertHelper;  // complex assertions
    ...
}
```

**Why composition here?** `CommonPage` and `AssertHelper` are *capabilities* that many pages share — composition lets each Page Class opt in without forcing an additional inheritance level.

---

#### Page Object Model — Design Pattern

The POM pattern is the overarching design applied across the entire project:

| Role | Responsibility | Files |
|---|---|---|
| **Locator Layer** | Declare & initialise element selectors | `locators/*.ts` |
| **Page Object Layer** | Encapsulate page-level UI workflows | `pages/*.ts` |
| **Fixture Hub** | Inject Page Objects into every test automatically | `pages/base-page.ts` |
| **Test Layer** | Define test scenarios and assertions only | `tests/ui/*.spec.ts` |

`base-page.ts` uses Playwright's `test.extend()` to register all page objects as fixtures, meaning each test automatically receives `loginPage`, `commonPage`, `cartPage`, `productPage`, `profilePage`, `registerPage`, `wishlistPage`, and more — without manual instantiation in every test file.

```typescript
// base-page.ts injects all page objects
export const test = baseTest.extend<{
    loginPage:          LoginPage;
    commonPage:         CommonPage;
    cartPage:           CartPage;
    productPage:        ProductPage;
    profilePage:        ProfilePage;
    registerPage:       RegisterPage;
    wishlistPage:       WishListPage;
    checkoutPage:       CheckoutPage;
    compareProductsPage: CompareProductsPage;
    // ...
}>({
    loginPage: async ({ page, context }, use) => {
        const instance = new LoginPage(page);
        context.on('page', newPage => instance.setPage(newPage));
        await use(instance);
    },
    // ... same pattern for each page
});
```

---

### 2.3 Summary Table

| Principle / Pattern | Applied | Key Evidence |
|---|---|---|
| **Encapsulation** | ✅ | Selectors hidden in Locator Classes; actions hidden in Page Classes |
| **Abstraction** | ✅ | Typed models (`User`, `Product`); business-readable method names |
| **Inheritance** | ✅ | `[Feature]Locators extends CommonLocators` → `[Feature]Page extends [Feature]Locators` |
| **Polymorphism** | ✅ | `locatorInitialization()` overridden per class; `setPage()` dispatches to child at runtime |
| **Composition** | ✅ | `CommonPage` and `AssertHelper` injected into Page Classes as members |
| **Page Object Model** | ✅ | Full 3-layer separation: Locator → Page → Test; fixture injection via `base-page.ts` |

---

## 3. Directory Structure

```
k-fresh-02026/
│
├── 📁 locators/                   # Layer 1: Locator declarations (element selectors)
│   ├── common-locators.ts         # Root class: shared locators & element-finding helpers
│   ├── login-locators.ts
│   ├── product-locators.ts
│   ├── register-locators.ts
│   ├── cart-locators.ts
│   ├── checkout-locators.ts
│   ├── compare-products-locators.ts
│   ├── home-locators.ts
│   ├── address-book-locators.ts
│   ├── wish-list-locators.ts
│   ├── my-orders-locators.ts
│   └── profile-locators.ts
│
├── 📁 pages/                      # Layer 2: Page Classes (UI behaviour)
│   ├── base-page.ts               # Fixture hub: registers all page objects
│   ├── common-page.ts             # Shared UI action library
│   ├── assert-helper-page.ts      # Assertion helper for Page Classes
│   ├── login-page.ts
│   ├── product-page.ts
│   ├── register-page.ts
│   ├── cart-page.ts
│   ├── checkout-page.ts
│   ├── compare-products-page.ts
│   ├── home-page.ts
│   ├── address-book-page.ts
│   ├── wish-list-page.ts
│   ├── my-orders-page.ts
│   └── profile-page.ts
│
├── 📁 tests/
│   └── 📁 ui/                     # Layer 3: Test Specs (test scenarios)
│       ├── test-login.spec.ts
│       ├── test-product.spec.ts
│       ├── test-register.spec.ts
│       ├── test-cart.spec.ts
│       ├── test-checkout.spec.ts
│       ├── test-compare-products.spec.ts
│       ├── test-address-book.spec.ts
│       ├── test-wish-list.spec.ts
│       ├── test-my-orders.spec.ts
│       ├── test-profile.spec.ts
│       ├── test-home.spec.ts
│       └── test-e2e.spec.ts
│
├── 📁 models/                     # TypeScript interfaces / data types
│   ├── user.ts                    # interface User, UserProfile
│   ├── product.ts
│   ├── order.ts
│   ├── address.ts
│   ├── action-type.ts
│   └── index.ts
│
├── 📁 data/                       # Test data & data helpers
│   ├── login.data.ts
│   ├── user-data.ts
│   ├── products.data.ts
│   ├── messages.data.ts
│   ├── checkout-data.ts
│   ├── product.helper.ts
│   ├── data-loader.ts
│   └── users.json
│
├── 📁 utilities/                  # Shared utilities
│   ├── constants.ts               # Constants: URLs, timeouts, env vars
│   ├── assertions.ts              # Static assertion helpers
│   ├── utility.ts                 # General utility functions
│   ├── logging.ts                 # @step() decorator
│   └── logger.ts
│
├── playwright.config.ts
├── env.loader.ts
├── tsconfig.json
└── package.json
```

---

## 4. Core Classes Breakdown

### 4.1 `CommonLocators` — Root Class (file: `locators/common-locators.ts`)

This is the **base class** of the entire inheritance chain. Every Locator Class and `CommonPage` extends from it.

**Responsibilities:**
- Stores the Playwright `page: Page` reference.
- Declares shared locators: `btnSubmit`, `btnContinue`, `btnSave`, `inputSearch`, etc.
- Provides `locatorInitialization()` to re-initialise all locators (supports multi-tab via `setPage()`).
- Provides element-finding helpers: `locatorByXpath()`, `text()`, `roleLinkName()`, `roleButtonName()`, `label()`, etc.

```typescript
// locators/common-locators.ts
export class CommonLocators {
    page: Page;

    constructor(page: Page) {
        this.page = page;
        this.locatorInitialization();
    }

    /**
     * Updates the current Page context and refreshes locator definitions.
     * Essential for handling multi-tab scenarios or popups during a test flow.
     */
        setPage(page: Page): void {
        this.page = page;
        this.locatorInitialization();
    }

    btnSubmit!: Locator;
    btnContinue!: Locator;
    // ... other shared locators

    locatorInitialization(): void {
        this.btnSubmit = this.page.locator('//input[@type="submit"]');
        // ...
    }
}
```

**Execution Flow Example (`setPage` polymorphism):**
```text
productPage.setPage(newPage)
  ↓
setPage() from CommonLocators is called
  ↓
this.page = newPage
  ↓
this.locatorInitialization()
  ↓
Because the actual object is ProductPage/ProductLocators
  ↓
ProductLocators.locatorInitialization() is executed
```

### 4.2 `[Feature]Locators` — Locator Class (Encapsulation)

Each page has **its own Locator Class** that extends `CommonLocators` and holds all selectors for that page.

**Locator declaration rules:**
- Declare locators as **class properties** with the `!` suffix (definite assignment assertion).
- Locators are initialised inside `locatorInitialization()`, which must call `super.locatorInitialization()` first.
- **Dynamic locators** (that depend on parameters) are declared as **arrow function properties**.

```typescript
// locators/product-locators.ts
export class ProductLocators extends CommonLocators {
    constructor(page: Page) {
        super(page);
        this.locatorInitialization(); // Call after super()
    }

    // --- Static locators ---
    lblProductTitle!: Locator;
    inputQuantity!:   Locator;
    btnIncreaseQuantity!: Locator;

    // --- Dynamic locators (accept parameters) ---
    btnCompare!: (productName: string) => Locator;
    toastMessage!: (productName: string) => Locator;

    locatorInitialization(): void {
        super.locatorInitialization(); // REQUIRED

        this.lblProductTitle = this.page.locator('h1').first();
        this.btnCompare = (productName: string): Locator =>
            this.productThumbnailByName(productName)
                .getByTitle('Compare this Product');
    }
}
```

### 4.3 `CommonPage` — Shared UI Action Library (file: `pages/common-page.ts`)

Extends `CommonLocators` and acts as the **centralised UI action library** — all browser interactions go through here.

**Key methods:**

| Method | Description |
|---|---|
| `goto(url)` | Navigate to a URL and wait for page load |
| `click(locator)` | Safe click: checks visible + enabled first |
| `fill(locator, value)` | Type a value into an input field |
| `hover(locator)` | Mouse over an element |
| `selectOption(locator, option)` | Select an option from a dropdown |
| `textContent(locator)` | Get the text content of an element |
| `getAttribute(locator, attr)` | Get an attribute value |
| `waitForVisible(locator)` | Wait until an element is visible |
| `waitForPageLoad()` | Wait for the page to fully load |
| `scrollIntoView(locator)` | Scroll an element into the viewport |
| `getAPIResponse(url, method)` | Intercept and return an API response |

### 4.4 `[Feature]Page` — Page Class (Inheritance)

Page Classes extend their corresponding Locator Class and encapsulate **specific UI workflows**.

**Characteristics:**
- Instantiates `CommonPage` in the constructor to perform UI interactions.
- Uses the `@step()` decorator so every method appears as a named step in the test report.
- Calls `AssertHelper` for complex UI assertions within a workflow.

```typescript
// pages/product-page.ts
export class ProductPage extends ProductLocators {
    commonPage: CommonPage;
    assertHelper: AssertHelper;

    constructor(page: Page) {
        super(page);
        this.commonPage   = new CommonPage(page);
        this.assertHelper = new AssertHelper();
    }

    @step('Click product link')
    async clickProductLink(productName: string): Promise<void> {
        await this.commonPage.click(this.getProductLink(productName));
    }
}
```

### 4.5 `base-page.ts` — Fixture Hub (Dependency Injection)

This file is the **fixture registration hub** that uses `test.extend()` to automatically inject all Page Objects into every test. Each fixture also handles switching the `page` reference to a new tab via `context.on('page', ...)`.

```typescript
// pages/base-page.ts
export const test = baseTest.extend<{
    loginPage:   LoginPage;
    productPage: ProductPage;
    // ... all page objects
}>({
    productPage: async ({ page, context }, use) => {
        const instance = new ProductPage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage); // Multi-tab support
        });
        await use(instance);
    },
});
```

> **Important:** Test Specs must import `test` from `pages/base-page.ts` (not from `@playwright/test`) in order to receive the page object fixtures.

---

## 5. Current Coding Conventions

### 5.1 Naming Conventions

**Class names & file names:**

| Type | Rule | Example |
|---|---|---|
| Locator Class | `PascalCase` + suffix `Locators` | `ProductLocators`, `LoginLocators` |
| Page Class | `PascalCase` + suffix `Page` | `ProductPage`, `LoginPage` |
| Locator file | `kebab-case` + `-locators.ts` | `product-locators.ts` |
| Page file | `kebab-case` + `-page.ts` | `product-page.ts` |
| Test file | `test-` + `kebab-case` + `.spec.ts` | `test-product.spec.ts` |

**Locator variable names (prefix convention):**

| Prefix | Element type | Example |
|---|---|---|
| `btn` | Button | `btnSubmit`, `btnAddToCart`, `btnCompare` |
| `input` | Input field | `inputEmail`, `inputPassword`, `inputQuantity` |
| `lbl` | Label / displayed text | `lblProductTitle`, `lblErrorMessage` |
| `lnk` | Link (anchor) | `lnkBrand`, `lnkSizeChart`, `lnkViewCart` |
| `chk` | Checkbox | `chkAgreeTerms`, `chkPrivacyPolicy` |
| `ddl` | Dropdown | `ddlOption`, `ddlOptionItem` |
| `img` | Image | `imgMainProduct`, `imgProduct` |
| `div` | Container / box | `divSuccessAlert`, `divPopupContent` |
| `tbl` | Table | `tblSizeChart` |
| `tab` | Tab navigation | `tabDescription` |
| `box` | Notification box | `boxCompareNotificationTop` |
| `radio` | Radio button | `radioNewsletterYes` |

**Method names (prefix convention):**

| Prefix | Action | Example |
|---|---|---|
| `click...` | Perform a click | `clickProductLink()`, `clickAddToCart()` |
| `fill...` | Enter content | `fillRegistrationForm()` |
| `verify...` | Verify / validate | `verifyFinalQuantityValue()` |
| `expect...` | Assertion workflow | `expectCompareNotificationBox()` |
| `get...` | Retrieve data | `getSuccessMessageText()` |
| `check...` | Check complex functionality | `checkSizeChartFunctionality()` |
| `open...` | Open a page / section | `openProductDetail()` |
| `select...` | Choose an option | `selectNewsletter()` |
| `search...` / `add...` | Search / add | `searchAndSelectProduct()`, `addProductsToCompare()` |
| `perform...` | Execute a composite action | `performActionOnProduct()` |
| `set...` | Set a value | `setQuantity()`, `setPage()` |

### 5.2 Locator Declaration Rules

The project follows this priority order:

1. **XPath** — used most often when a precise selector is needed:
   ```typescript
   this.page.locator('//input[@name="email"]')
   this.page.locator('//h3[@data-update="price"]')
   this.page.locator('//li[span=\'Availability:\']/span[2]')
   ```

2. **CSS with `has-text`** — when matching by text content:
   ```typescript
   this.page.locator('button:has-text("Save")')
   this.page.locator(`a:has-text("${productName}")`)
   ```

3. **Playwright Semantic APIs** — `getByRole`, `getByTitle`, `getByText`, `getByLabel`:
   ```typescript
   this.page.getByRole('alert')
   this.page.getByRole('button', { name: 'Add to Cart' })
   this.page.getByTitle('Compare this Product')
   ```

> `getByTestId` is not used because the website has no `data-testid` attributes.

### 5.3 Assertion Rules (`expect`)

| Rule | Detail |
|---|---|
| **Assertions in Test Spec** | Playwright `expect()` is placed directly inside `.spec.ts` files |
| **Assertions via `AssertHelper`** | Page Classes may call `this.assertHelper.assert...()` for complex UI verifications within a workflow |
| **Static assertions** | Use `Assertions.assertEqual()`, `Assertions.assertTextContains()` from `utilities/assertions.ts` |
| **No raw `expect()` in Page Classes** | The only exception: `CommonPage.click()` calls `expect(target).toBeVisible()` as a safety guard before clicking |

---

## 6. How-to Guide: Adding a New Page & Test

### Step 1: Create a new Locator Class

Create `locators/[feature]-locators.ts`:

```typescript
// locators/wish-list-locators.ts
import { Locator, Page } from '@playwright/test';
import { CommonLocators } from './common-locators';

export class WishListLocators extends CommonLocators {

    constructor(page: Page) {
        super(page);
        this.locatorInitialization(); // Always call after super()
    }

    // --- Static locators ---
    lblPageTitle!: Locator;
    tblWishList!:  Locator;
    btnRemoveItem!: Locator;

    // --- Dynamic locators ---
    btnAddToCartByName!: (productName: string) => Locator;

    locatorInitialization(): void {
        super.locatorInitialization(); // REQUIRED

        this.lblPageTitle  = this.page.locator('h1');
        this.tblWishList   = this.page.locator('//div[@id="wishlist-grid"]');
        this.btnRemoveItem = this.page.locator('//button[contains(@class,"btn-remove")]');

        // Dynamic locator: Finds the 'Add to Cart' button based on the product row
        this.btnAddToCartByName = (productName: string): Locator =>
            this.page.locator(
                `//a[text()="${productName}"]/ancestor::tr//button[contains(@class,"btn-cart")]`
            );
    }
}
```

### Step 2: Create a new Page Class

Create `pages/[feature]-page.ts`:

```typescript
// pages/wish-list-page.ts
import { Page } from '@playwright/test';
import { WishListLocators } from '../locators/wish-list-locators';
import { CommonPage } from './common-page';
import { step } from '../utilities/logging';

export class WishListPage extends WishListLocators {
    commonPage: CommonPage;

    constructor(page: Page) {
        super(page);
        this.commonPage = new CommonPage(page);
    }

    /**
     * Clicks the "Add to Cart" button for a specific product in the wish list.
     * @param productName The product name to add to cart.
     */
    @step('Add product to cart from wish list')
    async addToCartByName(productName: string): Promise<void> {
        await this.commonPage.click(this.btnAddToCartByName(productName));
    }

    /**
     * Removes all items from the wish list.
     */
    @step('Remove all items from wish list')
    async removeAllItems(): Promise<void> {
        const count = await this.commonPage.count(this.btnRemoveItem);
        for (let i = 0; i < count; i++) {
            await this.commonPage.click(this.btnRemoveItem.first());
            await this.commonPage.waitForPageLoad();
        }
    }
}
```

### Step 3: Register the Page Class in the Fixture Hub (`base-page.ts`)

Open `pages/base-page.ts` and add 3 parts:

```typescript
// pages/base-page.ts
import { WishListPage } from './wish-list-page'; // 1. Add import

export const test = baseTest.extend<{
    // ... existing fixtures
    wishlistPage: WishListPage;  // 2. Declare type
}>({
    // ... existing fixtures
    wishlistPage: async ({ page, context }, use) => {  // 3. Define fixture
        const instance = new WishListPage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage);
        });
        await use(instance);
    },
});
```

### Step 4: Create a Test Spec file

Create `tests/ui/test-wish-list.spec.ts`:

```typescript
// tests/ui/test-wish-list.spec.ts

// Import 'test' from base-page — DO NOT import from '@playwright/test'
import { test } from '../../pages/base-page';
import { expect } from '@playwright/test';
import { Constants } from '../../utilities/constants';
import { Assertions } from '../../utilities/assertions';

test.describe('Wish List Tests', () => {

    test.beforeEach(async ({ commonPage }) => {
        await commonPage.goto(Constants.BASE_URL + '/index.php?route=account/wishlist');
    });

    test('TC-WL-001: Verify wish list page loads correctly', async ({
        wishlistPage,
        commonPage,
    }) => {
        // Use shared action library to retrieve text from a specific Page Object locator property
        const title = await commonPage.textContent(wishlistPage.lblPageTitle);

        // Perform assertion in the test spec to ensure clear reporting and separation of concerns
        Assertions.assertTextContains(title, 'My Wish List');
    });

    test('TC-WL-002: Add product from wish list to cart', async ({
        wishlistPage,
    }) => {
        // Execute a high-level workflow method from the Page Class
        await wishlistPage.addToCartByName('MacBook');

        // Directly assert the visibility of a Page Object locator property within the test spec
        await expect(wishlistPage.divSuccessAlert).toBeVisible();
    });

});
```

---

## 7. References

### Official Playwright Documentation

| Topic | Link |
|---|---|
| Page Object Model (POM) | https://playwright.dev/docs/pom |
| Fixtures & `test.extend()` | https://playwright.dev/docs/test-fixtures |
| Locator API | https://playwright.dev/docs/locators |
| Assertions | https://playwright.dev/docs/test-assertions |
| Test Steps (`@step`) | https://playwright.dev/docs/api/class-test#test-step |

### Reference Files in This Project

| Purpose | File |
|---|---|
| Best Locator Class example | `locators/product-locators.ts` |
| Best Page Class example | `pages/product-page.ts` |
| Root class (CommonLocators) | `locators/common-locators.ts` |
| UI action library | `pages/common-page.ts` |
| Fixture hub | `pages/base-page.ts` |
| Most complete Test Spec example | `tests/ui/test-register.spec.ts` |
| Constants & URLs | `utilities/constants.ts` |
| `@step()` decorator | `utilities/logging.ts` |

---
