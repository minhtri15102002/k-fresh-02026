import { test } from '@pages/base-page';
import { Constants } from '@utilities/constants';
import { Messages } from '@data/messages-data';
import { UserProfile } from '@models/user';
import { generateUserProfileData } from '@data/user-data';
import { Product } from '@models/product';
import { getEnvProduct } from '@data/product-helper';

const product: Product = getEnvProduct();
let userProfile: UserProfile;

/** Test suite for cart-related tests. Per-test tags carry the @regression
 *  suite tag, so it is no longer needed here. */
test.describe('Cart Tests', () => {
  test.setTimeout(Constants.TIMEOUTS.DEFAULT * 2);

  test.beforeEach(async ({ commonPage, registerPage }) => {
    userProfile = generateUserProfileData();
    await commonPage.goto(Constants.REGISTER_URL);
    await registerPage.fillRegistrationForm(userProfile);
    await registerPage.clickAgreeTermsCheckbox();
    await registerPage.submitRegistrationForm();
    await commonPage.goto(Constants.BASE_URL);
  });

  test('TC-01 - Verify Empty Cart', { tag: ['@P2', '@major', '@regression', '@ui', '@cart'] }, async ({ cartPage }) => {
    await cartPage.clickCartButton();
    await cartPage.clickEditCartButton();
    await cartPage.removeAllProducts();
    await cartPage.verifyMainCartIsEmpty(Messages.EMPTY_CART_MESSAGE);
  });

  test('TC-02 - Add Product to Cart', { tag: ['@P1', '@critical', '@smoke', '@regression', '@ui', '@cart'] }, async ({ productPage, cartPage }) => {
    await productPage.searchAndSelectProduct(product);
    await productPage.increaseQuantity(product);
    await productPage.clickAddToCart();
    await productPage.verifyAddToCartSuccessMessage(Messages.ADD_TO_CART_SUCCESS_MESSAGE);
    await productPage.clickViewCartLink();
    await cartPage.verifyProductAddedToCart(product);
  });

  test('TC-03 - Remove Product from Cart', { tag: ['@P2', '@major', '@regression', '@ui', '@cart'] }, async ({ productPage, cartPage }) => {
    await productPage.searchAndSelectProduct(product);
    await productPage.clickAddToCart();
    await productPage.verifyAddToCartSuccessMessage(Messages.ADD_TO_CART_SUCCESS_MESSAGE);
    await productPage.clickViewCartLink();
    await cartPage.removeAllProducts();
    await cartPage.verifyProductRemovedFromCart(product);
  });

  test('TC-04 - Update product quantity in cart', { tag: ['@P2', '@major', '@regression', '@ui', '@cart'] }, async ({ homePage, productPage, cartPage }) => {
    await homePage.selectProduct(product.name);
    await productPage.clickAddToCart();
    await productPage.verifyAddToCartSuccessMessage(
      Messages.ADD_TO_CART_SUCCESS_MESSAGE,
    );
    await productPage.clickViewCartLink();
    await cartPage.verifyProductAddedToCart(product);

    const updatedProduct = { ...product, quantity: 2 };
    await cartPage.updateProductQuantity(updatedProduct);
    await cartPage.verifyCartModifiedSuccessMessage(Messages.UPDATE_CART_SUCCESS_MESSAGE);
    await cartPage.verifyUpdatedProductQuantity(updatedProduct);
  });

  test('TC-05 - Update Product Quantity to 0 (Remove via Quantity)', { tag: ['@P3', '@minor', '@regression', '@ui', '@cart'] }, async ({ productPage, cartPage }) => {
    await productPage.searchAndSelectProduct(product);
    await productPage.clickAddToCart();
    await productPage.verifyAddToCartSuccessMessage(Messages.ADD_TO_CART_SUCCESS_MESSAGE,);
    await productPage.clickViewCartLink();
    const productWithZeroQty = { ...product, quantity: 0 };
    await cartPage.updateProductQuantity(productWithZeroQty);
    await cartPage.verifyProductRemovedFromCart(product);
  });

  test('TC-06 - Add product to cart', { tag: ['@P2', '@major', '@regression', '@ui', '@cart'] }, async ({ homePage, productPage, cartPage }) => {
    await homePage.selectProduct(product.name);
    await productPage.clickAddToCart();
    await productPage.verifyAddToCartSuccessMessage(Messages.ADD_TO_CART_SUCCESS_MESSAGE);
    await cartPage.clickViewCartLink();
    await cartPage.verifyProductAddedToCart(product);
  });

  test('TC-07 - Add product with multiple quantity successfully', { tag: ['@P2', '@major', '@regression', '@ui', '@cart'] }, async ({ homePage, productPage, cartPage }) => {
    await homePage.selectProduct(product.name);
    await productPage.setQuantity(3);
    await productPage.clickAddToCart();
    await productPage.verifyAddToCartSuccessMessage(Messages.ADD_TO_CART_SUCCESS_MESSAGE);
    await cartPage.clickViewCartLink();
    await cartPage.verifyUpdatedProductQuantity({ ...product, quantity: 3 });
  });

  test('TC-08 - Add product to cart from homepage', { tag: ['@P2', '@major', '@regression', '@ui', '@cart'] }, async ({ homePage, cartPage }) => {
    await homePage.hoverAndAddToCart(product.name);
    await homePage.verifyAddToCartSuccessMessage(Messages.ADD_TO_CART_SUCCESS_MESSAGE);
    await homePage.clickViewCartInToast();
    await cartPage.verifyProductAddedToCart(product);
  });

});
