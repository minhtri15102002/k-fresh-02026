import { test } from '@pages/base-page';
import { Constants } from '@utilities/constants';
import { UserProfile } from '@models/user';
import { generateUserProfileData } from '@data/user-data';
import { Product } from '@models/product';
import { getEnvProduct } from '@data/product.helper';
import { Assertions } from '@utilities/assertions';
import { Messages } from '@data/messages.data';

const product: Product = getEnvProduct();
let userProfile: UserProfile;

test.describe('Cart Tests - UI & API Hybrid', () => {

    test.beforeEach(async ({ commonPage, registerPage }) => {
        userProfile = generateUserProfileData();
        await commonPage.goto(Constants.REGISTER_URL);
        await registerPage.fillRegistrationForm(userProfile);
        await registerPage.clickAgreeTermsCheckbox();
        await registerPage.submitRegistrationForm();
    });

    test('TC01 - Add product to cart', async ({ productPage, commonPage }) => {
        await productPage.commonPage.goto(Constants.BASE_URL);
        await productPage.searchAndSelectProduct(product);

        // Listen add-to-cart API BEFORE click
        const addToCartResponsePromise = commonPage.getAPIResponse(
            'index.php?route=checkout/cart/add',
            'POST',
            200
        );

        await productPage.clickAddToCart();

        // Wait API response
        const addToCartResult = await addToCartResponsePromise;

        Assertions.assertNotNull(addToCartResult);
        Assertions.assertEqual(addToCartResult?.response.status(), 200);
        Assertions.assertContains(
            JSON.stringify(addToCartResult?.body),
            Messages.ADD_TO_CART_SUCCESS_MESSAGE
        );

        // UI verify
        await productPage.verifyAddToCartSuccessMessage(
            Messages.ADD_TO_CART_SUCCESS_MESSAGE,
        );
    });
});
