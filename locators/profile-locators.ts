import { Locator, Page } from '@playwright/test';
import { CommonLocators } from '@locators/common-locators';
import { DefaultAddressOption } from '@models/address';

export class ProfileLocators extends CommonLocators {
  inputFirstName!: Locator;
  inputLastName!: Locator;
  inputUpdateEmail!: Locator;
  inputTelephone!: Locator;
  inputNewPassword!: Locator;
  inputNewPasswordConfirm!: Locator;
  alertChangePasswordSuccess!: Locator;
  inputAddressCompany!: Locator;
  inputAddressLine1!: Locator;
  inputAddressLine2!: Locator;
  inputAddressCity!: Locator;
  inputAddressPostcode!: Locator;
  selectAddressCountry!: Locator;
  selectAddressRegion!: Locator;
  btnNewAddress!: Locator;
  hdrAccount!: Locator;
  btnMyAccount!: Locator;
  accountRightColumn!: Locator;
  btnEditAccount!: Locator;
  btnUpdatePassword!: Locator;
  btnModifyAddress!: Locator;
  btnLogout!: Locator;
  alertSuccessUpdate!: Locator;
  btnLogoutContinue!: Locator;

  constructor(page: Page) {
    super(page);
    this.locatorInitialization();
  }

  locatorInitialization(): void {
    super.locatorInitialization();
    // My Account page locators
    this.hdrAccount = this.page.getByRole('heading', { name: 'My Account' });
    this.btnMyAccount = this.page.locator('//a[text()=" My Account"]');
    this.accountRightColumn = this.page.locator("//aside[@id='column-right']");
    this.btnEditAccount = this.page.locator("//a[contains(text(), 'Edit your account')]");
    this.btnUpdatePassword = this.accountRightColumn.locator("a[href*='route=account/password']").first();
    this.btnModifyAddress = this.page.locator("//a[contains(text(), 'Modify your address')]");
    this.btnLogout = this.page.locator("//a[contains(text(), 'Logout')]");
    this.alertSuccessUpdate = this.page.locator("//div[contains(@class,'alert-success')]");
    // Edit Account locators
    this.inputUpdateEmail = this.page.locator("//input[@id='input-email']");
    this.inputTelephone = this.page.locator("//input[@id='input-telephone']");
    // Change Password locators
    this.inputNewPassword = this.page.locator("//input[@id='input-password']");
    this.inputNewPasswordConfirm = this.page.locator("//input[@id='input-confirm']");
    this.alertChangePasswordSuccess = this.page.locator("//div[contains(@class,'alert-success')]");
    // Address locators
    this.inputFirstName = this.page.locator("//input[@id='input-firstname']");
    this.inputLastName = this.page.locator("//input[@id='input-lastname']");
    this.inputAddressCompany = this.page.locator("//input[@id='input-company']");
    this.inputAddressLine1 = this.page.locator("//input[@id='input-address-1']");
    this.inputAddressLine2 = this.page.locator("//input[@id='input-address-2']");
    this.inputAddressCity = this.page.locator("//input[@id='input-city']");
    this.inputAddressPostcode = this.page.locator("//input[@id='input-postcode']");
    this.selectAddressCountry = this.page.locator("//select[@id='input-country']");
    this.selectAddressRegion = this.page.locator("//select[@id='input-zone']");
    this.btnContinue = this.page.locator("input[value='Continue']");
    this.btnNewAddress = this.page.locator("//a[contains(text(), 'New Address')]");
    // Logout locators
    this.btnLogoutContinue = this.page.locator("//a[contains(text(), 'Continue')]");
  }
  // Dynamic locator for country option by visible label
  countryOptionByName(countryName: string): Locator {
    return this.page.locator(`#input-country option:text-is("${countryName}")`);
  }

  // Dynamic locator for region option by visible label
  regionOptionByName(regionName: string): Locator {
    return this.page.locator(`#input-zone option:text-is("${regionName}")`);
  }

  /**
   * Returns dynamic locator for "Default Address" radio by yes/no.
   */
  getDefaultAddressRadio = (value: DefaultAddressOption): Locator => {
    return this.page.locator(`input[name="default"][value="${value === 'yes' ? '1' : '0'}"]`);
  }
}
