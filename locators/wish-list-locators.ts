import { Locator, Page } from '@playwright/test';
import { CommonLocators } from './common-locators';

export class WishListLocators extends CommonLocators {

  constructor(page: Page) {
    super(page);
    this.locatorInitialization();
  }

  divSuccessMessage!: Locator;
  pEmptyMessage!: Locator;
  tblWishlist!: Locator;
  rowWishlist!: Locator;
  cellFirstProductName!: Locator;
  btnViewCart!: Locator;
  lblSuccessMessage!: Locator;

  // Dynamic by productName
  rowByProductName!: (productName: string) => Locator;
  lnkProductByName!: (productName: string) => Locator;
  cellActionByProduct!: (productName: string) => Locator;
  btnRemoveByProduct!: (productName: string) => Locator;
  btnAddToCartByProduct!: (productName: string) => Locator;

  locatorInitialization(): void {
    super.locatorInitialization();
    this.divSuccessMessage = this.page.locator("//*[@id='notification-box-top']//div[contains(@class,'toast') and contains(@class,'show')]");
    this.lblSuccessMessage = this.page.locator("//*[@id='notification-box-top']//div[contains(@class,'toast-body')]//div[contains(@class,'d-flex')]");
    this.pEmptyMessage = this.page.locator("//p[normalize-space()='Your wish list is empty']");
    this.tblWishlist = this.page.locator("//*[@id='content']//table");
    this.rowWishlist = this.page.locator("//*[@id='content']//table/tbody/tr");
    this.cellFirstProductName = this.page.locator("(//*[@id='content']//table/tbody/tr)[1]//td[@class='text-left']/a");
    this.btnViewCart = this.page.locator("//*[@id='notification-box-top']//a[normalize-space()='View Cart']");
    this.rowByProductName = (productName: string): Locator => this.page.locator(`//table//tbody/tr[.//td[@class='text-left']//a[normalize-space()='${productName}']]`);
    this.lnkProductByName = (productName: string): Locator => this.page.locator(`//table//tbody/tr[.//td[@class='text-left']//a[normalize-space()='${productName}']]//td[@class='text-left']/a`);
    this.cellActionByProduct = (productName: string): Locator => this.page.locator(`//table//tbody/tr[.//td[@class='text-left']//a[normalize-space()='${productName}']]//td[contains(@class,'text-right') and contains(@class,'text-nowrap')]`);
    this.btnRemoveByProduct = (productName: string): Locator => this.page.locator(`//table//tbody/tr[.//td[@class='text-left']//a[normalize-space()='${productName}']]//a[./i[contains(@class,'fa-times')]]`);
    this.btnAddToCartByProduct = (productName: string): Locator => this.page.locator(`//table//tbody/tr[.//td[@class='text-left']//a[normalize-space()='${productName}']]//button[@title='Add to Cart']`);
  }
}
