import test, { expect, Page } from '@playwright/test';
import { User, UserProfile } from '../models/user';
import { Constants } from '../utilities/constants';
import { Messages } from '../data/messages.data';
import { LoginLocators } from '../locators/login-locators';
import { step } from '../utilities/logging';
import { CommonPage } from './common-page';

export class LoginPage extends LoginLocators {

  commonPage: CommonPage;

  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
  }

  /**
   *  Logs in using the provided user credentials.
   * @param user An object containing the username and password for login.
   */
  @step('Log in with user credentials')
  async login(user: UserProfile): Promise<void> {
    await test.step(`Log in with username: ${user.email}`, async () => {
      await this.commonPage.goto(Constants.LOGIN_URL);
      await this.commonPage.fill(this.inputEmail, user.email);
      await this.commonPage.fill(this.inputPassword, user.password);
      await this.commonPage.click(this.btnSubmit);
    });
  }
  
  /**
   * Asserts that the login was successful by checking the URL and the presence of a success message.
   */
  async expectSuccessfulLogin(): Promise<void> {
    await test.step('Verify successful login', async () => {
      await expect(this.page).toHaveURL(Constants.SECURE_URL);
      await expect(this.flashMessage).toContainText(Messages.SUCCESS_MESSAGE);
    });
  }
}
