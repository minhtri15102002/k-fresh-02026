import { test } from '@pages/base-page';
import {
  createAddressData,
  createRegisterData,
  createStrongPassword,
  createUpdateProfileData,
} from '@data/user.helper';
import { Constants } from '@utilities/constants';
import type { UserProfile } from '@models/user';
import { generateUserProfileData } from '@data/user-data';

test.describe('My Account Tests', () => {
  let userProfile: UserProfile;

  test.beforeEach(async ({ commonPage, registerPage, profilePage }) => {
    userProfile = generateUserProfileData();
    await commonPage.goto(Constants.REGISTER_URL);
    await registerPage.fillRegistrationForm(userProfile);
    await registerPage.clickAgreeTermsCheckbox();
    await registerPage.submitRegistrationForm();
    await profilePage.clickMyAccountBtn();
  });

  test('TC001 - My Account Dashboard', async ({
    profilePage,
  }) => {
    await profilePage.verifyMyAccountPage();
    await profilePage.verifyRightColumn();
    await profilePage.expectEditAccountShortcuts();
    await profilePage.expectChangePasswordShortcuts();
    await profilePage.expectModifyAddressShortcuts();
  });

  test('TC002 - Update Account Information', async ({
    profilePage,
  }) => {
    const updatedData = createUpdateProfileData();
    const updatedDataForProfile: UserProfile = updatedData as UserProfile;
    await profilePage.openEditAccountPage();
    await profilePage.updateAccountInformation(updatedDataForProfile);
    await profilePage.expectAccountUpdateSuccessMessage();
    await profilePage.verifyMyAccountPage();
    await profilePage.openEditAccountPage();
    await profilePage.expectEditAccountValues(updatedDataForProfile);
  });

  test('TC003 - Add New Address', async ({
    profilePage,
  }) => {
    const addressData = createAddressData();
    await profilePage.openAddAddressPage();
    await profilePage.addNewAddress(addressData);
    await profilePage.verifyAddressBookPage();
    await profilePage.expectAddAddressSuccessMessage();
    await profilePage.expectAddressPresent(addressData);
  });

  test('TC004 - Logout', async ({
    profilePage,
  }) => {
    await profilePage.verifyMyAccountPage();
    await profilePage.logout();
    await profilePage.verifyLogoutPage();
    await profilePage.continueAfterLogout();
    await profilePage.verifyLogoutRedirectPage();
  });
});

test.describe('TC005 - Change Password', () => {
  test('should change password from My Account right after register', async ({
    commonPage,
    registerPage,
    profilePage,
  }) => {
    const registerData = createRegisterData();
    const changedPassword = createStrongPassword();
    const userProfile: UserProfile = {
      firstName: registerData.firstName,
      lastName: registerData.lastName,
      email: registerData.email,
      telephone: registerData.telephone,
      password: registerData.password,
    };

    await commonPage.goto(Constants.REGISTER_URL);
    await registerPage.fillRegistrationForm(userProfile);
    await registerPage.clickAgreeTermsCheckbox();
    await registerPage.submitRegistrationForm();
    await profilePage.verifyRegistrationResultPage();
    await profilePage.continueFromRegistrationSuccessIfNeeded();

    await profilePage.verifyMyAccountPage();
    await profilePage.openChangePasswordPage();
    await profilePage.changePassword(changedPassword);
    await profilePage.verifyMyAccountPage();
    await profilePage.expectChangePasswordSuccessMessage();
  });
});
