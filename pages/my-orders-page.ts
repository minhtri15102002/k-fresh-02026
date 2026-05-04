import { Page } from '@playwright/test';
import { CommonPage } from '@pages/common-page';
import { MyOrdersLocators } from '@locators/my-orders-locators';

export class MyOrdersPage extends MyOrdersLocators {

  commonPage: CommonPage;

  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
  }
}
