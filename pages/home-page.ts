import { Page } from '@playwright/test';
import { Constants } from '@utilities/constants';
import { CommonPage } from '@pages/common-page';
import { step } from '@utilities/logging';
import { HomeLocators } from '@locators/home-locators';
import { AssertHelper } from '@pages/assert-helper-page';
import { Assertions } from '@utilities/assertions';
export class HomePage extends HomeLocators {
  commonPage: CommonPage;
  assertHelper: AssertHelper;

  /**
   * Initialize HomePage with required dependencies
   * @param page Playwright Page instance
   */
  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
    this.assertHelper = new AssertHelper();
  }

  /**
   * Navigate to the Home Page
   */
  @step('Navigate to Home Page')
  async navigateToHomePage(): Promise<void> {
    await this.commonPage.goto(Constants.BASE_URL);
  }

  /**
   * Select a menu item from the header navigation
   * @param menuName Name of the menu to select
   */
  @step('Select Menu')
  async selectMenu(menuName: string): Promise<void> {
    await this.commonPage.click(this.menuLink(menuName));
    await this.page.waitForLoadState('networkidle');
    await this.commonPage.click(this.shopByCategoryMenu);
    await this.commonPage.waitForVisible(this.itemTopCategory(menuName));
    await this.commonPage.click(this.itemTopCategory(menuName));
  }

  /**
   * Navigate to Register Page via My Account dropdown
   */
  @step('Navigate to Register Page via Header Menu')
  async goToRegisterPage(): Promise<void> {
    await this.commonPage.hover(this.btnMyAccount);
    await this.commonPage.click(this.btnMyAccount);
    await this.commonPage.waitForMillis(Constants.TIMEOUTS.BUFFER_STEP_SECONDS * 1000);
    await this.commonPage.click(this.lnkRegister);
  }

  /**
   * Select a product by name and open its detail page
   * @param productName Name of the product
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
   * Hover over a product card and click Add to Cart button
   * @param productName Name of the product
   */
  @step('Hover over product and click Add to Cart')
  async hoverAndAddToCart(productName: string): Promise<void> {
    const productCard = this.productCard(productName);
    await this.commonPage.hover(productCard);
    await this.commonPage.click(this.getAddToCartButton(productName));
  }

  /**
   * Hover over a product card by index
   * @param index Product index (default = 0)
   */
  @step('Hover product card')
  async hoverProductCard(index: number = 0): Promise<void> {
    const card = this.lblProductCards(index);
    await this.commonPage.waitForVisible(card);
    await this.commonPage.scrollIntoView(card);
    await this.commonPage.hover(card);
    await this.assertHelper.assertElementVisible(this.btnAddToWishlist(index));
  }
  /**
   * Get product name by index
   * @param index Product index
   * @returns Product name as string
   */
  @step('Get product name')
  async getProductName(index: number): Promise<string> {
    return this.commonPage.innerText(this.lnkProductName(index));
  }

  /**
   * Click Add to Wishlist button for a product
   * @param index Product index (default = 0)
   */
  @step('Click Add To Wishlist button')
  async clickAddToWishlistButton(index: number = 0): Promise<void> {
    await this.hoverProductCard(index);
    await this.commonPage.click(this.btnAddToWishlist(index));
    await this.assertHelper.assertElementVisible(this.divSuccessAlert);
  }

  /**
   * Click Wishlist button from success toast notification
   */
  @step('Click Wishlist button in toast')
  async clickWishlistInToast(): Promise<void> {
    await this.commonPage.waitForVisible(this.btnWishlistInToast);
    await this.commonPage.click(this.btnWishlistInToast);
  }

  /**
   * Click Wishlist icon in header
   */
  @step('Click Wishlist icon')
  async clickWishListIcon(): Promise<void> {
    await this.commonPage.waitForHidden(this.divSuccessAlert);
    await this.commonPage.click(this.iconWishList);
  }
  @step('Open Home page')
  async goto(): Promise<void> {
    await this.commonPage.goto(Constants.BASE_URL);
  }
  /**
   * Opens the My Account dropdown menu.
   */
  @step('Open My Account dropdown')
  async openMyAccountDropdown(): Promise<void> {
    await this.commonPage.click(this.ddlMyAccount);
  }
  /**
   * Navigates to the Login page from the Home page.
   */
  @step('Navigate to Login page from Home page')
  async goToLoginPage(): Promise<void> {
    await this.openMyAccountDropdown();
    await this.commonPage.click(this.lnkMyAccountLogin);
    await this.page.waitForURL(/route=account\/login/);
    Assertions.assertTextMatch(this.page.url(),
      /route=account\/login/,
      'Login page');
  }
}
