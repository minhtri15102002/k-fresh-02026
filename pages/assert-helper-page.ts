import { expect, Locator, type APIResponse, type Page } from '@playwright/test';
import type { Download } from '@playwright/test';
import { step } from '../utilities/logging';

/**
 * Shared assertion helpers for page objects (visibility, text, value, count, API response, downloads).
 */
export class AssertHelper {

    /**
     * Asserts that an element is attached to the DOM.
     * @param Locator - The element locator.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element is attached to the DOM.')
    async assertElementAttached(locator: Locator, message?: string): Promise<void> {
        await expect.soft(locator, message ?? 'Expected element to be attached to the DOM').toBeAttached();
    }

    /**
     * Asserts that an element is not attached to the DOM.
     * @param locator - The element locator.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element is not attached to the DOM.')
    async assertElementNotAttached(locator: Locator, message?: string): Promise<void> {
        await expect.soft(locator, message ?? 'Expected element not to be attached to the DOM').not.toBeAttached();
    }

    /**
    * Asserts that a checkbox is checked.
    * @param locator - The checkbox locator.
    * @param message - Optional custom message.
    */
    @step('Asserts that a checkbox is checked.')
    async assertCheckboxChecked(locator: Locator, message?: string): Promise<void> {
        await expect.soft(locator, message ?? 'Expected checkbox to be checked').toBeChecked();
    }

    /**
     * Asserts that a checkbox is unchecked.
     * @param locator - The checkbox locator.
     * @param message - Optional custom message.
     */
    @step('Asserts that a checkbox is unchecked.')
    async assertCheckboxUnchecked(locator: Locator, message?: string): Promise<void> {
        await expect.soft(locator, message ?? 'Expected checkbox to be unchecked').not.toBeChecked();
    }

    /**
     * Asserts that an element is disabled.
     * @param locator - The element locator.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element is disabled.')
    async assertElementDisabled(locator: Locator, message?: string): Promise<void> {
        await expect.soft(locator, message ?? 'Expected element to be disabled').toBeDisabled();
    }

    /**
     * Asserts that an element is visible.
     * @param locator - The element locator.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element is visible.')
    async assertElementVisible(locator: Locator, message?: string): Promise<void> {
        await expect.soft(locator, message ?? 'Expected element to be visible').toBeVisible();
    }

    /**
     * Asserts that an element is not visible.
     * @param locator - The element locator.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element is not visible.')
    async assertElementNotVisible(locator: Locator, message?: string): Promise<void> {
        await expect.soft(locator, message ?? 'Expected element to be visible').not.toBeVisible();
    }

    /**
     * Asserts that an element is editable.
     * @param locator - The element locator.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element is editable.')
    async assertElementEditable(locator: Locator, message?: string): Promise<void> {
        await expect.soft(locator, message ?? 'Expected element to be editable').toBeEditable();
    }

    /**
     * Asserts that an element is empty.
     * @param locator - The element locator.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element is empty.')
    async assertElementEmpty(locator: Locator, message?: string): Promise<void> {
        await expect.soft(locator, message ?? 'Expected element to be empty').toBeEmpty();
    }

    /**
     * Asserts that an element is enabled.
     * @param locator - The element locator.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element is enabled.')
    async assertElementEnabled(locator: Locator, message?: string): Promise<void> {
        await expect.soft(locator, message ?? 'Expected element to be enabled').toBeEnabled();
    }

    /**
     * Asserts that an element is focused.
     * @param locator - The element locator.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element is focused.')
    async assertElementFocused(locator: Locator, message?: string): Promise<void> {
        await expect.soft(locator, message ?? 'Expected element to be focused').toBeFocused();
    }

    /**
     * Asserts that an element is in the viewport.
     * @param locator - The element locator.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element is in the viewport.')
    async assertElementInViewport(locator: Locator, message?: string): Promise<void> {
        await expect.soft(locator, message ?? 'Expected element to be in the viewport').toBeInViewport();
    }

    /**
     * Asserts that an element is hidden.
     * @param locator - The element locator.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element is hidden.')
    async assertElementHidden(locator: Locator, message?: string): Promise<void> {
        await expect.soft(locator, message ?? 'Expected element to be hidden').toBeHidden();
    }

    /**
     * Asserts that an element has a specific attribute with the expected value.
     * @param locator - The element locator.
     * @param attribute - The attribute name to check.
     * @param expectedValue - The expected value of the attribute.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element has a specific attribute with the expected value.')
    async assertElementHasAttribute(locator: Locator, attribute: string, expectedValue?: string, message?: string): Promise<void> {
        if (expectedValue) {
            await expect.soft(locator, message ?? `Expected element to have attribute '${attribute}' with value '${expectedValue}'`)
                .toHaveAttribute(attribute, expectedValue);
        } else {
            await expect.soft(locator, message ?? `Expected element to have attribute '${attribute}'`)
                .toHaveAttribute(attribute);
        }
    }

    /**
     * Asserts that an element's attibute is not existing or not equal an expected value.
     * @param locator - The element locator.
     * @param attribute - The attribute name to check.
     * @param expectedValue - The expected value of the attribute.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element attibute is not existing or not equal an expected value.')
    async assertElementNoAttribute(locator: Locator, attribute: string, expectedValue?: string, message?: string): Promise<void> {
        if (expectedValue) {
            await expect.soft(locator, message ?? `Expected element to have attribute '${attribute}' but different from the value '${expectedValue}'`)
                .not.toHaveAttribute(attribute, expectedValue);
        } else {
            await expect.soft(locator, message ?? `Expected element to have no attribute '${attribute}'`)
                .not.toHaveAttribute(attribute);
        }
    }

    /**
     * Asserts that the class property of an element should contain an expected value.
     * @param locator - The element locator.
     * @param expectedValue - The expected value of the class.
     * @param message - Optional custom message.
     */
    @step('Asserts that the class property of an element should contain an expected value.')
    async assertElementContainClass(locator: Locator, expectedValue: string | Array<string>, message?: string): Promise<void> {
        await expect.soft(locator, message ?? `Expected element to contains the class '${expectedValue}'`)
            .toContainClass(expectedValue);
    }

