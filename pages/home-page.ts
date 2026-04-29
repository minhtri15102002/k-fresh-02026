import test, { expect, Page } from '@playwright/test';
import { Constants } from '../utilities/constants';
import { CommonPage } from './common-page';
import { step } from '../utilities/logging';
import { HomeLocators } from '../locators/home-locators';

export class HomePage extends HomeLocators {

  commonPage: CommonPage;

  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
  }

  /**
   * Selects a menu item from the main navigation.
   * @param menuName The name of the menu item to select.
   */
  @step('Select Menu')
  async selectMenu(menuName: string): Promise<void> {
  }

  /**
   * Navigates directly to the Home Page (Base URL).
   * This is the ONLY place where page.goto() should be used.
   */
  @step('Navigate to Home Page')
  async navigateToHomePage(): Promise<void> {
    await this.commonPage.goto(Constants.BASE_URL);
  }

  /**
   * Navigates to the Register page by clicking through the header menu.
   * Simulates real user interaction (No Deep-Linking).
   */
  @step('Navigate to Register Page via Header Menu')
  async goToRegisterPage(): Promise<void> {
    await this.commonPage.hover(this.btnMyAccount);
    await this.commonPage.click(this.btnMyAccount);
    await this.commonPage.waitForMillis(Constants.TIMEOUTS.BUFFER_STEP_SECONDS * 1000);
    await this.commonPage.click(this.lnkRegister);
  }

}
