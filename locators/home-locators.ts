import { Locator, Page } from '@playwright/test';
import { CommonLocators } from './common-locators';

export class HomeLocators extends CommonLocators {
  btnMyAccount!: Locator;
  lnkRegister!: Locator;

  constructor(page: Page) {
    super(page);
    this.locatorInitialization();
  }

  locatorInitialization(): void {
    super.locatorInitialization();
    this.btnMyAccount = this.page.getByRole('button', { name: /My account/i }).first();
    this.lnkRegister = this.page.getByRole('link', { name: 'Register' }).first();
  }
}
