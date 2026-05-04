import { test } from '@pages/base-page';
import { Constants } from '@utilities/constants';
import { Assertions } from '@utilities/assertions';
import { Messages } from '@data/messages.data';
import { UserProfile } from '@models/user';
import { generateUserProfileData } from '@data/user-data';
import { AssertHelper } from '@pages/assert-helper-page';

let user: UserProfile;
const assertHelper = new AssertHelper();

test.describe('Register Tests', () => {

  test.beforeEach(async ({ commonPage }) => {
    await commonPage.goto(Constants.REGISTER_URL);
    user = generateUserProfileData();
  });

  test('TC-001: Register with valid data - success', { tag: '@smoke @regression' }, async ({ registerPage }) => {
    await registerPage.fillRegistrationForm(user);
    await registerPage.unSelectNewsletter();
    await registerPage.clickAgreeTermsCheckbox();
    await registerPage.submitRegistrationForm();

    await assertHelper.assertElementVisible(registerPage.lblSuccessMessage);
    Assertions.assertEqual(
      await registerPage.getSuccessMessageText(),
      Messages.REGISTER_SUCCESS_TITLE
    );
    Assertions.assertTextContains(
      await registerPage.getSuccessPageContentText(),
      Messages.REGISTER_SUCCESS_FULL_MESSAGE
    );
  });

  test('TC-002: Register without filling any required fields', async ({ registerPage }) => {
    await registerPage.submitRegistrationForm();

    // Verify validation messages appear for all required fields
    await registerPage.verifyRequiredFieldsErrorMessages();
  });

  test('TC-003: Register with invalid email format', async ({ commonPage, registerPage, browserName }) => {
    user.email = 'invalid-email-format';
    await registerPage.fillRegistrationForm(user);
    await registerPage.clickAgreeTermsCheckbox();
    await registerPage.submitRegistrationForm();

    // Verify registration did not succeed (still on register page or shows error)
    Assertions.assertEqual(await commonPage.getCurrentUrl(), Constants.REGISTER_URL);
    const emailValue = await registerPage.inputEmail.inputValue();
    const validationMessage = await registerPage.getInputValidationMessage(registerPage.inputEmail);

    let expectedMessage = `Please include an '@' in the email address. '${emailValue}' is missing an '@'.`;
    if (browserName === 'firefox') {
      expectedMessage = 'Please enter an email address.';
    } else if (browserName === 'webkit') {
      expectedMessage = 'Enter an email address';
    }

    Assertions.assertEqual(validationMessage, expectedMessage);
  });

  test('TC-004: Register with password mismatch', async ({ registerPage }) => {
    user.confirmPassword = 'mismatchpassword123';
    await registerPage.fillRegistrationForm(user);
    await registerPage.clickAgreeTermsCheckbox();
    await registerPage.submitRegistrationForm();

    // Verify confirm password error message
    Assertions.assertEqual((await registerPage.lblErrorConfirmPassword.textContent())?.trim(), Messages.REGISTER_ERROR_PASSWORD_CONFIRM);
  });

  test('TC-005: Register without agreeing to Privacy Policy', async ({ registerPage }) => {
    await registerPage.fillRegistrationForm(user);
    await registerPage.submitRegistrationForm();

    // Verify top alert message for privacy policy
    Assertions.assertEqual((await registerPage.lblErrorAgree.textContent())?.trim(), Messages.REGISTER_ERROR_PRIVACY_POLICY);
  });
});
