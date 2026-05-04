import { test } from '@pages/base-page';
import { generateAddressData } from '@data/address.data';
import { generateUserProfileData } from '@data/user-data';
import { UserProfile } from '@models/user';
import { Constants } from '@utilities/constants';

let userProfile: UserProfile;
test.describe('Address Book', () => {

  test.beforeEach(async ({ commonPage, registerPage, addressBookPage }) => {
    userProfile = generateUserProfileData();
    await commonPage.goto(Constants.REGISTER_URL);
    await registerPage.fillRegistrationForm(userProfile);
    await registerPage.clickAgreeTermsCheckbox();
    await registerPage.submitRegistrationForm();
    await addressBookPage.goto();
  });

  test('TC_01 - Add new address successfully', async ({ addressBookPage }) => {
    await addressBookPage.clickNewAddress();
    await addressBookPage.fillAddressForm(generateAddressData());
    await addressBookPage.clickSubmit();
    await addressBookPage.verifySuccess();
  });

  test('TC_02 - Add new address with required fields empty', async ({ addressBookPage }) => {
    await addressBookPage.clickNewAddress();
    await addressBookPage.clickSubmit();
    await addressBookPage.verifyRequiredFieldErrors();
  });

  test.describe('When user already has address', () => {

    test.beforeEach(async ({ addressBookPage }) => {
      await addressBookPage.clickNewAddress();
      await addressBookPage.fillAddressForm(generateAddressData());
      await addressBookPage.clickSubmit();
      await addressBookPage.verifySuccess();
    });

    test('TC_03 - Edit existing address successfully', async ({ addressBookPage }) => {
      await addressBookPage.clickEditAddress();
      await addressBookPage.fillAddressForm(generateAddressData());
      await addressBookPage.clickSubmit();
      await addressBookPage.verifyUpdateSuccess();
    });

    test('TC_04 - Delete existing address successfully', async ({ addressBookPage }) => {
      await addressBookPage.clickDeleteAddress();
      await addressBookPage.verifyCannotDelete();
    });

    test('TC_05 - Delete default address failure', async ({ addressBookPage }) => {
      await addressBookPage.clickDeleteAddress();
      await addressBookPage.verifyCannotDelete();
    });
  });
});
