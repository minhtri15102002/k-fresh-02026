import { expect, Page } from '@playwright/test';
import { CommonPage } from '@pages/common-page';
import { step } from '@utilities/logging';
import { CompareProductsLocators } from '@locators/compare-products-locators';
import { Product } from '@models/product';

export class CompareProductsPage extends CompareProductsLocators {
  commonPage: CommonPage;

  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
  }

  /**
   * Remove one or multiple products from the compare table
   * @param products List of products to be removed
   */
  @step('Click Remove Product Button')
  async clickRemoveProductButton(productName: string): Promise<void> {
  }

  @step('Remove products from compare table')
  async removeProductsFromCompare(products: Product[]): Promise<void> {
    for (const product of products) {
      // Click the remove button for the specific product name
      await this.commonPage.click(this.btnRemove(product.id));
      // Verify the product is removed before moving to the next one
      await this.commonPage.waitForHidden(this.btnRemove(product.id));
    }
  }

  /**
   *  Retrieves the names of all products in the comparison list.
   * @returns Array of product names
   */
  @step('Get Product Names')
  async getProductNames(): Promise<string[]> {
    return this.getRowValuesInternal('Product');
  }

  /**
   * Helper method to retrieve values from a specific row in the compare table.
   * @param rowLabel The label of the row to retrieve values from (e.g., "Product", "Price", "Stock").
   * @returns Array of strings containing the values from the specified row.
   */
  private async getRowValuesInternal(rowLabel: string): Promise<string[]> {
    await expect(this.table).toBeVisible();
    const allTexts = await this.lblRowName(rowLabel).locator('td').allInnerTexts();
    return allTexts
      .map(text => text.trim())
      .filter(text => text !== rowLabel && text !== '');
  }

  /**
   * Verify that the specified products are successfully added and displayed in the comparison table.
   * @param expectedProducts Array of Product objects.
   */
  @step('Verify Product Details in Compare Table')
  async verifyProductsDetails(expectedProducts: Product[]): Promise<void> {
    // Get a list of existing product names on the UI.
    const actualProductNamesOnUI = await this.getProductNames();

    // Iterate through the list of expected Product objects.
    for (const product of expectedProducts) {
      expect(
        actualProductNamesOnUI,
        `Expected product "${product.name}" to be in the compare table`
      ).toContain(product.name);
    }
  }

  /**
   * Verify there are no duplicate products in the comparison table
   */
  @step('Verify No Duplicate Products')
  async verifyNoDuplicateProducts(): Promise<void> {
    const productNames = await this.getProductNames();
    const uniqueProductNames = [...new Set(productNames)];
    expect(productNames).toEqual(uniqueProductNames);
  }

  /**
   * Verify that no products are listed on the comparison page.
   * @param expectMessage The message displayed when the comparison table is empty.
   */
  @step('Verify No Product On Comparion Page')
  async verifyNoProductOnComparionPage(expectMessage: string): Promise<void> {
    await this.commonPage.waitUntilContainsText(this.lblEmptyMessage, expectMessage);
    await this.commonPage.toBeHidden(this.table);
  }
}
