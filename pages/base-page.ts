import { test as baseTest, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LoginPage } from './ui/login-page';
import { CommonPage } from './common-page';
import { AddressBookPage } from './ui/address-book-page';
import { CheckoutPage } from './ui/checkout-page';
import { CompareProductsPage } from './ui/compare-products-page';
import { HomePage } from './ui/home-page';
import { CartPage } from './ui/cart-page';
import { MyOrdersPage } from './ui/my-orders-page';
import { ProductPage } from './ui/product-page';
import { ProfilePage } from './ui/profile-page';
import { RegisterPage } from './ui/register-page';
import { WishListPage } from './ui/wish-list-page';
import { APIPage } from './api/api-page';
import { AssertHelper } from '@utilities/assert-helper';

export const test = baseTest.extend<{
    loginPage: LoginPage;
    commonPage: CommonPage;
    addressBookPage: AddressBookPage;
    cartPage: CartPage;
    checkoutPage: CheckoutPage;
    compareProductsPage: CompareProductsPage;
    homePage: HomePage;
    myOrdersPage: MyOrdersPage;
    productPage: ProductPage;
    profilePage: ProfilePage;
    registerPage: RegisterPage;
    wishlistPage: WishListPage;
    apiPage: APIPage;
    assertHelper: AssertHelper;
}>({
    loginPage: async ({ page, context }, use) => {
        const instance = new LoginPage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage);
        });
        await use(instance);
    },
    commonPage: async ({ page, context }, use) => {
        const instance = new CommonPage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage);
        });
        await use(instance);
    },
    addressBookPage: async ({ page, context }, use) => {
        const instance = new AddressBookPage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage);
        });
        await use(instance);
    },
    cartPage: async ({ page, context }, use) => {
        const instance = new CartPage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage);
        });
        await use(instance);
    },
    checkoutPage: async ({ page, context }, use) => {
        const instance = new CheckoutPage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage);
        });
        await use(instance);
    },
    compareProductsPage: async ({ page, context }, use) => {
        const instance = new CompareProductsPage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage);
        });
        await use(instance);
    },
    homePage: async ({ page, context }, use) => {
        const instance = new HomePage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage);
        });
        await use(instance);
    },
    myOrdersPage: async ({ page, context }, use) => {
        const instance = new MyOrdersPage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage);
        });
        await use(instance);
    },
    productPage: async ({ page, context }, use) => {
        const instance = new ProductPage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage);
        });
        await use(instance);
    },
    profilePage: async ({ page, context }, use) => {
        const instance = new ProfilePage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage);
        });
        await use(instance);
    },
    registerPage: async ({ page, context }, use) => {
        const instance = new RegisterPage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage);
        });
        await use(instance);
    },
    wishlistPage: async ({ page, context }, use) => {
        const instance = new WishListPage(page);
        context.on('page', (newPage: Page) => {
            instance.setPage(newPage);
        });
        await use(instance);
    },
    apiPage: async ({ request }, use) => {
        const instance = new APIPage(request);
        await use(instance);
    },
    // eslint-disable-next-line no-empty-pattern
    assertHelper: async ({ }, use) => {
        const instance = new AssertHelper();
        await use(instance);
    },
});

// ─── Tag bridge + guardrail ──────────────────────────────────────────────────
// Convention lives in `prompts/core/test-tags.md`:
//   • Every test MUST carry one priority tag (@P1|@P2|@P3) and one severity
//     tag (@critical|@major|@minor|@trivial).
//   • Tags also flow into Allure (severity column + custom "priority" label
//     + feature/story labels) so the same declaration drives both reports.
//
// Set STRICT_TAGS=false locally to downgrade the missing-tag error to a warning.
const PRIORITY_TAG = /^@P[1-3]$/;
const SEVERITY_TAG = /^@(critical|major|minor|trivial)$/;
const FEATURE_TAGS = new Set([
    '@auth', '@cart', '@checkout', '@profile',
    '@product', '@compare', '@wishlist', '@home',
    '@security',
]);

// eslint-disable-next-line no-empty-pattern -- intentionally no fixtures, only testInfo
test.beforeEach(async ({}, testInfo) => {
    const tags = testInfo.tags ?? [];
    const priority = tags.find((t) => PRIORITY_TAG.test(t));
    const severity = tags.find((t) => SEVERITY_TAG.test(t));
    const feature  = tags.find((t) => FEATURE_TAGS.has(t));

    const missing = [
        priority ? null : '@P1|@P2|@P3',
        severity ? null : '@critical|@major|@minor|@trivial',
    ].filter(Boolean).join(' and ');

    if (missing) {
        const message =
            `Test "${testInfo.title}" is missing required tag(s): ${missing}. ` +
            'See prompts/core/test-tags.md.';
        if (process.env['STRICT_TAGS'] === 'false') {
            console.warn(`⚠️  ${message}`);
        } else {
            throw new Error(`${message} (set STRICT_TAGS=false to bypass locally)`);
        }
    }

    if (severity) await allure.severity(severity.slice(1));
    if (priority) await allure.label('priority', priority.slice(1));
    if (feature)  await allure.feature(feature.slice(1));
});
