import { test } from '@pages/base-page';
import { Product } from '@models/product';
import { getEnvProduct } from '@data/product.helper';
import { Assertions } from '@utilities/assertions';
import { Messages } from '@data/messages.data';

const product: Product = getEnvProduct();

test.describe('Cart API Module - Comprehensive Testing', () => {

  test('TC01 - Add product to cart', async ({ apiPage }) => {
    const startTime = Date.now();
    const response = await apiPage.apiPostRequest('index.php?route=checkout/cart/add', undefined, {
      form: {
        product_id: product.id,
        quantity: product.quantity,
      }
    });
    const responseTime = Date.now() - startTime;

    // 1. Status code
    Assertions.assertEqual(response.status(), 200, 'Response status should be 200');

    // 2. Response time
    Assertions.assertToBeLessThan(responseTime, 2000, `Response time (${responseTime}ms) should be less than 2000ms`);

    const body = await response.json();
    const responseBodyString = await response.text();

    // 3. Data size (payload size in bytes)
    Assertions.assertToBeGreaterThan(responseBodyString.length, 0, 'Response body should not be empty');

    // 4. API Schema / Structure / Data Types
    Assertions.assertSchemaByType(body, {
      string: ['success', 'total'],
    }, 'Response schema for adding to cart is incorrect');

    // 5. Data correct / Response body
    Assertions.assertContains(
      body.success,
      Messages.ADD_TO_CART_SUCCESS_MESSAGE,
      `Success message should contain "${Messages.ADD_TO_CART_SUCCESS_MESSAGE}"`,
    );

    Assertions.assertContains(
      body.success,
      product.name,
      `Success message should contain product name "${product.name}"`,
    );

    Assertions.assertNotNull(body.total, 'Response should contain total cart info');
  });

  test('TC02 - Update product quantity in cart', async ({ apiPage, cartPage }) => {
    // Setup: Add product first
    await apiPage.apiPostRequest('index.php?route=checkout/cart/add', undefined, {
      form: {
        product_id: product.id,
        quantity: product.quantity,
      }
    });

    const infoResponse = await apiPage.apiGetRequest('index.php?route=common/cart/info');
    await cartPage.page.setContent(await infoResponse.text());
    const cartItemKey = await cartPage.getProductKey(product.name);

    const updatedQuantity = 3;
    const startTime = Date.now();
    const response = await apiPage.apiPostRequest('index.php?route=checkout/cart/edit', undefined, {
      data: {
        key: cartItemKey,
        quantity: updatedQuantity,
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    const responseTime = Date.now() - startTime;

    // 1. Status code
    Assertions.assertEqual(response.status(), 200, 'Response status should be 200');

    // 2. Response time
    Assertions.assertToBeLessThan(responseTime, 2000, `Response time (${responseTime}ms) should be less than 2000ms`);

    const responseBodyString = await response.text();

    // 3. Data size
    Assertions.assertToBeGreaterThan(responseBodyString.length, 0, 'Response body should not be empty');
  });

  test('TC03 - Remove product from cart', async ({ apiPage, cartPage }) => {
    // Setup: Add product first
    await apiPage.apiPostRequest('index.php?route=checkout/cart/add', undefined, {
      form: {
        product_id: product.id,
        quantity: product.quantity,
      }
    });

    const infoResponse = await apiPage.apiGetRequest('index.php?route=common/cart/info');
    await cartPage.page.setContent(await infoResponse.text());
    const cartItemKey = await cartPage.getProductKey(product.name);

    const startTime = Date.now();
    const response = await apiPage.apiPostRequest('index.php?route=checkout/cart/remove', undefined, {
      form: {
        key: cartItemKey,
      }
    });
    const responseTime = Date.now() - startTime;

    // 1. Status code
    Assertions.assertEqual(response.status(), 200, 'Response status should be 200');

    // 2. Response time
    Assertions.assertToBeLessThan(responseTime, 2000, `Response time (${responseTime}ms) should be less than 2000ms`);

    const body = await response.json();
    const responseBodyString = await response.text();

    // 3. Data size
    Assertions.assertToBeGreaterThan(responseBodyString.length, 0, 'Response body should not be empty');

    // 4. API Schema / Structure
    Assertions.assertSchemaByType(body, {
      string: ['success', 'total'],
    }, 'Response schema for removing from cart is incorrect');

    // 5. Data correct
    Assertions.assertContains(
      body.success,
      Messages.UPDATE_CART_SUCCESS_MESSAGE,
      'Success message for remove should be correct'
    );
  });
});
