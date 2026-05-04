import { test } from '@pages/base-page';
import { user } from '@data/login.data';
import { Constants } from '@utilities/constants';
import { UserProfile } from '@models/user';
import { generateUserProfileData } from '@data/user-data';

test.describe('Home Tests', () => {
  let userProfile: UserProfile;

  test.beforeEach(async ({ commonPage, registerPage }) => {
    userProfile = generateUserProfileData();
    await commonPage.goto(Constants.REGISTER_URL);
    await registerPage.fillRegistrationForm(userProfile);
    await registerPage.clickAgreeTermsCheckbox();
    await registerPage.submitRegistrationForm();
  });

  test('TC-WL-001: Access Wishlist page', async ({ homePage, commonPage }) => {
    await commonPage.goto(Constants.BASE_URL);
    await homePage.clickWishListIcon();
  });

  test('TC-WL-002: Add Product to Wishlist', async ({ homePage, commonPage, wishlistPage }) => {
    await commonPage.goto(Constants.BASE_URL);
    await homePage.hoverProductCard();
    await homePage.clickAddToWishlistButton();
    await homePage.clickWishlistInToast();
    await wishlistPage.verifyWishlistNotEmpty();
  });
});
