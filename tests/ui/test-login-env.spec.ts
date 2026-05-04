import { test } from '@pages/base-page';
import { Constants } from '@utilities/constants';
import { loadUserFromJson } from '@data/user.helper';

const user = loadUserFromJson(Constants.ENV);
