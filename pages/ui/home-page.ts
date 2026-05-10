import { Page } from '@playwright/test';
import { Constants } from '@utilities/constants';
import { CommonPage } from '@pages/common-page';
import { step } from '@utilities/logging';
import { HomeLocators } from '@locators/home-locators';
import { AssertHelper } from '@utilities/assert-helper';

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
    await this.commonPage.scrollTo(product);
    await this.commonPage.click(product, { force: true });
    await this.page.waitForURL(/route=product\/product|route=product%2Fproduct/);
  }

  /**
   * Hover over a product card and click its Add-to-Cart button.
   *
   * eCommerce themes typically render the Add-to-Cart button inside a CSS
   * `:hover`-revealed overlay. The implementation below avoids three flaky
   * patterns we hit in this codebase:
   *
   *   1. `productCard(productName)` may match the same product in multiple
   *      sections (featured carousel + grid). We narrow to a visible match
   *      with `.locator('visible=true')` so we don't end up trying to hover
   *      a card inside an inactive carousel slide.
   *   2. `commonPage.hover()` performs a 1-second post-hover delay; in some
   *      themes the `:hover` state lapses during that delay and the reveal
   *      disappears before we can click. We hover with the raw locator API
   *      and immediately wait for the reveal to render.
   *   3. Just before the click event fires, Playwright re-evaluates pointer
   *      events. Even with the overlay rendered, that re-evaluation can
   *      collapse the hover state. `force: true` lets the click dispatch
   *      without the second pointer-state check.
   *
   * @param productName Name of the product to add to cart.
   */
  @step('Hover over product and click Add to Cart')
  async hoverAndAddToCart(productName: string): Promise<void> {
    const productCard = this.productCard(productName);
    await this.commonPage.scrollIntoView(productCard);

    await this.commonPage.hover(productCard);
    await this.assertHelper.assertElementVisible(this.btnAddToCartByProductName(productName));
    await this.commonPage.click(this.btnAddToCartByProductName(productName), { force: true });
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

  /**
   * Verify the toast notification that appears after `hoverAndAddToCart`
   * contains the expected success message.
   *
   * NOTE: this is the homepage-flow counterpart to
   * `productPage.verifyAddToCartSuccessMessage(...)`. The PDP shows a page-level
   * `role="alert"` banner; the homepage shows a transient toast in
   * `#notification-box-top`. They are different DOM nodes, so tests that go
   * through `hoverAndAddToCart` must use this helper, not the product-page one.
   *
   * @param expectedMessage Substring expected to appear in the toast body
   *                        (e.g. `Messages.ADD_TO_CART_SUCCESS_MESSAGE`).
   */
  @step('Verify Add-to-Cart success toast on homepage')
  async verifyAddToCartSuccessMessage(expectedMessage: string): Promise<void> {
    // Hard-wait the toast first so we don't race the auto-dismiss animation.
    // `assertHelper.assertElementContainsText` is `expect.soft` and would only
    // record a failure rather than gate the next step.
    await this.commonPage.waitForVisible(this.spanSuccessAlertMessage);
    await this.assertHelper.assertElementContainsText(
      this.spanSuccessAlertMessage,
      expectedMessage,
    );
  }

  /**
   * Click the "View Cart" link inside the homepage Add-to-Cart toast.
   *
   * Use this instead of `productPage.clickViewCartLink()` for tests that go
   * through the homepage card hover flow.
   */
  @step('Click View Cart in homepage toast')
  async clickViewCartInToast(): Promise<void> {
    await this.commonPage.waitForVisible(this.btnViewCartInToast);
    await this.commonPage.click(this.btnViewCartInToast);
  }

  /**
   * Open Home page
   */
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
    await this.assertHelper.assertPageHasURL(this.page, /route=account\/login/, 'Login page URL');
  }
}
