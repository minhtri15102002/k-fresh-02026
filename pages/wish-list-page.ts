import { Page } from '@playwright/test';
import { CommonPage } from '@pages/common-page';
import { step } from '@utilities/logging';
import { WishListLocators } from '@locators/wish-list-locators';
import { Product } from '@models/product';
import { AssertHelper } from '@pages/assert-helper-page';

export class WishListPage extends WishListLocators {
  commonPage: CommonPage;
  assertHelper: AssertHelper;

  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
    this.assertHelper = new AssertHelper();
  }

  /**
   * Get the name of the first product in the wishlist.
   * @returns Product name as string
   */
  @step('Get first product name in wishlist')
  async getFirstProductName(): Promise<string> {
    await this.assertHelper.assertElementVisible(this.cellFirstProductName);
    return this.commonPage.textContent(this.cellFirstProductName);
  }

  /**
   * Verify the wishlist has at least one item and the empty message is not shown.
   */
  @step('Verify wishlist is not empty')
  async verifyWishlistNotEmpty(): Promise<void> {
    await this.assertHelper.assertElementVisible(this.rowWishlist);
    await this.assertHelper.assertElementNotVisible(this.pEmptyMessage);
  }

  /**
   * Verify a product row exists in the wishlist by product name.
   * @param productName - The name of the product to check
   */
  @step('Verify product exists in wishlist')
  async verifyProductExists(productName: string): Promise<void> {
    const row = this.rowByProductName(productName)
    await this.assertHelper.assertElementVisible(row);
  }

  /**
   * Verify the current page URL contains a product_id query param.
   */
  @step('Verify redirected to product detail page')
  async verifyProductDetailPage(): Promise<void> {
    await this.assertHelper.assertPageHasURL(this.page, /product_id/);
  }

  /**
   * Click a product link by name to navigate to its detail page.
   * @param productName - The name of the product to navigate to
   */
  @step('Click product link to go to product detail')
  async goToProductDetail(productName: string): Promise<void> {
    await this.commonPage.waitForVisible(this.lnkProductByName(productName));
    await this.commonPage.click(this.lnkProductByName(productName));
  }

  /**
   * Open the first product in the wishlist and verify its detail page.
   */
  @step('Open first product detail from wishlist and verify')
  async openFirstProductAndVerifyDetail(): Promise<void> {
    const productName = await this.getFirstProductName()
    await this.goToProductDetail(productName);
    await this.verifyProductDetailPage();
  }

  /**
   * Click the remove button for a product by name.
   * @param productName - The name of the product to remove
   */
  @step('Remove product from wishlist by name')
  async removeProductByName(productName: string): Promise<void> {
    await this.assertHelper.assertElementVisible(this.rowByProductName(productName));
    await this.commonPage.click(this.btnRemoveByProduct(productName));
  }

  /**
   * Remove a product by name and verify its row is no longer attached to the DOM.
   * @param productName - The name of the product to remove and verify
   */
  @step('Remove product by name and verify row removed')
  async removeProductAndVerify(productName: string): Promise<void> {
    await this.removeProductByName(productName);
    await this.assertHelper.assertElementNotAttached(this.rowByProductName(productName));
  }

  /**
   * Remove the first product in the wishlist and verify its row is gone.
   * Wrapper — test file can call without passing any parameters.
   */
  @step('Remove first product and verify row removed')
  async removeFirstProductAndVerify(): Promise<void> {
    const productName = await this.getFirstProductName();
    await this.removeProductAndVerify(productName);
  }

  /**
   * Click the Add to Cart button for a product by name.
   * @param productName - The name of the product to add to cart
   */
  @step('Click Add to Cart button for product')
  async addProductToCartByName(productName: string): Promise<void> {
    await this.assertHelper.assertElementVisible(this.rowByProductName(productName));
    await this.commonPage.click(this.btnAddToCartByProduct(productName));
  }

  /**
   * Verify the success toast notification and View Cart button appear after adding to cart.
   */
  @step('Verify success toast and View Cart button appear')
  async verifyAddToCartSuccess(): Promise<void> {
    await this.assertHelper.assertElementVisible(this.divSuccessMessage);
    await this.assertHelper.assertElementContainsText(this.lblSuccessMessage, 'Success');
    await this.assertHelper.assertElementVisible(this.btnViewCart);
  }

  /**
   * Add a product to cart by name and verify the success toast appears.
   * @param productName - The name of the product to add to cart and verify
   */
  @step('Add product to cart by name and verify success')
  async addProductToCartAndVerify(productName: string): Promise<void> {
    await this.addProductToCartByName(productName);
    await this.verifyAddToCartSuccess();
  }

  /**
   * Add the first product in the wishlist to cart and verify the success toast appears.
   * Wrapper — test file can call without passing any parameters.
   */
  @step('Add first product to cart and verify success')
  async addFirstProductToCartAndVerify(): Promise<void> {
    const productName = await this.getFirstProductName()
    await this.addProductToCartAndVerify(productName);
  }
}
