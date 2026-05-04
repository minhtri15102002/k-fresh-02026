import { Locator, Page } from '@playwright/test';
import { CommonLocators } from '@locators/common-locators';

export class ProductLocators extends CommonLocators {
  constructor(page: Page) {
    super(page);
    this.locatorInitialization();
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

  boxCompareNotificationTop!: Locator;
  boxCompareNotificationContent!: Locator;
  btnCompareNotificationAction!: Locator;

  divSuccessAlert!: Locator;
  btnAddToCart!: Locator;
  lnkViewCart!: Locator;
  searchInput!: Locator;
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
  btnCompare!: Locator;
  btnCompareByProductName!: (productName: string) => Locator;
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
    this.btnBuyNow = this.page.locator('//button[text()="Buy now"]');
    this.btnSearch = this.page
      .locator('(//input[@placeholder="Search For Products"])')
      .first();
    this.inputProductSearch = this.page.getByPlaceholder(/Search/i).first();
    this.lblProductTitle = this.page.locator('h1').first();
    this.lblProductPrice = this.page.locator('//h3[@data-update="price"]');
    this.lblStockStatus = this.page.locator('//li[span="Availability:"]/span[2]');
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
        "(//div[contains(@class, 'description') and contains(@class, 'text-collapsed')])[1]",
      )
      .first();
    this.lnkBrand = this.page.locator('//li[.//span[text()="Brand:"]]//a');
    this.inputQuantity = this.page.locator('(//input[@name="quantity"])[2]');
    this.btnIncreaseQuantity = this.page.locator(
      '(//button[@aria-label="Increase quantity"])[2]',
    );
    this.btnDecreaseQuantity = this.page.locator(
      '(//button[@aria-label="Decrease quantity"])[2]',
    );
    this.divSuccessAlert = this.page.getByRole('alert');
    this.productThumbnail = this.page.locator('//div[@class="product-thumb"]');
    this.productThumbnaiByName = (productName: string): Locator =>
      this.page.locator(
        `//h4/a[contains(text(),"${productName}")]/ancestor::div[contains(@class, "product-thumb")]`,
      );
    this.lblProductName = this.page.locator('//h4[@class="title"]');
    this.lblProuctPrice = this.page.locator('//div[@class="price"]');
    this.lnkSizeChart = this.page.locator("//a[@aria-label='Size chart']");
    this.tblSizeChart = this.page.locator(
      '//div[@class="modal fade show"]//table',
    );
    this.btnSizeChartClose = this.page.locator(
      '//div[@class="modal fade show"]//button[@aria-label="Close"]',
    );
    this.lnkPopup = this.page.locator("//a[@aria-label='Popup']");
    this.btnPopupClose = this.page.locator(
      '//div[@class="modal fade show"]//button[@aria-label="Close"]',
    );
    this.divPopupContent = this.page.locator(
      '//h4[contains(normalize-space(), "Popup content")]',
    );
    this.btnCompare = this.page.locator(
      '//button[contains(normalize-space(), "Compare this Product")]',
    );
    this.boxCompareNotificationTop = this.page.locator(
      "//div[@id='notification-box-top']",
    );
    this.boxCompareNotificationContent = this.page.locator(
      "//div[@id='notification-box-top']//div[contains(@class,'toast-body')]",
    );
    this.btnCompareNotificationAction = this.page.locator(
      "//div[@id='notification-box-top']//a[contains(.,'Product Compare')]",
    );
    this.iconCompare = (productName: string): Locator =>
      this.productThumbnaiByName(productName).getByTitle(
        'Compare this Product',
      );
    this.btnAddWishlist = (productName: string): Locator =>
      this.productThumbnaiByName(productName).locator(
        '//button[contains(@class,"btn-wishlist")]',
      );
    this.btnQuickView = (productName: string): Locator =>
      this.productThumbnaiByName(productName).locator(
        '//button[contains(@class,"btn-quickview")]',
      );
    this.btnAddCart = (productName: string): Locator =>
      this.productThumbnaiByName(productName).locator(
        '//button[contains(@class,"btn-cart")]',
      );
    this.btnCompareByProductName = (productName: string): Locator =>
      this.productThumbnaiByName(productName).getByTitle(
        'Compare this Product',
      );
    this.btnNavigateToComparePage = (productName: string): Locator => {
      return this.page.locator(
        `//div[contains(@class,"toast")]//p//a[contains(text(),"${productName}")]/ancestor::div[3]//a[contains(text(),"Product Compare")]`,
      );
    };
    this.toastMessage = (productName: string): Locator => {
      return this.page.locator(
        `//div[contains(@class,"toast")]//p//a[contains(text(),"${productName}")]`,
      );
    };
    this.btnCloseToast = (name: string): Locator => {
      return this.page.locator(
        `//div[contains(@class,"toast")]//p//a[contains(text(),"${name}")]/ancestor::div//span[text()="×"]`,
      );
    };
    this.toastBody = this.page.locator('//div[@class="toast-body"]');
  }
}
