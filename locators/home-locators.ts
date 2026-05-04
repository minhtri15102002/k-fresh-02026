import { Locator, Page } from '@playwright/test';
import { CommonLocators } from '@locators/common-locators';

export class HomeLocators extends CommonLocators {
    constructor(page: Page) {
        super(page);
        this.locatorInitialization();
    }
    shopByCategoryMenu!: Locator;
    itemTopCategory!: (itemName: string) => Locator;
    iconWishList!: Locator;
    divSuccessAlert!: Locator;
    spanSuccessAlertMessage!: Locator;
    btnWishlistInToast!: Locator
    lblProductCards!: (index: number) => Locator;
    lnkProductName!: (index: number) => Locator;
    btnAddToWishlist!: (index: number) => Locator;
    productLink!: (productName: string) => Locator;
    productCard!: (productName: string) => Locator;
    productName!: {
        productNameLink: (name: string) => string;
    };
    btnCategory!: Locator;
    menuLink!: (menuName: string) => Locator;
    btnAddToCart!: Locator;
    addToCart!: Locator;
    btnMyAccount!: Locator;
    lnkRegister!: Locator;

    locatorsInitialization(): void {
    ddlMyAccount!: Locator;
    lnkMyAccountLogin!: Locator;
    locatorInitialization() {
        super.locatorInitialization();
        this.iconWishList = this.page.locator("//a[@aria-label='Wishlist']");
        this.btnWishlistInToast = this.page.locator("(//div[@id='notification-box-top']//a[contains(@href,'wishlist')])[2]");
        this.divSuccessAlert = this.page.locator("//div[@id='notification-box-top']//*[@role='alert']");
        this.spanSuccessAlertMessage = this.page.locator("//div[@id='notification-box-top']//div[contains(@class,'toast-body')]");
        this.lblProductCards = (index: number) => this.page.locator(`(//div[contains(@class,'product-thumb')])[${index + 1}]`);
        this.lnkProductName = (index: number) => this.page.locator(`(//div[contains(@class,'product-thumb')])[${index + 1}]//h4//a`);
        this.btnAddToWishlist = (index: number) => this.page.locator(`(//div[contains(@class,'product-thumb')])[${index + 1}]//button[contains(@onclick,'wishlist.add')]`);
        this.btnMyAccount = this.page.getByRole('button', { name: /My account/i }).first();
        this.lnkRegister = this.page.getByRole('link', { name: 'Register' }).first();
        this.productLink = (productName: string) =>
            this.page.locator(`h4 a[href*="route=product/product"]`, {
                hasText: productName,
            }).first();
        this.productCard = (productName: string) =>
            this.page.locator(".product-thumb").filter({
                has: this.productLink(productName),
            }).first();
        this.productName = {
            productNameLink: (name: string) => `//a[contains(text(),"${name}")]`
        };
        this.btnAddToCart = this.page.locator('button[title="Add to Cart"]');
        this.menuLink = (menuName: string) => this.page.locator('nav').locator(`a:has-text("${menuName}")`);
        this.menuLink = (menuName: string) => this.page.locator('nav').locator(`a:has-text("${menuName}")`);
        this.btnMyAccount = this.page.getByRole('button', { name: /My account/i }).first();
        this.lnkRegister = this.page.getByRole('link', { name: 'Register' }).first();
    }
    getProductCard(productName: string): Locator {
        return this.page.locator('.product-thumb').filter({
            has: this.productLink(productName),
        }).first();
    }
    getAddToCartButton(productName: string): Locator {
        return this.getProductCard(productName)
            .locator('button[title="Add to Cart"]');
    }
}
