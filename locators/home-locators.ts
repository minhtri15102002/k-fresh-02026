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
    btnWishlistInToast!: Locator;
    btnViewCartInToast!: Locator;
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
    btnAddToCartByProductName!: (productName: string) => Locator;
    addToCart!: Locator;
    btnMyAccount!: Locator;
    lnkRegister!: Locator;
    ddlMyAccount!: Locator;
    lnkMyAccountLogin!: Locator;
    override locatorInitialization(): void {
        super.locatorInitialization();
        this.iconWishList = this.page.locator("//a[@aria-label='Wishlist']");
        this.btnWishlistInToast = this.page.locator("(//div[@id='notification-box-top']//a[contains(@href,'wishlist')])[2]");
        this.divSuccessAlert = this.page.locator("//div[@id='notification-box-top']//*[@role='alert']");
        this.spanSuccessAlertMessage = this.page.locator("//div[@id='notification-box-top']//div[contains(@class,'toast-body')]");
        // The toast that appears after `hoverAndAddToCart` on the homepage exposes
        // a "View Cart" link distinct from the "Wishlist" link. Match it inside
        // the notification container so we don't accidentally pick up the cart
        // dropdown's own View Cart link in the header.
        this.btnViewCartInToast = this.page.locator(
            "//div[@id='notification-box-top']//a[normalize-space()='View Cart']",
        );
        this.lblProductCards  = (index: number): Locator => this.page.locator(`(//div[contains(@class,'product-thumb')])[${index + 1}]`);
        this.lnkProductName   = (index: number): Locator => this.page.locator(`(//div[contains(@class,'product-thumb')])[${index + 1}]//h4//a`);
        this.btnAddToWishlist = (index: number): Locator => this.page.locator(`(//div[contains(@class,'product-thumb')])[${index + 1}]//button[contains(@onclick,'wishlist.add')]`);
        this.btnMyAccount = this.page.getByRole('button', { name: /My account/i }).first();
        this.lnkRegister = this.page.getByRole('link', { name: 'Register' }).first();
        this.productLink = (productName: string): Locator =>
            this.page.locator('h4 a[href*="route=product/product"]', {
                hasText: productName,
            }).first();
        this.productCard = (productName: string): Locator =>
            this.page.locator('.product-thumb').filter({
                has: this.productLink(productName),
            }).first();
        this.productName = {
            productNameLink: (name: string) => `//a[contains(text(),"${name}")]`
        };
        this.btnAddToCart = this.page.locator('button[title="Add to Cart"]');
        this.btnAddToCartByProductName = (productName: string): Locator =>
            this.productCard(productName).locator('button[title="Add to Cart"]');

        this.menuLink = (menuName: string): Locator =>
            this.page.locator('nav').locator(`a:has-text("${menuName}")`);
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
