import { test } from '@pages/base-page';
import { generateAddressData } from '@data/address-data';
import { generateUserProfileData } from '@data/user-data';
import { UserProfile } from '@models/user';
import { Constants } from '@utilities/constants';

let userProfile: UserProfile;
test.describe('Address Book', () => {
  test.setTimeout(Constants.TIMEOUTS.DEFAULT * 2);

  test.beforeEach(async ({ commonPage, registerPage, addressBookPage }) => {
    userProfile = generateUserProfileData();
    await commonPage.goto(Constants.REGISTER_URL);
    await registerPage.fillRegistrationForm(userProfile);
    await registerPage.clickAgreeTermsCheckbox();
    await registerPage.submitRegistrationForm();
    await addressBookPage.goto();
  });

  test('TC-01 - Add new address successfully', { tag: ['@P2', '@major', '@regression', '@ui', '@profile'] }, async ({ addressBookPage }) => {
    await addressBookPage.clickNewAddress();
    await addressBookPage.fillAddressForm(generateAddressData());
    await addressBookPage.clickSubmit();
    await addressBookPage.verifySuccess();
  });

  test('TC-02 - Add new address with required fields empty', { tag: ['@P3', '@minor', '@regression', '@ui', '@profile'] }, async ({ addressBookPage }) => {
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

    test('TC-03 - Edit existing address successfully', { tag: ['@P2', '@major', '@regression', '@ui', '@profile'] }, async ({ addressBookPage }) => {
      await addressBookPage.clickEditAddress();
      await addressBookPage.fillAddressForm(generateAddressData());
      await addressBookPage.clickSubmit();
      await addressBookPage.verifyUpdateSuccess();
    });

    test('TC-04 - Delete existing address successfully', { tag: ['@P2', '@major', '@regression', '@ui', '@profile'] }, async ({ addressBookPage }) => {
      // The nested beforeEach has already added one address. We add a SECOND
      // address so deletion is allowed (the system only blocks deletes when it
      // would leave the user with zero addresses) and target the 2nd row by
      // index so we exercise the real success-path, not the warning guard
      // that's now covered separately by TC_05.
      await addressBookPage.clickNewAddress();
      await addressBookPage.fillAddressForm(generateAddressData());
      await addressBookPage.clickSubmit();
      await addressBookPage.verifySuccess();

      await addressBookPage.clickDeleteAddressAt(1);
      await addressBookPage.verifyDeleteSuccess();
    });

    test('TC-05 - Cannot delete the only remaining address', { tag: ['@P3', '@minor', '@regression', '@ui', '@profile'] }, async ({ addressBookPage }) => {
      // Starting from the single address seeded by the nested beforeEach,
      // attempting to delete it should be rejected by the server with a
      // "must have at least one address" warning — this is the guard test.
      await addressBookPage.clickDeleteAddress();
      await addressBookPage.verifyCannotDelete();
    });
  });
});
