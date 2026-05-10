import { test } from '@pages/base-page';
import { Constants } from '@utilities/constants';
import { productData } from '@data/product-data';

test.describe('Product Tests', () => {
  test.beforeEach(async ({ commonPage }) => {
    await commonPage.goto(Constants.BASE_URL);
  });

  test(`TC-01 - Verify product detail page for ${Constants.ENV} environment`, { tag: ['@P2', '@major', '@smoke', '@regression', '@ui', '@product'] }, async ({
    productPage,
  }) => {
    await productPage.openProductDetail(productData.productName);
  });

  test(`TC-02 - Verify add to compare functionality for ${Constants.ENV} environment`, { tag: ['@P3', '@minor', '@regression', '@ui', '@product'] }, async ({
    productPage,
  }) => {
    await productPage.clickAddToCompareButton(productData.productName);
    await productPage.expectCompareNotificationBox();
  });

  test(`TC-03 - Verify size chart functionality for ${Constants.ENV} environment`, { tag: ['@P3', '@minor', '@regression', '@ui', '@product'] }, async ({
    productPage,
  }) => {
    await productPage.checkSizeChartFunctionality(productData.productName);
  });

  test(`TC-04 - Verify pop-up functionality for ${Constants.ENV} environment`, { tag: ['@P3', '@minor', '@regression', '@ui', '@product'] }, async ({
    productPage,
  }) => {
    await productPage.checkPopupFunctionality(productData.productName);
  });

  test(`TC-05 - Verify quantity counter functionality for ${Constants.ENV} environment`, { tag: ['@P3', '@minor', '@regression', '@ui', '@product'] }, async ({
    productPage,
  }) => {
    await productPage.checkQuantityCounterFunctionality(productData.productName);
    await productPage.incrementQuantity(3);
    await productPage.decrementQuantity(2);
    await productPage.verifyFinalQuantityValue();
    await productPage.fillQuantityInputDirectly('10');
    await productPage.verifyFinalQuantityValueAfterFill('10');
  });
});
