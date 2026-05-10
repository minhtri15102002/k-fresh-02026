import { test } from '@pages/base-page';
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

  test('TC-01: Access Wishlist page', { tag: ['@P3', '@minor', '@regression', '@ui', '@home'] }, async ({ homePage, commonPage, wishlistPage }) => {
    await commonPage.goto(Constants.BASE_URL);
    await homePage.clickWishListIcon();
    // Confirms the icon click navigated to the wishlist route — without this
    // the test would silently pass even if the icon stopped wiring up the link.
    await wishlistPage.verifyOnWishlistPage();
  });

  test('TC-02: Add Product to Wishlist', { tag: ['@P2', '@major', '@regression', '@ui', '@home'] }, async ({ homePage, commonPage, wishlistPage }) => {
    await commonPage.goto(Constants.BASE_URL);
    await homePage.hoverProductCard();
    await homePage.clickAddToWishlistButton();
    await homePage.clickWishlistInToast();
    await wishlistPage.verifyWishlistNotEmpty();
  });
});
