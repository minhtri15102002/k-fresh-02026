import { test } from '@pages/base-page';
import {
  createAddressData,
  createRegisterData,
  createStrongPassword,
  createUpdateProfileData,
} from '@data/user-helper';
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

  test('TC-01 - My Account Dashboard', { tag: ['@P3', '@minor', '@regression', '@ui', '@profile'] }, async ({
    profilePage,
  }) => {
    await profilePage.verifyMyAccountPage();
    await profilePage.verifyRightColumn();
    await profilePage.expectEditAccountShortcuts();
    await profilePage.expectChangePasswordShortcuts();
    await profilePage.expectModifyAddressShortcuts();
  });

  test('TC-02 - Update Account Information', { tag: ['@P2', '@major', '@regression', '@ui', '@profile'] }, async ({
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

  test('TC-03 - Add New Address', { tag: ['@P2', '@major', '@regression', '@ui', '@profile'] }, async ({
    profilePage,
  }) => {
    const addressData = createAddressData();
    await profilePage.openAddAddressPage();
    await profilePage.addNewAddress(addressData);
    await profilePage.verifyAddressBookPage();
    await profilePage.expectAddAddressSuccessMessage();
    await profilePage.expectAddressPresent(addressData);
  });

  test('TC-04 - Logout', { tag: ['@P1', '@critical', '@smoke', '@regression', '@ui', '@auth'] }, async ({
    profilePage,
  }) => {
    await profilePage.verifyMyAccountPage();
    await profilePage.logout();
    await profilePage.verifyLogoutPage();
    await profilePage.continueAfterLogout();
    await profilePage.verifyLogoutRedirectPage();
  });
});

test.describe('Change Password', () => {
  test('TC-05 - Change password from My Account right after register', { tag: ['@P1', '@critical', '@smoke', '@regression', '@ui', '@auth'] }, async ({
    commonPage,
    registerPage,
    profilePage,
    loginPage,
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

    // Round-trip the new password: a "success" message alone proves only that
    // the form was accepted, not that the credential actually changed in the
    // backing store. Logging out and back in with the new password is the
    // smallest assertion that exercises the real outcome.
    await profilePage.logout();
    await profilePage.verifyLogoutPage();
    await profilePage.continueAfterLogout();
    await profilePage.verifyLogoutRedirectPage();

    await loginPage.login({ email: registerData.email, password: changedPassword });
  });
});
