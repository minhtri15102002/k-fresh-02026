import { Page, Locator } from '@playwright/test';
import { Constants } from '@utilities/constants';
import { CommonPage } from '@pages/common-page';
import { step } from '@utilities/logging';
import { CheckoutLocators } from '@locators/checkout-locators';
import { Address } from '@models/address';
import { UserProfile } from '@models/user';
import { Currency } from '@utilities/currency';
import { Logger } from '@utilities/logger';
import { AssertHelper } from '@utilities/assert-helper';
import { Assertions } from '@utilities/assertions';

/**
 * Page Object Model for the Checkout Page.
 * Contains methods to interact with the checkout process, including address forms,
 * payment/shipping methods, and order confirmation.
 */
export class CheckoutPage extends CheckoutLocators {

  assertHelper = new AssertHelper();

  commonPage: CommonPage;

  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
  }

  /**
   * Finalizes the order by clicking the confirmation button.
   * Redirects to the confirm success state.
   */
  @step('Click Place Order Button')
  async clickPlaceOrderButton(): Promise<void> {
    await this.commonPage.click(this.btnConfirmOrder);
    await this.assertHelper.assertPageHasURL(this.page, /.*checkout\/confirm/, 'Checkout confirm page');
  }

  /**
   * Checks the "Terms and Conditions" and proceeds to the next step.
   * This handles the transitional state between filling details and finalizing the order.
   */
  @step('Click Agree to Terms Checkbox')
  async clickAgreeTermsCheckbox(): Promise<void> {
    await this.commonPage.scrollTo(this.chkAgreeTerms);
    await this.commonPage.click(this.chkAgreeTerms);
    await this.commonPage.scrollTo(this.btnSaveCheckout);
    await this.commonPage.click(this.btnSaveCheckout);
  }

  /**
   * Clicks the primary "Continue" button used across various accordion sections of the checkout.
   */
  @step('Click Continue Button')
  async clickContinueButton(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.commonPage.scrollTo(this.btnContinueGeneric);
    await this.commonPage.click(this.btnContinueGeneric);
  }

  /**
   * Stub method to retrieve the current product list in the checkout summary.
   * @returns {Promise<string[]>} An empty array (to be implemented).
   */
  @step('Get Product List')
  async getProductList(): Promise<string[]> {
    return [];
  }

  /**
   * Stub method to remove a specific product from the checkout.
   * @param {string} _productName Name of the product to remove.
   */
  @step('Remove Product from Checkout')
  async removeProductFromCheckout(_productName: string): Promise<void> {
    Logger.info(`Stub action: Preparing to remove ${_productName} from cart...`);
  }

  /**
   * Updates the item quantity directly within the checkout summary table.
   * @param {string} _productName Name of the product.
   * @param {number} quantity The new quantity value.
   */
  @step('Update Product Quantity')
  async updateProductQuantity(_productName: string, quantity: number): Promise<void> {
    await this.commonPage.fill(this.inputQty, quantity.toString());
    await this.commonPage.click(this.btnUpdateQty);
  }

  /**
   * Populates the Billing Address form using a new address entry.
   * @param {UserProfile} user The user profile containing name and contact info.
   * @param {Address} address The address details for billing.
   */
  @step('Fill Billing Details (New Address)')
  async fillBillingDetails(user: UserProfile, address: Address): Promise<void> {
    if (await this.commonPage.isVisible(this.radioBillingNewAddress)) {
      await this.commonPage.click(this.radioBillingNewAddress);
    }

    await this.commonPage.fill(this.inputBillingFirstName, user.firstName);
    await this.commonPage.fill(this.inputBillingLastName, user.lastName);
    await this.commonPage.fill(this.inputBillingCompany, address.company);

    await this.commonPage.fill(this.inputBillingAddress1, address.street);
    await this.commonPage.fill(this.inputBillingAddress2, address.address2);
    await this.commonPage.fill(this.inputBillingCity, address.city);
    await this.commonPage.fill(this.inputBillingPostcode, address.postCode);
    await this.commonPage.click(this.ddlPaymentZone);
  }

  /**
   * Populates the Shipping Address form by opting out of the "Same as Billing" default.
   * @param {UserProfile} user The user profile details.
   * @param {Address} address The physical shipping destination.
   */
  @step('Fill Shipping Details (New Address)')
  async fillShippingDetails(user: UserProfile, address: Address): Promise<void> {
    await this.commonPage.uncheck(this.chkSameAddress);

    if (await this.commonPage.isVisible(this.radioShippingNewAddress)) {
      await this.commonPage.click(this.radioShippingNewAddress);
    }

    await this.commonPage.fill(this.inputShippingFirstName, user.firstName);
    await this.commonPage.fill(this.inputShippingLastName, user.lastName);
    await this.commonPage.fill(this.inputShippingCompany, address.company);

    await this.commonPage.fill(this.inputShippingAddress1, address.street);
    await this.commonPage.fill(this.inputShippingAddress2, address.address2);
    await this.commonPage.fill(this.inputShippingCity, address.city);
    await this.commonPage.fill(this.inputShippingPostcode, address.postCode);
    await this.commonPage.click(this.ddlShippingZone);
    await this.ddlShippingZone.selectOption({ index: 1 });
  }

  /**
   * Opts for an existing billing address and ensures the shipping section is collapsed.
   */
  @step('Select Existing Billing Address and Hide Shipping')
  async useExistingAddressAndHideShipping(): Promise<void> {
    if (await this.commonPage.isVisible(this.radioBillingExistingAddress)) {
      await this.commonPage.click(this.radioBillingExistingAddress);
    }
    await this.commonPage.check(this.chkSameAddress);
    await this.assertHelper.assertElementHidden(this.divShippingNewBlock);
  }

  /**
   * Asserts that the default shipping and payment methods are selected and visible.
   */
  @step('Verify Default Delivery and Payment Methods')
  async verifyDefaultDeliveryAndPayment(): Promise<void> {
    await this.commonPage.scrollTo(this.radioFlatShippingRate);
    await this.assertHelper.assertElementVisible(this.radioFlatShippingRate);

    await this.commonPage.scrollTo(this.radioCashOnDelivery);
    await this.assertHelper.assertElementVisible(this.radioCashOnDelivery);
  }

  /**
   * Resets the billing form inputs to an empty state to prepare for validation testing.
   */
  @step('Clear all inputs in Billing Form')
  async clearBillingAddressForm(): Promise<void> {
    if (await this.commonPage.isVisible(this.radioBillingNewAddress)) {
      await this.commonPage.click(this.radioBillingNewAddress);
    }
    await this.commonPage.fill(this.inputBillingCompany, '');
    await this.commonPage.fill(this.inputBillingAddress2, '');
    await this.commonPage.fill(this.inputBillingCity, '');
    await this.commonPage.fill(this.inputBillingPostcode, '');


    await this.commonPage.clear(this.inputBillingFirstName);
    await this.commonPage.clear(this.inputBillingLastName);
    await this.commonPage.clear(this.inputBillingAddress1);
    await this.commonPage.clear(this.inputBillingCity);
    await this.commonPage.click(this.ddlBillingCountry);
    await this.commonPage.selectOption(this.ddlBillingCountry, '');
  }

  /**
   * Validates the presence of mandatory field error messages in the Billing section.
   */
  @step('Verify Billing Validation Errors')
  async verifyBillingValidationErrors(): Promise<void> {
    await this.lblErrorBillingFirstName.waitFor({
      state: 'visible',
      timeout: Constants.TIMEOUTS.WAIT_ELEMENT_VISIBLE
    });
    await this.assertHelper.assertElementVisible(this.lblErrorBillingFirstName);
    await this.lblErrorBillingLastName.waitFor({
      state: 'visible',
      timeout: Constants.TIMEOUTS.WAIT_ELEMENT_VISIBLE
    });
    await this.assertHelper.assertElementVisible(this.lblErrorBillingLastName);
  }

  /**
   * Helper to fetch and parse a currency value from a UI element.
   * @param {any} locator The locator containing the price text.
   * @param {string} stepLogName Descriptive label for logging.
   * @returns {Promise<number>} The parsed numeric price value.
   */
  @step('Extract Price Value by Label')
  async getPriceValue(locator: Locator, stepLogName: string): Promise<number> {
    let text = '';
    if (await locator.isVisible({ timeout: Constants.TIMEOUTS.WAIT_ELEMENT_INVISIBLE }).catch(() => false)) {
      text = await this.commonPage.innerText(locator);
    } else {
      Logger.error(`Could not locate or read price value for: ${stepLogName}`);
    }
    return Currency.parseCurrency(text);
  }

  /**
   * Calculates the product unit price based on the current subtotal and quantity.
   * @returns {Promise<number>} Unit price calculation result.
   */
  @step('Calculate Initial Unit Price from Sub-Total')
  async calculateInitialUnitPrice(): Promise<number> {
    await this.commonPage.waitForVisible(this.inputQty);
    const initialSubTotal = await this.getPriceValue(this.lblSubTotal, 'Sub-Total');
    const initialQty = Number.parseInt(await this.inputQty.inputValue());
    return initialSubTotal / initialQty;
  }

  /**
   * Performs arithmetic verification of total calculations (Quantity * UnitPrice + Shipping).
   * @param {number} quantity Expected item count.
   * @param {number} unitPrice Base price per item.
   */
  @step('Verify Math accuracy of Cart Totals')
  async verifyCartTotals(quantity: number, unitPrice: number): Promise<void> {
    const newSubTotal = await this.getPriceValue(this.lblSubTotal, 'Sub-Total');
    Assertions.assertAlmostEqual(newSubTotal, unitPrice * quantity, 0.05, 'Sub-Total matches unit price * quantity');

    const flatShipping = await this.getPriceValue(this.lblFlatShipping, 'Flat Shipping Rate');
    const total = await this.getPriceValue(this.lblTotal, 'Total');
    Assertions.assertAlmostEqual(total, newSubTotal + flatShipping, 0.05, 'Total matches Sub-Total + Flat Shipping');
  }

  /**
   * Toggles the "Same Address" checkbox to hide the Shipping details section.
   */
  @step('Check Same Address Checkbox to hide section')
  async verifyInitialShippingSectionHidden(): Promise<void> {
    await this.commonPage.check(this.chkSameAddress);
    await this.assertHelper.assertElementHidden(this.divShippingNewBlock);
  }

  /**
   * Toggles the "Same Address" checkbox to reveal the Shipping details section.
   */
  @step('Uncheck Same Address Checkbox to reveal section')
  async verifyShippingSectionVisible(): Promise<void> {
    await this.commonPage.uncheck(this.chkSameAddress);
    await this.assertHelper.assertElementVisible(this.divShippingNewBlock);
  }

  /**
   * Injects a custom comment into the order notes field.
   * @param {string} commentText The instruction or note to add.
   */
  @step('Add Order Comment')
  async addOrderComment(commentText: string): Promise<void> {
    await this.commonPage.fill(this.inputComment, commentText);
  }

  /**
   * Accepts terms and submits the section to proceed.
   */
  @step('Accept Terms and Continue')
  async acceptTermsAndContinue(): Promise<void> {
    await this.commonPage.scrollTo(this.chkAgreeTerms);
    await this.commonPage.check(this.chkAgreeTerms);
    await this.commonPage.click(this.btnSaveCheckout);
  }

  /**
   * Clicks the final confirmation button and asserts successful navigation to the success page.
   */
  @step('Confirm Order and Verify Success')
  async confirmOrderAndVerifySuccess(): Promise<void> {
    await this.commonPage.click(this.btnConfirmOrder);
    await this.assertHelper.assertPageHasURL(this.page, /.*checkout\/success/, 'Checkout success page');
  }

  /**
   * Resets the shipping address form inputs.
   */
  @step('Clear Shipping Address Form')
  async clearShippingAddressForm(): Promise<void> {
    await this.commonPage.uncheck(this.chkSameAddress);
    if (await this.commonPage.isVisible(this.radioShippingNewAddress)) {
      await this.commonPage.click(this.radioShippingNewAddress);
    }
    await this.commonPage.clear(this.inputShippingFirstName);
    await this.commonPage.clear(this.inputShippingLastName);
    await this.commonPage.clear(this.inputShippingAddress1);
    await this.commonPage.clear(this.inputShippingCity);
    await this.commonPage.selectOption(this.ddlShippingCountry, '');
  }

  /**
   * Validates mandatory field error messages in the Shipping section.
   */
  @step('Verify Shipping Validation Errors')
  async verifyShippingValidationErrors(): Promise<void> {
    await this.assertHelper.assertElementVisible(this.lblErrorShippingFirstName);
    await this.assertHelper.assertElementVisible(this.lblErrorShippingLastName);
  }

  /**
   * Selects an existing billing address from the saved address book.
   */
  @step('Select Existing Billing Address')
  async selectExistingBillingAddress(): Promise<void> {
    if (await this.commonPage.isVisible(this.radioBillingExistingAddress)) {
      await this.commonPage.click(this.radioBillingExistingAddress);
    }
  }

  /**
   * Verifies the UI logic that toggles input fields when switching between new/existing addresses.
   */
  @step('Verify Shipping Form Toggle')
  async verifyShippingFormToggle(): Promise<void> {
    await this.commonPage.check(this.radioShippingNewAddress);
    await this.assertHelper.assertElementVisible(this.inputShippingFirstName);

    await this.commonPage.check(this.radioShippingExistingAddress);
    await this.assertHelper.assertElementHidden(this.inputShippingFirstName);
  }

  /**
   * Final verification ensuring the shipping block is hidden after user interaction.
   */
  @step('Verify Shipping Section Hidden Again')
  async verifyShippingSectionHiddenAgain(): Promise<void> {
    await this.commonPage.check(this.chkSameAddress);
    await this.assertHelper.assertElementHidden(this.divShippingNewBlock);

  }

  /**
   * Sets the "Terms and Conditions" checkbox state based on the provided boolean value.
   * @param flag Determines whether to check or uncheck the terms and conditions checkbox.
   */
  @step('Set Terms and Conditions Checkbox')
  async setTermsAndConditions(flag: boolean = true): Promise<void> {
    await this.commonPage.scrollTo(this.chkAgreeTerms);
    if (flag) {
      await this.commonPage.check(this.chkAgreeTerms);
    } else {
      await this.commonPage.uncheck(this.chkAgreeTerms);
    }
  }

  /**
   * Asserts that the warning message for unaccepted terms and conditions is displayed, preventing order confirmation.
   */
  @step('Verify Terms Warning Message')
  async verifyTermsWarningMessage(): Promise<void> {
    await this.alertWarning.waitFor({
      state: 'visible',
      timeout: Constants.TIMEOUTS.WAIT_ELEMENT_VISIBLE
    });
    await this.assertHelper.assertElementVisible(this.alertWarning);
  }

  /**
   * Asserts that the "Same Address" checkbox is selected, confirming the billing and shipping sections are linked.
   */
  @step('Verify Same Address Checkbox is Checked')
  async verifySameAddressIsChecked(): Promise<void> {
    await this.assertHelper.assertCheckboxChecked(this.chkSameAddress);
  }

  /**
   * Selects a country from the billing country dropdown and triggers the API load for zones.
   * @param countryName The name of the country to select.
   */
  @step('Select Billing Country and trigger API load')
  async selectBillingCountry(countryName: string): Promise<void> {
    await this.commonPage.scrollTo(this.ddlBillingCountry);
    await this.ddlBillingCountry.selectOption({ label: countryName });
  }

  /**
   * Verifies that the zone dropdown contains a specific state/province.
   * @param expectedZone The name of the zone to verify.
   */
  @step('Verify Zone Dropdown Contains Specific State')
  async verifyZoneContains(expectedZone: string): Promise<void> {
    await this.commonPage.waitForVisible(this.ddlBillingZone);
    const zoneOptionsText = await this.commonPage.innerText(this.ddlBillingZone);
    Assertions.assertContains(zoneOptionsText, expectedZone, `Zone dropdown contains "${expectedZone}"`);
  }

  /**
   * Toggles the "Same Address" checkbox to the desired state. No-op when
   * the checkbox is already in that state — clicking it then would silently
   * flip it the wrong way.
   * @param check `true` to check, `false` to uncheck.
   */
  @step('Toggle "Same Address" Checkbox')
  async toggleSameAddressCheckbox(check: boolean): Promise<void> {
    await this.commonPage.scrollTo(this.chkSameAddress);
    if ((await this.commonPage.isChecked(this.chkSameAddress)) !== check) {
      await this.commonPage.click(this.chkSameAddress);
    }
  }
}
