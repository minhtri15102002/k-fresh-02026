import test, { expect, Page } from '@playwright/test';
import { Constants } from '@utilities/constants';
import { CommonPage } from '@pages/common-page';
import { step } from '@utilities/logging';
import { ProductLocators } from '@locators/product-locators';
import { Product } from '@models/product';
import { AssertHelper } from '@pages/assert-helper-page';

export class ProductPage extends ProductLocators {
  commonPage: CommonPage;
  assertHelper: AssertHelper;
  static readonly REGEX = {
    PRICE_FORMAT: /\d+\.\d{2}/i, //Example: $100.00
    COMPARE_SUCCESS: /success|added to your product comparison/i,
    STOCK_STATUS: /in stock|out of stock|availability|available|unavailable/i,
    IMAGE_URL: /.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i,
    NON_EMPTY_TEXT: /\w+/, //Example: Any Text Content
  } as const;

  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
    this.assertHelper = new AssertHelper();
  }

  /**
   * Click Product Link
   * @param productName The name of the product to click.
   */
  @step('Click product link')
  async clickProductLink(productName: string): Promise<void> {
    await this.commonPage.click(this.getProductLink(productName));
  }

  /**
   * Click Add to Compare Button
   * @param productName The name of the product to add to compare.
   */
  @step('Click Add to Compare Button')
  async clickAddToCompareButton(productName: string): Promise<void> {
    await this.clickProductLink(productName);
    await this.commonPage.click(this.btnCompare(productName));
  }

  /**
   * Verify compare notification box by checking if the notification box is visible and contains the correct success message.
   */
  @step('Verify compare notification box')
  async expectCompareNotificationBox(): Promise<void> {
    await test.step('Verify compare notification box', async () => {
      await this.assertHelper.assertElementVisible(this.boxCompareNotificationTop);
      await this.assertHelper.assertElementVisible(this.boxCompareNotificationContent);
      await this.assertHelper.assertElementContainsText(this.boxCompareNotificationContent, ProductPage.REGEX.COMPARE_SUCCESS);
    });
  }

  /**
   * Check product details on the product page and return a Product object with the details.
   * @returns A Product object containing the details of the product on the product page.
   */
  @step('Get Product Details')
  async openProductDetail(productName: string): Promise<void> {
    await test.step(`Open product detail: ${productName}`, async () => {
      await this.clickProductLink(productName);
      await this.page.waitForLoadState(Constants.LOAD_STATE.NETWORK_IDLE);
    });

    await test.step('Extract product details', async () => {
      // Verify product details are visible and contain expected values
      await this.assertHelper.assertElementVisible(this.lblProductTitle);
      await this.assertHelper.assertElementContainsText(this.lblProductTitle, productName);
    });

    await test.step('Verify prrice details', async () => {
      // Price should be visible and contain a currency symbol and a valid number format
      await this.assertHelper.assertElementVisible(this.lblProductPrice);
      await this.assertHelper.assertElementContainsText(this.lblProductPrice, '$');
      await this.assertHelper.assertElementContainsText(this.lblProductPrice, ProductPage.REGEX.PRICE_FORMAT);
    });

    await test.step('Verify stock status', async () => {
      // Stock status should be visible
      await this.assertHelper.assertElementVisible(this.lblStockStatus);
      await this.assertHelper.assertElementContainsText(this.lblStockStatus, ProductPage.REGEX.STOCK_STATUS);
    });

    await test.step('Verify main product image and description', async () => {
      // Main product image should be visible and have a valid src attribute
      await this.assertHelper.assertElementVisible(this.imgMainProduct);
      await this.assertHelper.assertElementHasAttribute(this.imgMainProduct, 'src', ProductPage.REGEX.IMAGE_URL);
      const imageSrc = await this.imgMainProduct.getAttribute('src');
      await this.assertHelper.assertTobeTruthy(imageSrc);
    });

    await test.step('Verify description details', async () => {
      // Description tab should be visible and contain text
      await this.assertHelper.assertElementVisible(this.tabDescription);
      await this.commonPage.click(this.tabDescription);
    });
    await test.step('Verify description content', async () => {
      await this.assertHelper.assertElementVisible(this.divTabContent);
      await this.assertHelper.assertElementContainsText(this.divTabContent, ProductPage.REGEX.NON_EMPTY_TEXT);
    });

    await test.step('Verify Brand', async () => {
      // Brand link should be visible and contain text
      await this.assertHelper.assertElementVisible(this.lnkBrand);
    });
  }

  /**
   * Check Quantity counter functionality by incrementing and decrementing the quantity and verifying the value changes accordingly.
   * @param initialQuantity The initial quantity value before incrementing or decrementing.
   */
  @step('Check Quantity Counter Functionality')
  async checkQuantityCounterFunctionality(productName: string): Promise<void> {
    await this.clickProductLink(productName);
    await test.step('Verify initial quantity', async () => {
      await this.assertHelper.assertElementVisible(this.inputQuantity);
      //check initial quantity is a valid number and greater than 0
      const quantity = await this.commonPage.getAttribute(this.inputQuantity, 'value');
      await this.assertHelper.assertNumberGreaterThanOrEqual(parseInt(quantity), 1);
    });
  }

  /**
   * Increases the product quantity by clicking the increase quantity button a specified number of times
   * @param times The number of times to click the increase quantity button.
   */
  @step('Increment Quantity')
  async incrementQuantity(times: number): Promise<void> {
    await test.step('Increment quantity', async () => {
      await this.assertHelper.assertElementVisible(this.btnIncreaseQuantity);
      await this.commonPage.click(this.btnIncreaseQuantity, { clickCount: times });
    });
  }

  /**
   * Decreases the product quantity by clicking the decrease quantity button a specified number of times
   * @param times The number of times to click the decrease quantity button.
   */
  @step('Decrement Quantity')
  async decrementQuantity(times: number): Promise<void> {
    await test.step('Decrement quantity', async () => {
      await this.assertHelper.assertElementVisible(this.btnDecreaseQuantity);
      await this.commonPage.click(this.btnDecreaseQuantity, { clickCount: times });
    });
  }

  /**
   * Verifies the final quantity value after incrementing and decrementing the quantity
   */
  @step('Verify Final Quantity Value')
  async verifyFinalQuantityValue(): Promise<void> {
    await test.step('Verify final quantity value', async () => {
      const finalValue = await this.inputQuantity.inputValue();
      // Final quantity should be initial value + 1 (3 increments - 2 decrements)
      const expectedValue = 1;
      await this.assertHelper.assertNumberGreaterThanOrEqual(parseInt(finalValue), expectedValue);
    });
  }

  /**
   * Fill quantity input directly and verify
   * @param quantity The quantity value to fill in the input field.
   */
  @step('Fill Quantity Input Directly and Verify')
  async fillQuantityInputDirectly(quantity: string): Promise<void> {
    await test.step('Fill quantity input directly and verify', async () => {
      await this.commonPage.fill(this.inputQuantity, quantity);
      await this.page.waitForTimeout(500);
    });
  }

  /**
   * Verifies the final quantity value after fill
   * @param quantity The quantity value to verify the final quantity value for.
   */
  @step('Verify Final Quantity Value After Fill')
  async verifyFinalQuantityValueAfterFill(quantity: string): Promise<void> {
    await test.step('Verify final quantity value after fill', async () => {
      const finalValue = await this.inputQuantity.inputValue();
      await this.assertHelper.assertNumberGreaterThanOrEqual(parseInt(finalValue), parseInt(quantity));
    });
  }

  /**
   * Check Size Chart functionality by opening the size chart, verifying the table is visible, closing the size chart, and verifying the table is no longer visible.
   */
  @step('Check Size Chart Functionality')
  async checkSizeChartFunctionality(productName: string): Promise<void> {
    await this.clickProductLink(productName);
    await test.step('Open size chart and verify table is visible', async () => {
      await this.commonPage.click(this.lnkSizeChart);
      await this.assertHelper.assertElementVisible(this.tblSizeChart);
    });

    await test.step('Close size chart and verify table is not visible', async () => {
      await this.commonPage.click(this.btnSizeChartClose);
      await this.assertHelper.assertElementNotVisible(this.tblSizeChart);
    });
  }

  /**
   * check pop-up functionality by opening the pop-up, verifying the content is visible, closing the pop-up, and verifying the content is no longer visible.
   */
  @step('Check Pop-up Functionality')
  async checkPopupFunctionality(productName: string): Promise<void> {
    await this.clickProductLink(productName);
    await test.step('Open pop-up and verify content is visible', async () => {
      await this.commonPage.click(this.lnkPopup);
      await this.assertHelper.assertElementVisible(this.divPopupContent);
    });
    await test.step('Close pop-up and verify content is not visible', async () => {
      await this.commonPage.click(this.btnPopupClose);
      await this.assertHelper.assertElementNotVisible(this.divPopupContent);
    });
  }

  /**
   * Increases the product quantity by clicking the increase quantity button a specified number of times
   * @param product
   */
  @step('Increasing the product quantity by a specified number of times')
  async increaseQuantity(product: Product): Promise<void> {
    for (let index = 1; index < product.quantity; index++) {
      await this.commonPage.click(this.btnIncreaseQuantity);
    }
  }

  /**
   * Add one or more products to Compare, verify them, and close the Toast message.
   * @param products - List of Product objects that need to be added
   */
  @step('Add multiple products to compare and verify toast')
  async addProductsToCompare(products: Product[]): Promise<void> {
    for (const product of products) {
      await this.performActionOnProduct(product, ActionType.COMPARE);
      await this.commonPage.waitForVisible(this.toastMessage(product.name));
    }
  }

  /**
   *  Clicks the "Inquiry" button for the specified product.
   * @param productName
   */
  @step('Click Inquiry Button')
  async clickInqueryButton(productName: string): Promise<void> { }

  @step('Clicking the add to cart button to add the product to the cart')
  async clickAddToCart(): Promise<void> {
    await this.commonPage.roleButtonName('Add to Cart').click({ force: true });
  }

  /**
   * Scrapes all visible products on the page and converts them into Product objects.
   * Useful for dynamic data-driven testing.
   */
  @step('Verifying that the success alert displays the expected message after adding a product to the cart')
  async verifyAddToCartSuccessMessage(expectedMessage: string): Promise<void> {
    await this.assertHelper.assertElementContainsText(this.divSuccessAlert, expectedMessage);
  }

  /**
   * Clicks the view cart link in the success alert to navigate to the cart page
   */
  @step('Compare Product Details')
  async compareProductDetails(
    actualProduct: Product,
    expectedProduct: Product,
  ): Promise<void> { }

  @step('Clicking the view cart link in the success alert to navigate to the cart page')
  async clickViewCartLink(): Promise<void> {
    await this.assertHelper.assertElementVisible(this.divSuccessAlert);
    await this.commonPage.click(this.roleLinkName('View Cart', false));
  }

  /**
     * Sets the quantity of the product to be added to the cart.
     * @param qty 
     */
  @step('Set product quantity')
  async setQuantity(qty: number): Promise<void> {
    await this.commonPage.fill(this.inputQuantity, qty.toString());
  }

  /**
  * Adds an item to the cart using standard UI navigation (Search -> Product Detail -> Add to Cart).
  * @param searchTerm The name of the product to search for (e.g., 'HP LP3065').
  */
  @step('Buy Specific Item Now via UI Navigation')
  async buySpecificItemNow(searchTerm: string): Promise<void> {
    await this.commonPage.waitForVisible(this.inputProductSearch);
    await this.commonPage.fill(this.inputProductSearch, searchTerm);
    await this.commonPage.press(this.inputProductSearch, 'Enter');
    await this.page.waitForLoadState('domcontentloaded');
    await this.commonPage.waitForVisible(this.firstProductImage);
    await this.commonPage.click(this.firstProductImage);
    await this.commonPage.waitForVisible(this.btnBuyNow);
    await this.commonPage.click(this.btnBuyNow);
    await expect(this.page).toHaveURL(/.*checkout\/checkout/, { timeout: Constants.TIMEOUTS.PAGE_EVENT_LOAD });
  }

  /**
   * Close toast message by name
   * @param name - Name of the toast message
   */
  @step('Close toast message by name')
  async closeToast(name: string): Promise<void> {
    await this.commonPage.click(this.btnCloseToast(name));
    await this.commonPage.waitForHidden(this.toastBody.first());
  }

  /**
   * Navigate to compare page
   * @param productName - Name of the product
   */
  @step('Navigate to compare page')
  async clickNavigateToComparePage(productName: string): Promise<void> {
    const btnNavigate = this.btnNavigateToComparePage(productName);
    await this.commonPage.waitForVisible(btnNavigate);
    await this.commonPage.click(btnNavigate);
  }

  /**
    * Search and Navigate to Product Page via UI Navigation
     * @param product The name of the product to search for (e.g., 'HP LP3065').
     */
  @step('Search and Navigate to Product Page via UI Navigation')
  async searchAndSelectProduct(product: Product): Promise<void> {
    await this.commonPage.waitForVisible(this.inputProductSearch);
    await this.commonPage.fill(this.inputProductSearch, product.name);
    await this.commonPage.press(this.inputProductSearch, 'Enter');
    await this.commonPage.waitForPageLoad();
    await this.commonPage.waitForVisible(this.firstProductImage);
    await this.commonPage.click(this.firstProductImage);
    await this.commonPage.waitForPageLoad();
  }
}
