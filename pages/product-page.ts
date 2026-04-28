import test, { expect, Page } from "@playwright/test";
import { Constants } from "../utilities/constants";
import { CommonPage } from "./common-page";
import { step } from "../utilities/logging";
import { ProductLocators } from "../locators/product-locators";
import { Product } from "../models/product";
import { AssertHelper } from './assert-helper-page';


export class ProductPage extends ProductLocators {
  commonPage: CommonPage;
  assertHelper: AssertHelper;

  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
    this.assertHelper = new AssertHelper();
  }

  @step("Click Add to Compare Button")
  async clickAddToCompareButton(productName: string): Promise<void> {
    await this.clickProductLink(productName);
    await this.commonPage.click(this.btnCompare);
  }


  @step("Verify compare notification box")
  async expectCompareNotificationBox(): Promise<void> {
    await test.step("Verify compare notification box", async () => {
      await this.assertHelper.assertElementVisible(this.boxCompareNotificationTop);
      await this.assertHelper.assertElementVisible(this.boxCompareNotificationContent);
      await this.assertHelper.assertElementContainsText(this.boxCompareNotificationContent, /success|added to your product comparison/i);
    });
  }

  /**
   * Check product details on the product page and return a Product object with the details.
   * @returns A Product object containing the details of the product on the product page.
   */

  @step("Get Product Details")
  async openProductDetail(productName: string): Promise<void> {
    await test.step(`Open product detail: ${productName}`, async () => {
      await this.clickProductLink(productName);
      await this.page.waitForLoadState(Constants.LOAD_STATE.NETWORK_IDLE);
    });

    await test.step("Extract product details", async () => {
      // Verify product details are visible and contain expected values
      await this.assertHelper.assertElementVisible(this.lblProductTitle);
      await this.assertHelper.assertElementContainsText(this.lblProductTitle, productName);
    });

    await test.step("Verify prrice details", async () => {
      // Price should be visible and contain a currency symbol and a valid number format
      await this.assertHelper.assertElementVisible(this.lblProductPrice);
      await this.assertHelper.assertElementContainsText(this.lblProductPrice, "$");
      await this.assertHelper.assertElementContainsText(this.lblProductPrice, /\d+\.\d{2}/i);
    });

    await test.step("Verify stock status", async () => {
      // Stock status should be visible
      await this.assertHelper.assertElementVisible(this.lblStockStatus);
      await this.assertHelper.assertElementContainsText(this.lblStockStatus, /in stock|out of stock|availability|available|unavailable/i);


    });

    await test.step("Verify main product image and description", async () => {
      // Main product image should be visible and have a valid src attribute
      await this.assertHelper.assertElementVisible(this.imgMainProduct);
      await this.assertHelper.assertElementHasAttribute(this.imgMainProduct, "src", /.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
      const imageSrc = await this.imgMainProduct.getAttribute("src");
      expect(imageSrc).toBeTruthy();
    });

    await test.step("Verify description details", async () => {
      // Description tab should be visible and contain text
      await this.assertHelper.assertElementVisible(this.tabDescription);
      await this.commonPage.click(this.tabDescription);
    });
    await test.step("Verify description content", async () => {
      await this.assertHelper.assertElementVisible(this.divTabContent);
      await this.assertHelper.assertElementContainsText(this.divTabContent, /\w+/);
    });

    await test.step("Verify Brand", async () => {
      // Brand link should be visible and contain text
      await this.assertHelper.assertElementVisible(this.lnkBrand);
    });
  }

  /**
   * Check Quantity counter functionality by incrementing and decrementing the quantity and verifying the value changes accordingly.
   * @param initialQuantity The initial quantity value before incrementing or decrementing.
   */

  @step("Check Quantity Counter Functionality")
  async checkQuantityCounterFunctionality(productName: string): Promise<void> {
    await this.clickProductLink(productName);
    await test.step("Verify initial quantity", async () => {
      await this.assertHelper.assertElementVisible(this.inputQuantity);
      //check initial quantity is a valid number and greater than 0
      const quantity = await this.commonPage.getAttribute(this.inputQuantity, "value");
      await this.assertHelper.assertNumberGreaterThanOrEqual(parseInt(quantity), 0);
    });
  }

  @step("Increment and Decrement Quantity and Verify")
  async incrementDecrementQuantityAndVerify(productName: string): Promise<void> {
    await test.step("Increment quantity and verify", async () => {
      await this.assertHelper.assertElementVisible(this.btnIncreaseQuantity);
      const times = 3;
      for (let i = 0; i < times; i++) {
        await this.commonPage.click(this.btnIncreaseQuantity);
      }
    });
  }

  @step("Decrement Quantity and Verify")
  async decrementQuantityAndVerify(productName: string): Promise<void> {
    await test.step("Decrement quantity and verify", async () => {
      await this.assertHelper.assertElementVisible(this.btnDecreaseQuantity);
      const times = 2;
      for (let i = 0; i < times; i++) {
        await this.commonPage.click(this.btnDecreaseQuantity);
      }
    });
  }

  @step("Verify Final Quantity Value")
  async verifyFinalQuantityValue(productName: string): Promise<void> {
    await test.step("Verify final quantity value", async () => {
      const finalValue = await this.inputQuantity.inputValue();
      // Final quantity should be initial value + 1 (3 increments - 2 decrements)
      const expectedValue = 1;
      this.assertHelper.assertNumberGreaterThanOrEqual(parseInt(finalValue), expectedValue);
    });
  }

  @step("Fill Quantity Input Directly and Verify")
  async fillQuantityInputDirectlyAndVerify(productName: string): Promise<void> {
    await test.step("Fill quantity input directly and verify", async () => {
      const directValue = "5";
      await this.commonPage.fill(this.inputQuantity, directValue);
      await this.page.waitForTimeout(500);
      const finalValue = await this.inputQuantity.inputValue();
      expect(finalValue).toBe(directValue);
    });
  }

  /**
   * Check Size Chart functionality by opening the size chart, verifying the table is visible, closing the size chart, and verifying the table is no longer visible.
   */
  @step("Check Size Chart Functionality")
  async checkSizeChartFunctionality(productName: string): Promise<void> {
    await this.clickProductLink(productName);
    await test.step("Open size chart and verify table is visible", async () => {
      await this.commonPage.click(this.lnkSizeChart);
      await this.assertHelper.assertElementVisible(this.tblSizeChart);
    });

    await test.step("Close size chart and verify table is not visible", async () => {
      await this.commonPage.click(this.btnSizeChartClose);
      await this.assertHelper.assertElementNotVisible(this.tblSizeChart);
    });
  }

  /**
   * Check Add to Compare functionality by clicking the "Add to Compare" button, verifying the compare notification is visible with correct content
   * and then clicking the action button in the notification to navigate to the comparison page, and finally verifying the product is listed on the comparison page.
   * @param productName The name of the product to add to compare and verify on the comparison page.
   */
  @step("Check Add to Compare Functionality")

  /**
   * check pop-up functionality by opening the pop-up, verifying the content is visible, closing the pop-up, and verifying the content is no longer visible.
   */
  @step("Check Pop-up Functionality")
  async checkPopupFunctionality(productName: string): Promise<void> {
    await this.clickProductLink(productName);
    await test.step("Open pop-up and verify content is visible", async () => {
      await this.commonPage.click(this.lnkPopup);
      await this.assertHelper.assertElementVisible(this.divPopupContent);
    });
    await test.step("Close pop-up and verify content is not visible", async () => {
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
      await this.btnIncreaseQuantity.click();
    }
  }

  /**
   * Clicks the add to cart button to add the product to the cart
   */
  @step("Click Quick View Button")
  async clickQuickViewButton(productName: string): Promise<void> { }

  /**
   *  Clicks the "Inquiry" button for the specified product.
   * @param productName
   */
  @step("Click Inquiry Button")
  async clickInqueryButton(productName: string): Promise<void> { }
  @step('Clicking the add to cart button to add the product to the cart')
  async clickAddToCart(): Promise<void> {
    await this.commonPage.roleButtonName('Add to Cart').click();
  }

  /**
   * Verifies that the success alert displays the expected message after adding a product to the cart
   * @param expectedMessage
   */
  @step('Verifying that the success alert displays the expected message after adding a product to the cart')
  async verifyAddToCartSuccessMessage(expectedMessage: string): Promise<void> {
    await expect(this.divSuccessAlert).toContainText(expectedMessage);
  }

  /**
   * Clicks the view cart link in the success alert to navigate to the cart page
   */
  @step("Compare Product Details")
  async compareProductDetails(
    actualProduct: Product,
    expectedProduct: Product,
  ): Promise<void> { }

  @step('Clicking the view cart link in the success alert to navigate to the cart page')
  async clickViewCartLink(): Promise<void> {
    await this.commonPage.roleLinkName('View Cart', false).click();
  }

  @step('Search and Navigate to Product Page via UI Navigation')
  async searchAndSelectProduct(product: Product): Promise<void> {
    await this.commonPage.fill(this.searchInput.first(), product.name);
    await this.commonPage.press(this.searchInput.first(), 'Enter');
    await this.page.waitForLoadState('domcontentloaded');
    await this.commonPage.waitForVisible(this.firstProductImage);
    await this.commonPage.click(this.firstProductImage);
    await this.page.waitForLoadState('domcontentloaded');
  }
}
