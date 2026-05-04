import { Locator, Page } from '@playwright/test';
import { CommonLocators } from '@locators/common-locators';

export class LoginLocators extends CommonLocators {

  constructor(page: Page) {
    super(page);
    this.locatorInitialization();
  }

  inputEmail!: Locator;
  inputPassword!: Locator;
  flashMessage!: Locator;

  locatorInitialization(): void {
    super.locatorInitialization();
    this.inputEmail = this.page.locator('//input[@name="email"]');
    this.inputPassword = this.page.locator('//input[@name="password"]');
    this.btnSubmit = this.page.locator('//input[@type="submit"]');
    this.flashMessage = this.page.locator('//div[@id="flash"]');
  }
}
