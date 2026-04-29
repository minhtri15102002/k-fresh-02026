import { Page } from '@playwright/test';
import { CommonPage } from './common-page';
import { step } from '../utilities/logging';
import { HomeLocators } from '../locators/home-locators';
import { AssertHelper } from './assert-helper-page';

export class HomePage extends HomeLocators {

  commonPage: CommonPage;
  assertHelper: AssertHelper;

  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
    this.assertHelper = new AssertHelper();
  }

  /**
   * Navigates to the homepage URL defined in Constants.
   */
  async goto(): Promise<void> {
    await this.page.goto(Constants.BASE_URL);
  }

  /**
   * Navigate to product category page
   * @param menuName Category name
   */
  @step('Select Menu')
  async selectMenu(menuName: string): Promise<void> {
    await this.commonPage.click(this.shopByCategoryMenu);
    await this.commonPage.waitForVisible(this.itemTopCategory(menuName));
    await this.commonPage.click(this.itemTopCategory(menuName));
  }

  /**
     * Selects a product by its name from the homepage and navigates to the product detail page.
     * @param productName 
     */
  @step('Select product from homepage and open product detail page')
  async selectProduct(productName: string): Promise<void> {
    const product = this.productLink(productName);
    await this.assertHelper.assertElementVisible(product);
    await product.scrollIntoViewIfNeeded();
    await product.click({ force: true });
    await this.page.waitForURL(/route=product\/product|route=product%2Fproduct/);
  }

  /**
   * Hovers over a product card on the homepage and clicks the "Add to Cart" button for that product.
   * @param productName The name of the product to add to cart.
   */
  @step('Hover over product and click Add to Cart')
  async hoverAndAddToCart(productName: string): Promise<void> {
    const productCard = this.productCard(productName);
    await this.commonPage.hover(productCard);
    await this.commonPage.click(this.getAddToCartButton(productName));
  }

   * Navigates directly to the Home Page (Base URL).
   * This is the ONLY place where page.goto() should be used.
   */
  @step('Navigate to Home Page')
  async navigateToHomePage(): Promise<void> {
    await this.commonPage.goto(Constants.BASE_URL);
  }

  /**
   * Navigates to the Register page by clicking through the header menu.
   * Simulates real user interaction (No Deep-Linking).
   */
  @step('Navigate to Register Page via Header Menu')
  async goToRegisterPage(): Promise<void> {
    await this.commonPage.hover(this.btnMyAccount);
    await this.commonPage.click(this.btnMyAccount);
    await this.commonPage.waitForMillis(Constants.TIMEOUTS.BUFFER_STEP_SECONDS * 1000);
    await this.commonPage.click(this.lnkRegister);
  }
}
