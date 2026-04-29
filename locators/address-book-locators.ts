import { Locator, Page } from '@playwright/test';
import { CommonLocators } from './common-locators';

export class AddressBookLocators extends CommonLocators {

  constructor(page: Page) {
    super(page);
    this.locatorsInitialization();
  }
  inputFirstName!: Locator;
  inputLastName!: Locator;
  inputCompany!: Locator;
  inputAddress1!: Locator;
  inputAddress2!: Locator;
  inputCity!: Locator;
  inputPostCode!: Locator;
  countryDropdown!: Locator;
  regionDropdown!: Locator;
  btnBack!: Locator;
  lnkAddressBook!: Locator;

  locatorsInitialization(): void {
    super.locatorInitialization();
    this.inputFirstName = this.page.locator('//input[@name="firstname"]');
    this.inputLastName = this.page.locator('//input[@name="lastname"]');
    this.inputCompany = this.page.locator('//input[@name="company"]');
    this.inputAddress1 = this.page.locator('//input[@name="address_1"]');
    this.inputAddress2 = this.page.locator('//input[@name="address_2"]');
    this.inputCity = this.page.locator('//input[@name="city"]');
    this.inputPostCode = this.page.locator('//input[@name="postcode"]');
    this.lnkAddressBook = this.page.locator('//a[contains(normalize-space(.), "Address Book")]');
    this.countryDropdown = this.page.locator('//select[@name="country_id"]');
    this.regionDropdown = this.page.locator('//select[@name="zone_id"]');
  }
  actionButton(text: string): Locator {
    return this.page.locator(`//a[contains(text(),"${text}")]`);
  }
  btnRadio(option: '1' | '0'): Locator {
    return this.page.locator(
      `//input[@name="default" and @value="${option}"]`
    );
  }
  lblMessageError(field: string): Locator {
    return this.page.locator(
      `//input[@name="${field}"]/following-sibling::div[contains(@class,"text-danger")]`
    );
  }
  regionError(): Locator {
    return this.page.locator(
      '//select[@name="zone_id"]/../div[contains(@class,"text-danger")]'
    );
  }
  lblMessage(text: string): Locator {
    return this.page.locator(`.alert-${text}`).first();
  }
}
