import { test } from '@pages/base-page';
import { generateUserProfile, generateAddress } from '@data/checkout-data';
import { Constants } from '@utilities/constants';
import { UserProfile } from '@models/user';
import { Address } from '@models/address';

// Set the global timeout for all test cases within this specific test suite
test.setTimeout(Constants.TIMEOUTS.DEFAULT * 2);

/**
 * @title Checkout Process Test Suite
 * @description Contains End-to-End (E2E) UI tests validating the e-commerce Checkout flow.
 * Scenarios cover new/existing address forms, validation rules, dynamic cart math calculations,
 * and UI state toggles based on user interactions.
 */
test.describe('Checkout Tests', () => {
  const targetProduct = 'HP LP3065';

  let buyerProfile: UserProfile;
  let buyerAddress: Address;

  let receiverProfile: UserProfile;
  let receiverAddress: Address;

  /**
   * Setup hook executed before each test case in this suite.
   */
  test.beforeEach(async ({ homePage, registerPage, productPage }) => {
    buyerProfile = generateUserProfile();
    buyerAddress = generateAddress();

    receiverProfile = generateUserProfile();
    receiverAddress = generateAddress();

    await homePage.navigateToHomePage();
    await homePage.goToRegisterPage();

    await registerPage.fillRegistrationForm(buyerProfile);
    await registerPage.clickAgreeTermsCheckbox();
    await registerPage.submitRegistrationForm();
    await registerPage.expectSuccessfulRegistration();

    await productPage.buySpecificItemNow(targetProduct);
  });

  test('TC-01: Verify successful checkout using a different shipping address', { tag: ['@P1', '@critical', '@smoke', '@regression', '@ui', '@checkout'] }, async ({ checkoutPage }) => {
    await checkoutPage.fillBillingDetails(buyerProfile, buyerAddress);
    await checkoutPage.verifyShippingSectionVisible();
    await checkoutPage.fillShippingDetails(receiverProfile, receiverAddress);
    await checkoutPage.setTermsAndConditions();
    await checkoutPage.clickContinueButton();
    await checkoutPage.confirmOrderAndVerifySuccess();
  });

  test('TC-02: Verify checkout recovers successfully when toggling shipping address states', { tag: ['@P2', '@major', '@regression', '@ui', '@checkout'] }, async ({ checkoutPage }) => {
    await checkoutPage.fillBillingDetails(buyerProfile, buyerAddress);
    await checkoutPage.verifyShippingSectionVisible();
    await checkoutPage.setTermsAndConditions();
    await checkoutPage.clickContinueButton();
    await checkoutPage.verifyShippingValidationErrors();
    await checkoutPage.toggleSameAddressCheckbox(true);
    await checkoutPage.clickContinueButton();
    await checkoutPage.confirmOrderAndVerifySuccess();
  });

  test('TC-03: Mandatory Terms Check - Verify error when Terms & Conditions are not accepted', { tag: ['@P2', '@major', '@regression', '@ui', '@checkout'] }, async ({ checkoutPage }) => {
    await checkoutPage.fillBillingDetails(buyerProfile, buyerAddress);
    await checkoutPage.setTermsAndConditions(false);
    await checkoutPage.clickContinueButton();
    await checkoutPage.verifyTermsWarningMessage();
    await checkoutPage.setTermsAndConditions();
    await checkoutPage.clickContinueButton();
  });

  test('TC-04: New User Happy Path - Complete checkout from scratch', { tag: ['@P1', '@critical', '@regression', '@ui', '@checkout'] }, async ({ checkoutPage }) => {
    await checkoutPage.fillBillingDetails(buyerProfile, buyerAddress);
    await checkoutPage.verifySameAddressIsChecked();
    await checkoutPage.verifyDefaultDeliveryAndPayment();
    await checkoutPage.addOrderComment('This is my first order! Please handle with care.');
    await checkoutPage.setTermsAndConditions();
    await checkoutPage.clickContinueButton();
    await checkoutPage.confirmOrderAndVerifySuccess();
  });
});