    /**
     * Asserts that the class property of an element should not contain an expected value.
     * @param locator - The element locator.
     * @param expectedValue - The expected value of the class.
     * @param message - Optional custom message.
     */
    @step('Asserts that the class property of an element should not contain an expected value.')
    async assertElementNotContainClass(locator: Locator, expectedValue: string | Array<string>, message?: string): Promise<void> {
        await expect.soft(locator, message ?? `Expected an element not contain the class '${expectedValue}'`)
            .not.toContainClass(expectedValue);
    }

    /**
     * Asserts that an element contains a specific text.
     * @param locator - The element locator.
     * @param text - The expected text.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element contains a specific text.')
    async assertElementContainsText(locator: Locator, text: string, message?: string): Promise<void> {
        await expect.soft(locator, message ?? `Expected element to contain text: "${text}"`).toContainText(text);
    }

    /**
     * Asserts that a locator has a specific number of elements.
     * @param locator - The element locator.
     * @param expectedCount - The expected number of elements.
     * @param message - Optional custom message.
     */
    @step('Asserts that a locator has a specific number of elements.')
    async assertElementCount(locator: Locator, expectedCount: number, message?: string): Promise<void> {
        await expect.soft(locator, message ?? `Expected element count to be ${expectedCount}`).toHaveCount(expectedCount);
    }

    /**
     * Asserts that an element has a specific text.
     * @param locator - The element locator.
     * @param expectedText - The expected text or regular expression.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element has a specific text.')
    async assertElementHasText(locator: Locator, expectedText: string | RegExp, message?: string): Promise<void> {
        await expect.soft(locator, message ?? `Expected element to have text '${expectedText}'`).toHaveText(expectedText);
    }

    /**
     * Asserts that an input field has a specific value.
     * @param locator - The element locator.
     * @param expectedValue - The expected value of the input field.
     * @param message - Optional custom message.
     */
    @step('Asserts that an input field has a specific value.')
    async assertElementHasValue(locator: Locator, expectedValue: string, message?: string): Promise<void> {
        await expect.soft(locator, message ?? `Expected element to have value '${expectedValue}'`)
            .toHaveValue(expectedValue);
    }

    /**
     * Asserts that a multi-select dropdown has specific selected values.
     * @param locator - The select element locator.
     * @param expectedValues - The expected selected values.
     * @param message - Optional custom message.
     */
    @step('Asserts that a multi-select dropdown has specific selected values.')
    async assertElementHasValues(locator: Locator, expectedValues: string[], message?: string): Promise<void> {
        await expect.soft(locator, message ?? `Expected element to have selected values '${expectedValues.join(', ')}'`)
            .toHaveValues(expectedValues);
    }

    /**
     * Asserts that a page has a specific title.
     * @param page
     * @param title - The expected title.
     * @param message - Optional custom message.
     */
    @step('Asserts that a page has a specific title.')
    async assertPageHasTitle(page: Page, title: string, message?: string): Promise<void> {
        await expect.soft(page, message ?? `Expected page title to be "${title}"`).toHaveTitle(title);
    }

