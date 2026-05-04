import { test } from '@pages/base-page';
import { user } from '@data/login.data';
import { Constants } from '@utilities/constants';
import { UserProfile } from '@models/user';
import { generateUserProfileData } from '@data/user-data';

test.describe('Wish List Tests', () => {
  let userProfile: UserProfile;
  test.beforeEach(async ({ commonPage, registerPage, homePage }) => {
    userProfile = generateUserProfileData();
    await commonPage.goto(Constants.REGISTER_URL);
    await registerPage.fillRegistrationForm(userProfile);
    await registerPage.clickAgreeTermsCheckbox();
    await registerPage.submitRegistrationForm();
    await commonPage.goto(Constants.BASE_URL);
    await homePage.hoverProductCard(0);
    await homePage.clickAddToWishlistButton(0);
    await homePage.clickWishlistInToast();
  });

  test('TC-WL-003: Add product from wishlist to cart', async ({ wishlistPage }) => {
    await wishlistPage.verifyWishlistNotEmpty();
    await wishlistPage.addFirstProductToCartAndVerify();
  });

  test('TC-WL-004: Remove product from wishlist', async ({ wishlistPage }) => {
    await wishlistPage.verifyWishlistNotEmpty();
    await wishlistPage.removeFirstProductAndVerify();
  });

  test('TC-WL-005: link to product detail', async ({ wishlistPage }) => {
    await wishlistPage.verifyWishlistNotEmpty();
    await wishlistPage.openFirstProductAndVerifyDetail();
  });
});
