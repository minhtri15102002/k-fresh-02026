import { Locator, Page } from '@playwright/test';
import { CommonLocators } from './common-locators';

export class ProductLocators extends CommonLocators {
  constructor(page: Page) {
    super(page);
    this.locatorsInitialization();
  }

  // Product detail locators
  getProductLink(productName: string): Locator {
    return this.page.locator(`a:has-text("${productName}")`);
  }

  btnSearch!: Locator;
  lblProductTitle!: Locator;
  lblProductPrice!: Locator;
  lblStockStatus!: Locator;
  imgMainProduct!: Locator;
  tabDescription!: Locator;
  tabSpecification!: Locator;
  divTabContent!: Locator;
  lnkBrand!: Locator;

  // Quantity selectors
  inputQuantity!: Locator;
  btnIncreaseQuantity!: Locator;
  btnDecreaseQuantity!: Locator;

  //Size chart selectors
  lnkSizeChart!: Locator;
  tblSizeChart!: Locator;
  btnSizeChartClose!: Locator;

  //pop-up selectors
  lnkPopup!: Locator;
  divPopupContent!: Locator;
  btnPopupClose!: Locator;

  //Compare selectors

  btnCompare!: Locator;
  boxCompareNotificationTop!: Locator;
  boxCompareNotificationContent!: Locator;
  btnCompareNotificationAction!: Locator;

  divSuccessAlert!: Locator;
  btnAddToCart!: Locator;
  lnkViewCart!: Locator;
  searchInput!: Locator;
  btnSearch!: Locator;
  inputProductSearch!: Locator;
  firstProductImage!: Locator;
  btnBuyNow!: Locator;
  productThumbnail!: Locator;
  productThumb!: Locator;
  productThumbnaiByName!: (name: string) => Locator;
  productThumbnailTop!: (name: string) => Locator;
  imgProduct!: (productName: string) => Locator;
  iconCompare!: (productName: string) => Locator;
  lblProductName!: Locator;
  lblProuctPrice!: Locator;
  btnCompare!: (productName: string) => Locator;
  btnCompareById!: (id: string) => Locator;
  btnAddWishlist!: (productName: string) => Locator;
  btnQuickView!: (productName: string) => Locator;
  btnAddCart!: (productName: string) => Locator;
  btnNavigateToComparePage!: (productName: string) => Locator;
  //toast
  toastMessage!: (productName: string) => Locator;
  btnCloseToast!: (name: string) => Locator;
  toastBody!: Locator;

  locatorInitialization(): void {
    super.locatorInitialization();
    this.divSuccessAlert = this.page.getByRole('alert');
    this.firstProductImage = this.page
      .locator('//div[contains(@class, "product-layout")]//img')
      .first();
    this.btnBuyNow = this.page.locator('//button[text()="Buy Now"]');
    this.btnSearch = this.page
      .locator('(//input[@placeholder="Search For Products"])')
      .first();
    this.lblProductTitle = this.page.locator('h1').first();
    this.lblProductPrice = this.page.locator('//h3[@data-update="price"]');
    this.lblStockStatus = this.page.locator(
      '//li[span=\'Availability:\']/span[2]',
    );
    this.imgMainProduct = this.page
      .locator('//div[@class="image-thumb d-flex"]//a//img')
      .first();
    this.tabDescription = this.page
      .locator(
        '//a[contains(@class,"nav-link") and normalize-space()="Description"]',
      )
      .first();
    this.divTabContent = this.page
      .locator(
        '(//div[contains(@class, \'description\') and contains(@class, \'text-collapsed\')])[1]',
      )
      .first();
    this.lnkBrand = this.page.locator('//li[.//span[text()="Brand:"]]//a');
    this.inputQuantity = this.page.locator('(//input[@name="quantity"])[2]');
    this.btnIncreaseQuantity = this.page.locator(
      '(//button[@aria-label="Increase quantity"])[2]',
    );
    this.inputQuantity = this.page.locator('(//input[@name="quantity"])[1]');
    this.divSuccessAlert = this.page.getByRole('alert');
    this.productThumbnail = this.page.locator('//div[@class="product-thumb"]');
    this.productThumbnaiByName = (productName: string): Locator => this.page.locator(`//h4/a[contains(text(),"${productName}")]/ancestor::div[contains(@class, "product-thumb")]`);
    this.lblProductName = this.page.locator('//h4[@class="title"]');
    this.lblProuctPrice = this.page.locator('//div[@class="price"]');
    this.iconCompare = (productName: string): Locator => this.productThumbnaiByName(productName).getByTitle('Compare this Product');
    this.btnAddWishlist = (productName: string): Locator => this.productThumbnaiByName(productName).locator('//button[contains(@class,"btn-wishlist")]');
    this.btnQuickView = (productName: string): Locator => this.productThumbnaiByName(productName).locator('//button[contains(@class,"btn-quickview")]');
    this.btnAddCart = (productName: string): Locator => this.productThumbnaiByName(productName).locator('//button[contains(@class,"btn-cart")]');
    this.btnCompare = (productName: string): Locator => this.productThumbnaiByName(productName).getByTitle('Compare this Product');
    this.btnNavigateToComparePage = (productName: string): Locator => {
      return this.page.locator(`//div[contains(@class,"toast")]//p//a[contains(text(),"${productName}")]/ancestor::div[3]//a[contains(text(),"Product Compare")]`);
    }
    this.toastMessage = (productName: string): Locator => {
      return this.page.locator(`//div[contains(@class,"toast")]//p//a[contains(text(),"${productName}")]`);
    }
    this.btnCloseToast = (name: string): Locator => {
      return this.page.locator(`//div[contains(@class,"toast")]//p//a[contains(text(),"${name}")]/ancestor::div//span[text()="×"]`);
    }
    this.toastBody = this.page.locator('//div[@class="toast-body"]');
  }
}
