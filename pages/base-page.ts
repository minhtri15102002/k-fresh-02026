import { test as baseTest, type Page } from '@playwright/test';
import { LoginPage } from '@pages/login-page';
import { CommonPage } from '@pages/common-page';
import { AddressBookPage } from '@pages/address-book-page';
import { CheckoutPage } from '@pages/checkout-page';
import { CompareProductsPage } from '@pages/compare-products-page';
import { HomePage } from '@pages/home-page';
import { CartPage } from '@pages/cart-page';
import { MyOrdersPage } from '@pages/my-orders-page';
import { ProductPage } from '@pages/product-page';
import { ProfilePage } from '@pages/profile-page';
import { RegisterPage } from '@pages/register-page';
import { WishListPage } from '@pages/wish-list-page';

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
});
