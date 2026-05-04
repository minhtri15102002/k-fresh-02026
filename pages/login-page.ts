import test, { expect, Page } from '@playwright/test';
import { UserProfile } from '@models/user';
import { Constants } from '@utilities/constants';
import { Messages } from '@data/messages.data';
import { LoginLocators } from '@locators/login-locators';
import { step } from '@utilities/logging';
import { CommonPage } from '@pages/common-page';
import { AssertHelper } from '@pages/assert-helper-page';

export class LoginPage extends LoginLocators {

  commonPage: CommonPage;
  assertHelper: AssertHelper;
  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
    this.assertHelper = new AssertHelper();
  }
  /**
   * Navigates to the login page URL directly.
   * Prefer using HomePage navigation for account menu flow tests.
   * @param url Login page URL.
   */
  @step('Navigating to Login page')
  async goto(url: string = Constants.LOGIN_URL): Promise<void> {
    await this.commonPage.goto(url);
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
   * Asserts that login success banner is visible.
   */
  @step('Assert successful login')
  async expectSuccessfulLogin(): Promise<void> {
    await this.assertHelper.assertElementContainsText(
      this.flashMessage,
      Messages.SUCCESS_MESSAGE,
      'Login success banner',
    );
  }
}
