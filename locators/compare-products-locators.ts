import { Locator, Page } from '@playwright/test';
import { CommonLocators } from '@locators/common-locators';

export class CompareProductsLocators extends CommonLocators {

  constructor(page: Page) {
    super(page);
    this.locatorInitialization();
  }
  table!: Locator;
  btnRemove!: (id?: string) => Locator;
  btnAddToCart!: Locator;
  lblEmptyMessage!: Locator;
  lblRowName!: (rowName: string) => Locator;

  locatorInitialization(): void {
    super.locatorInitialization();
    this.table = this.page.locator('//table[contains(@class, "table-bordered")]').first();
    this.lblEmptyMessage = this.page.locator('//div[@id="content"]//p');
    this.btnAddToCart = this.page.locator('//td//button[contains(@onclick, "cart")]');
    this.lblRowName = (rowName: string): Locator => this.table.locator(`//tbody//tr[.//td[1][contains(text(), '${rowName}')]]`);
    /**
      * Dynamically locates the "Remove" button on the UI.
      * If a product ID is provided, it targets the specific remove button associated with that product.
      * Otherwise, it returns a generic locator for any "Remove" button.
      * 
      * @param id - (Optional) The unique identifier of the product to be removed.
      * @returns The Playwright Locator for the target "Remove" button.
      */
    this.btnRemove = (id?: string): Locator => {
      const xpath = id
        ? `//a[text()="Remove" and contains(@href, "remove=${id}")]`
        : '//a[text()="Remove"]';
      return this.page.locator(xpath);
    };
  }
}
