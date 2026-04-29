import { Page } from '@playwright/test';
import { ProfileLocators } from '../locators/profile-locators';
import { CommonPage } from './common-page';
import { UserProfile } from '../models/user';
import { Address } from '../models/address';
import { step } from '../utilities/logging';
import { Messages } from '../data/messages.data';
import { AssertHelper } from './assert-helper-page';
import { Assertions } from '../utilities/assertions';

/**
 * Page object for user profile actions in My Account area.
 */
export class ProfilePage extends ProfileLocators {
  commonPage: CommonPage;
  assertHelper: AssertHelper;
  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
    this.assertHelper = new AssertHelper();
  }

  /**
   * Verifies My Account page URL and heading.
   */
  @step('Verify My Account page is displayed')
  async verifyMyAccountPage(): Promise<void> {
    await this.page.waitForURL(/route=account\/account/);
    Assertions.assertTextMatch(this.page.url(),
      /route=account\/account/,
      'My Account');
    await this.assertHelper.assertElementVisible(
      this.hdrAccount,
      'My Account heading');
  }
  /**
   * Verifies right column is visible in My Account page.
   */
  @step('Verify right column is visible')
  async verifyRightColumn(): Promise<void> {
    await this.assertHelper.assertElementVisible(
      this.accountRightColumn,
      'Right column'
    );
  }
  /**
   * Updates the user's profile information with the provided data.
   * @param profileData - An object containing the user's profile information to be updated.
   */
  @step('Update profile information')
  async updateProfileInformation(profileData: UserProfile): Promise<void> {
    await this.commonPage.fill(this.inputFirstName, profileData.firstName);
    await this.commonPage.fill(this.inputLastName, profileData.lastName);
    await this.commonPage.fill(this.inputUpdateEmail, profileData.email);
    await this.commonPage.fill(this.inputTelephone, profileData.phone);
    await this.commonPage.click(this.btnContinue);
  }

  /**
   * Verifies that the user's profile information matches the expected data.
   * @param expectedProfileData - An object containing the expected profile information to be verified against the actual values on the page.
   */
  @step('Verify profile information')
  async verifyProfileInformation(expectedProfileData: UserProfile): Promise<void> {
    await this.assertHelper.assertElementHasValue(
      this.inputFirstName,
      expectedProfileData.firstName,
      'First Name',
    );
    await this.assertHelper.assertElementHasValue(
      this.inputLastName,
      expectedProfileData.lastName,
      'Last Name',
    );
    await this.assertHelper.assertElementHasValue(
      this.inputUpdateEmail,
      expectedProfileData.email,
      'Email',
    );
    await this.assertHelper.assertElementHasValue(
      this.inputTelephone,
      expectedProfileData.phone,
      'Phone',
    );
  }

  /**
   * Updates the user's configuration settings with the provided data.
   * @param settingsData - An object containing the configuration settings to be updated.
   */
  @step('Update Configuration Settings')
  async updateConfigurationSettings(settingsData: unknown): Promise<void> {
    // TODO: Implement when configuration settings locators/data are ready.
  }

  /**
   * Opens Edit Account page.
   */
  @step('Open Edit Account page')
  async openEditAccountPage(): Promise<void> {
    await this.commonPage.click(this.btnEditAccount);
  }

  /**
   * Updates first name, last name and phone.
   * @param data - An object containing first name, last name and phone to be updated.
   */
  @step('Update account information')
  async updateAccountInformation(data: UserProfile): Promise<void> {
    await this.commonPage.fill(this.inputFirstName, data.firstName);
    await this.commonPage.fill(this.inputLastName, data.lastName);
    await this.commonPage.fill(this.inputTelephone, data.phone);
    await this.commonPage.click(this.btnContinue);
  }

  /**
   * Verifies account update success message.
   */
  @step('Verify account update success message')
  async expectAccountUpdateSuccessMessage(): Promise<void> {
    await this.assertHelper.assertElementContainsText(
      this.alertSuccessUpdate,
      Messages.ACCOUNT_UPDATE_SUCCESS_MESSAGE,
      'Account update success alert',
    );
  }

  /**
   * Reads values from Edit Account form for data persistence validation.
   */
  @step('Get values from Edit Account form')
  async getEditAccountValues(): Promise<Pick<UserProfile, 'firstName' | 'lastName' | 'phone'>> {
    return {
      firstName: await this.inputFirstName.inputValue(),
      lastName: await this.inputLastName.inputValue(),
      phone: await this.inputTelephone.inputValue(),
    };
  }

  /**
   * Verifies Edit Account form values against expected data.
   * @param expectedData - The expected data to compare against.
   */
  @step('Verify Edit Account form values')
  async expectEditAccountValues(expectedData: UserProfile): Promise<void> {
    const actualData = await this.getEditAccountValues();

    Assertions.assertEqual(
      actualData.firstName,
      expectedData.firstName,
      'First name is not persisted correctly',
    );
    Assertions.assertEqual(
      actualData.lastName,
      expectedData.lastName,
      'Last name is not persisted correctly',
    );
    Assertions.assertEqual(
      actualData.phone,
      expectedData.phone,
      'Phone is not persisted correctly',
    );
  }

  /**
   * Opens Change Password page from side menu.
   */
  @step('Open Change Password page')
  async openChangePasswordPage(): Promise<void> {
    await this.commonPage.click(this.btnUpdatePassword);
  }

  /**
   * Changes account password.
   * @param newPassword - The new password to set.
   */
  @step('Change account password')
  async changePassword(newPassword: string): Promise<void> {
    await this.commonPage.fill(this.inputNewPassword, newPassword);
    await this.commonPage.fill(this.inputNewPasswordConfirm, newPassword);
    await this.commonPage.click(this.btnContinue);
  }

  /**
   * Verifies change password success message.
   */
  @step('Verify change password success message')
  async expectChangePasswordSuccessMessage(): Promise<void> {
    await this.assertHelper.assertElementContainsText(
      this.alertSuccessUpdate,
      Messages.CHANGE_PASSWORD_SUCCESS_MESSAGE,
      'Change password success alert',
    );
  }

  /**
   * Opens Address Book page and then Add Address form.
   */
  @step('Open Add Address form')
  async openAddAddressPage(): Promise<void> {
    await this.commonPage.click(this.btnModifyAddress);
    await this.commonPage.click(this.btnNewAddress);
  }

  /**
   * Adds a new address with the provided data.
   * @param data - An object containing the address information to be added.
   */
  @step('Add new address to Address Book')
  async addNewAddress(data: Address): Promise<void> {
    await this.commonPage.fill(this.inputFirstName, data.firstName);
    await this.commonPage.fill(this.inputLastName, data.lastName);
    await this.commonPage.fill(this.inputAddressCompany, data.company);
    await this.commonPage.fill(this.inputAddressLine1, data.address1);
    await this.commonPage.fill(this.inputAddressLine2, data.address2);
    await this.commonPage.fill(this.inputAddressCity, data.city);
    await this.commonPage.fill(this.inputAddressPostcode, data.postCode);

    await this.selectCountryAndRegion(data.country, data.region);

    await this.getDefaultAddressRadio(data.defaultAddress).check();
    await this.commonPage.click(this.btnContinue);
  }

  /**
   * Selects country first, waits for the expected region option, then selects region.
   * @param country - The country to be selected.
   * @param region - The region to be selected.
   * Note: This method includes assertions to ensure the expected country and region options are present before attempting to select them, improving test reliability.
   */
  @step('Select country and region in Address form')
  async selectCountryAndRegion(country: string, region: string): Promise<void> {
    await this.assertHelper.assertElementAttached(
      this.countryOptionByName(country),
      `country option ${country}`,
    );

    await this.selectAddressCountry.selectOption({ label: country });
    await this.selectAddressRegion.waitFor({ state: 'visible' });

    await this.assertHelper.assertElementAttached(
      this.regionOptionByName(region),
      `region option ${region}`,
    );

    await this.selectAddressRegion.selectOption({ label: region });
  }

  /**
   * Verifies Address Book page URL.
   */
  @step('Verify Address Book page is displayed')
  async verifyAddressBookPage(): Promise<void> {
    await this.page.waitForURL(/route=account\/address/);
    Assertions.assertTextMatch(this.page.url(),
      /route=account\/address/,
      'Address Book');
    await this.assertHelper.assertElementVisible(
      this.btnNewAddress,
      'New Address button'
    );
  }

  /**
   * Verifies user lands on account success or My Account right after registration.
   */
  @step('Verify registration result page is displayed')
  async verifyRegistrationResultPage(): Promise<void> {
    await this.page.waitForURL(/route=account\/success|route=account\/account/);
    Assertions.assertTextMatch(
      this.page.url(),
      /route=account\/success|route=account\/account/,
      'Registration result',
    );
  }

  /**
   * Clicks Continue when user is on account success page.
   */
  @step('Continue from registration success page')
  async continueFromRegistrationSuccessIfNeeded(): Promise<void> {
    if (this.page.url().includes('route=account/success')) {
      await this.commonPage.click(this.btnLogoutContinue);
    }
  }

  /**
   * Verifies add address success message.
   */
  @step('Verify add address success message')
  async expectAddAddressSuccessMessage(): Promise<void> {
    await this.assertHelper.assertElementContainsText(
      this.alertSuccessUpdate,
      Messages.ADD_ADDRESS_SUCCESS_MESSAGE,
      'Add address success alert',
    );
  }

  /**
   * Verifies an added address is listed in Address Book.
   * @param data - The address data to be verified in the Address Book list.
   */
  @step('Verify address is present in Address Book')
  async expectAddressPresent(data: Address): Promise<void> {
    await this.assertHelper.assertElementVisible(
      this.text(data.address1, false),
      `Address line containing ${data.address1}`,
    );

    await this.assertHelper.assertElementVisible(
      this.text(data.city, false),
      `City containing ${data.city}`,
    );
  }

  /**
   * Verifies account shortcuts and side links required by TC001.
   */
  @step('Verify account shortcuts are visible')
  async expectEditAccountShortcuts(): Promise<void> {
    await this.assertHelper.assertElementVisible(
      this.roleLinkName('Edit your account information', false),
      'Edit account shortcut',
    );
  }
  /**
   * Verifies change password shortcuts are visible.
   */
  @step('Verify change password shortcuts are visible')
  async expectChangePasswordShortcuts(): Promise<void> {
    await this.assertHelper.assertElementVisible(
      this.roleLinkName('Change your password', false),
      'Change password shortcut',
    );
  }
  /**
   * Verifies modify address shortcuts are visible.
   */
  @step('Verify modify address shortcuts are visible')
  async expectModifyAddressShortcuts(): Promise<void> {
    await this.assertHelper.assertElementVisible(
      this.roleLinkName('Modify your address book entries', false),
      'Modify address shortcut',
    );

    await this.assertHelper.assertElementVisible(
      this.accountRightColumn,
      'Right column'
    );
  }

  /**
   * Verifies Edit Account form fields are visible.
   */
  @step('Verify Edit Account form fields are visible')
  async expectEditAccountUpdate(): Promise<void> {
    await this.assertHelper.assertElementVisible(
      this.inputFirstName,
      'First Name input'
    );
    await this.assertHelper.assertElementVisible(
      this.inputLastName,
      'Last Name input'
    );
    await this.assertHelper.assertElementVisible(
      this.inputTelephone,
      'Telephone input'
    );
    await this.assertHelper.assertElementVisible(
      this.inputUpdateEmail,
      'Email input'
    );
  }

  /**
   * Clicks Logout from My Account page.
   */
  @step('Click Logout button')
  async logout(): Promise<void> {
    await this.commonPage.click(this.btnLogout);
  }

  /**
   * Verifies Logout confirmation page URL and message.
   */
  @step('Verify Logout confirmation page')
  async verifyLogoutPage(): Promise<void> {
    await this.page.waitForURL(/route=account\/logout/);
    Assertions.assertTextMatch(this.page.url(),
      /route=account\/logout/,
      'Logout');
    await this.expectLogoutSuccessMessage();
    await this.assertHelper.assertElementVisible(
      this.btnLogoutContinue,
      'Logout continue button');
  }

  /**
   * Verifies logout success confirmation message.
   */
  @step('Verify Logout success message')
  async expectLogoutSuccessMessage(): Promise<void> {
    await this.assertHelper.assertElementVisible(
      this.text(Messages.LOGOUT_CONFIRM_MESSAGE, false),
      'Logout confirmation message',
    );
  }

  /**
   * Clicks Continue button after logout.
   */
  @step('Click Continue button after logout')
  async continueAfterLogout(): Promise<void> {
    await this.commonPage.click(this.btnLogoutContinue);
  }

  /**
   * Verifies user is redirected after logout.
   */
  @step('Verify user is redirected after logout')
  async verifyLogoutRedirectPage(): Promise<void> {
    await this.page.waitForURL(/route=common\/home/);
    Assertions.assertTextMatch(this.page.url(),
      /route=common\/home/,
      'Logout redirect');
  }
}

