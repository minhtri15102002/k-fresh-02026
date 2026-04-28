import { test } from "@pages/base-page";
import { Constants } from "@utilities/constants";
import { productData } from "@data/product-data";

test.describe("Product Tests", () => {
  test.beforeEach(async ({ commonPage }) => {
    await commonPage.goto(Constants.BASE_URL);
  });

  test(`TC01 -verify product detail page for ${Constants.ENV} environment`, async ({ productPage }) => {
    await productPage.openProductDetail(productData.productName);
  });

  test(`TC02 -verify add to compare functionality for ${Constants.ENV} environment`, async ({ productPage }) => {
    await productPage.clickAddToCompareButton(productData.productName);
    await productPage.expectCompareNotificationBox();
  });

  test(`TC03 - verify size chart functionality for ${Constants.ENV} environment`, async ({ productPage }) => {
    await productPage.checkSizeChartFunctionality(productData.productName);
  });

  test(`TC04 - verify pop-up functionality for ${Constants.ENV} environment`, async ({ productPage }) => {
    await productPage.checkPopupFunctionality(productData.productName);
  });

  test(`TC05 - verify quantity counter functionality for ${Constants.ENV} environment`, async ({ productPage }) => {
    await productPage.checkQuantityCounterFunctionality(productData.productName);
    await productPage.incrementDecrementQuantityAndVerify(productData.productName);
    await productPage.decrementQuantityAndVerify(productData.productName);
    await productPage.verifyFinalQuantityValue(productData.productName);
    await productPage.fillQuantityInputDirectlyAndVerify(productData.productName);
  });

});
