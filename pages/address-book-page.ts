import { Page } from '@playwright/test';
import { expect, Page } from '@playwright/test';
import { AddressBookLocators } from '../locators/address-book-locators';
import { Address } from '../models/address';
import { CommonPage } from './common-page';
import { step } from '../utilities/logging';
import { AssertHelper } from './assert-helper-page';

export class AddressBookPage extends AddressBookLocators {
  commonPage: CommonPage;
  assertHelper: AssertHelper;

  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
    this.assertHelper = new AssertHelper();
  }

  /**
   * Navigate to Address Book page
   */
  @step('Navigating to Address Book page')
  async goto(): Promise<void> {
    await this.commonPage.click(this.lnkAddressBook);
  }

  /**
   * Click New Address button
   */
  @step('Clicking New Address button')
  async clickNewAddress(): Promise<void> {
    await this.commonPage.click(this.btnAddNew);
  }

  /**
   * Fill address form
   * @param address - The address data to fill in the form
   */
  @step('Filling address information')
  async fillAddressForm(address: Address): Promise<void> {
    await this.commonPage.fill(this.inputFirstName, address.firstName);
    await this.commonPage.fill(this.inputLastName, address.lastName);
    await this.commonPage.fill(this.inputCompany, address.company);
    await this.commonPage.fill(this.inputAddress1, address.address1);
    await this.commonPage.fill(this.inputAddress2, address.address2);
    await this.commonPage.fill(this.inputCity, address.city);
    await this.commonPage.fill(this.inputPostCode, address.postCode);

    await this.commonPage.selectOption(this.countryDropdown, address.country);
    await this.commonPage.isVisible(this.regionDropdown);
    await this.commonPage.selectOption(this.regionDropdown, address.region);
    // Click the radio no = 0, yes = 1
    await this.commonPage.click(this.btnRadio('0'));
  }

  /**
   * Submit address form
   */
  @step('Submitting address form')
  async clickSubmit(): Promise<void> {
    await this.commonPage.click(this.btnSubmit);
  }

  /**
   * Verify success message
   */
  @step('Verifying address added successfully')
  async verifySuccess(): Promise<void> {
    await this.assertHelper.assertElementContainsText(
      this.lblMessage('success'),
      'Your address has been successfully added'
    );
  }

  /**
 * Verify failure message
 */
  @step('Verify required field validation messages')
  async verifyRequiredFieldErrors(): Promise<void> {
    const requiredFields = [
      {
        locator: this.lblMessageError('firstname'),
        fieldKey: 'First Name',
        min: 1,
        max: 32,
      },
      {
        locator: this.lblMessageError('lastname'),
        fieldKey: 'Last Name',
        min: 1,
        max: 32,
      },
      {
        locator: this.lblMessageError('address_1'),
        fieldKey: 'Address',
        min: 3,
        max: 128,
      },
      {
        locator: this.lblMessageError('city'),
        fieldKey: 'City',
        min: 2,
        max: 128,
      },
    ];

    for (const field of requiredFields) {
      await expect(field.locator).toHaveText(
        `${field.fieldKey} must be between ${field.min} and ${field.max} characters!`
      );
    }

    await expect(this.regionError()).toHaveText(
      'Please select a region / state!'
    );
  }

  /**
   * Click Edit button of the address in the list
   */
  @step('Clicking Edit button of the address')
  async clickEditAddress(): Promise<void> {
    await this.commonPage.click(this.btnEdit);
  }

  /**
   * Verify success message after updating address
   */
  @step('Verifying address updated successfully')
  async verifyUpdateSuccess(): Promise<void> {
    await this.assertHelper.assertElementContainsText(
      this.lblMessage('success'),
      'Your address has been successfully updated'
    );
  }

  /**
 * Click Delete button of the address in the list
 */
  @step('Click Delete button of the address')
  async clickDeleteAddress(): Promise<void> {
    await this.commonPage.click(this.actionButton('Delete'));

  }

  /**
   * Verify success message after deleting address
   */
  @step('Verifying address deleted successfully')
  async verifyDeleteSuccess(): Promise<void> {
    await this.assertHelper.assertElementContainsText(
      this.lblMessage('success'),
      'Your address has been successfully deleted'
    );
  }

  /** 
  * Verify address cannot be deleted when just one address exists
  */
  @step('Verifying cannot address cannot be deleted when just one address exists')
  async verifyCannotDelete(): Promise<void> {
    await this.assertHelper.assertElementContainsText(
      this.lblMessage('warning'),
      ' Warning: You must have at least one address!'
    );
  }
}