    /**
     * Asserts that a page has a specific URL.
     * @param page
     * @param url - The expected URL.
     * @param message - Optional custom message.
     */
    @step('Asserts that a page has a specific URL.')
    async assertPageHasURL(page: Page, url: string, message?: string): Promise<void> {
        await expect.soft(page, message ?? `Expected page URL to be "${url}"`).toHaveURL(url);
    }

    /**
     * Asserts that an API response is OK (status 200-299).
     * @param response - The API response object.
     * @param message - Optional custom message.
     */
    @step('Asserts that an API response is OK (status 200-299).')
    async assertResponseOK(response: APIResponse, message?: string): Promise<void> {
        await expect.soft(response, message ?? 'Expected API response to be OK (status 200-299)').toBeOK();
    }

    /**
     * Asserts that an element matches a stored screenshot.
     * @param locator - The element locator.
     * @param screenshotPath - The path to store the screenshot or compare against.
     * @param options - Optional Playwright screenshot comparison options.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element matches a stored screenshot.')
    async assertElementHasScreenshot(
        locator: Locator,
        screenshotPath: string,
        options?: { threshold?: number; animations?: 'disabled' | 'allow' },
        message?: string
    ): Promise<void> {
        await expect.soft(locator, message ?? `Expected element to match screenshot '${screenshotPath}'`)
            .toHaveScreenshot(screenshotPath, options);
    }

    /**
     * Asserts that the full page matches a stored screenshot.
     *
     * @param page - The Playwright page instance.
     * @param screenshotPath - The path to store the screenshot or compare against.
     * @param options - Optional Playwright screenshot comparison options.
     * @param message - Optional custom message.
     */
    @step('Asserts that the page matches a stored screenshot.')
    async assertPageHasScreenshot(
        page: Page,
        screenshotPath: string,
        options?: { threshold?: number; animations?: 'disabled' | 'allow' },
        message?: string
    ): Promise<void> {
        await expect.soft(page, message ?? `Expected page to match screenshot '${screenshotPath}'`)
            .toHaveScreenshot(screenshotPath, options);
    }

    /**
     * Asserts that an element has a specific CSS property value.
     * @param locator - The element locator.
     * @param property - The CSS property to check.
     * @param expectedValue - The expected value of the CSS property.
     * @param message - Optional custom message.
     */
    @step('Asserts that an element has a specific CSS property value.')
    async assertElementHasCSS(
        locator: Locator,
        property: string,
        expectedValue: string,
        message?: string
    ): Promise<void> {
        await expect.soft(locator, message ?? `Expected element to have CSS '${property}: ${expectedValue}'`)
            .toHaveCSS(property, expectedValue);
    }

    /**
     * Asserts that a number is greater than or equal to a minimum value.
     * @param actual - The actual value.
     * @param min - The minimum expected value.
     * @param message - Optional custom message.
     */
    @step('Asserts that a number is greater than or equal to minimum.')
    assertNumberGreaterThanOrEqual(actual: number, min: number, message?: string): void {
        expect.soft(actual, message ?? `Expected ${actual} to be >= ${min}`).toBeGreaterThanOrEqual(min);
    }

    /**
     * Asserts that a download has the expected filename.
     * @param download - The Playwright download object.
     * @param expectedFilename - The expected filename.
     * @param message - Optional custom message.
     */
    @step('Asserts that download has expected filename.')
    assertDownloadFilename(download: Download, expectedFilename: string, message?: string): void {
        expect.soft(download.suggestedFilename(), message ?? `Expected download filename to be '${expectedFilename}'`)
            .toBe(expectedFilename);
    }

    /**
     * Asserts that a download filename matches a regex pattern.
     * @param download - The Playwright download object.
     * @param pattern - The regex pattern to match.
     * @param message - Optional custom message.
     */
    @step('Asserts that download filename matches pattern.')
    assertDownloadFilenameMatches(download: Download, pattern: RegExp, message?: string): void {
        const filename = download.suggestedFilename();
        expect.soft(
            pattern.test(filename),
            message ?? `Expected filename '${filename}' to match pattern ${pattern}`
        ).toBe(true);
    }

    /**
     * Asserts that a string matches a regex pattern.
     * @param actual - The actual string value.
     * @param pattern - The regex pattern to match.
     * @param message - Optional custom message.
     */
    @step('Asserts that string matches pattern.')
    assertStringMatches(actual: string, pattern: RegExp, message?: string): void {
        expect.soft(
            pattern.test(actual),
            message ?? `Expected '${actual}' to match pattern ${pattern}`
        ).toBe(true);
    }

    /** To be Truthy
     *  @param actual - The actual value to check
     *  @param message - Optional custom message
     */
    @step('Asserts that a value is truthy.')
    assertTobeTruthy(actual: any, message?: string): void {
        expect.soft(actual, message ?? `Expected ${actual} to be truthy`).toBeTruthy();
    }

}
