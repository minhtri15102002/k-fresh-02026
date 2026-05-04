// Use fakerVI for generating realistic Vietnamese user data and addresses, enhancing test relevance for VN market.
import { fakerVI as faker } from '@faker-js/faker';
import { Address } from '@models/address';
import { UserProfile } from '@models/user';

/** Generates a realistic Vietnamese user profile */
export function generateUserProfile(): UserProfile {
    return {
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password({ length: 12 }) + '1!Aa',
        telephone: faker.phone.number()
    };
}

/**  Generates a realistic Vietnamese address */
export function generateAddress(): Address {
    return {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        company: faker.company.name(),
        address1: faker.location.streetAddress(),
        address2: faker.location.secondaryAddress(),
        city: faker.location.city(),
        postCode: '700000',
        country: 'Vietnam',
        region: '3200', // Assuming 3200 is a valid region ID/code
        defaultAddress: 'yes',
        street: faker.location.streetAddress(),
        state: '3200',
        zipCode: '700000'
    };
}
