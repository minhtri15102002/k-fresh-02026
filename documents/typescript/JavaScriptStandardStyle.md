# Naming convention


## I. Variables

When naming variables in TypeScript (or any programming language), it's important to follow consistent naming conventions to make your code more readable, maintainable, and understandable for others (and yourself in the future). Here are some best practices and conventions for naming variables in TypeScript:

### 1. Use CamelCase for Variables
**Convention**: Start with a lowercase letter and capitalize the first letter of each subsequent word.

Example:

```
let userName: string;
let totalAmount: number;
```

### 2. Be Descriptive but Concise
**Convention**: Variable names should clearly describe their purpose or the data they hold, but should not be overly verbose.

Example:

```
let isAuthenticated: boolean; // Good
let flag: boolean; // Too vague
let userAuthFlag: boolean; // Too verbose
```

### 3. Avoid Single-Letter Names (Except for Loop Counters)
**Convention**: Single-letter names should generally be avoided except for common loop counters like `i`, `j`, or `k`.

Example:

```
for (let i = 0; i < array.length; i++) {
    // Loop logic
}
```

```
let firstName: string; // Good
let f: string; // Not descriptive
```

### 4. Use is, has, can, should for Boolean Variables
**Convention**: Prefix boolean variables with words that imply a true/false value.

Example:

```
let isAdmin: boolean;
let hasAccess: boolean;
let canEdit: boolean;
let shouldSave: boolean;
```

### 5. Use Plural Names for Arrays or Collections
**Convention**: If a variable holds a collection of items, use a plural name.

Example:

```
let users: string[]; // Array of user names
let orderItems: OrderItem[]; // Array of OrderItem objects
```

### 6. Avoid Using Abbreviations
**Convention**: Avoid abbreviations that are not universally recognized or could be unclear to others.

Example:

```
let lastName: string; // Good
let lName: string; // Not clear
```

### 7. Use Nouns for Variables That Hold Data
**Convention**: Variable names that represent data or objects should typically be nouns.

Example:

```
let user: User; // Good
let userInfo: User; // Good
let getUser: User; // Verb, better suited for a function name
```

### 8. Use Verb-Noun Pairs for Functions Returning Values
**Convention**: If a variable represents the result of an action or calculation, use a verb-noun pair.

Example:

```
let calculateTotalAmount: number;
let fetchUserDetails: User;
```

### 9. Use Constants for Fixed Values
**Convention**: Constants should be in `UPPERCASE_SNAKE_CASE`, especially for global constants.

Example:

```
const MAX_USERS: number = 100;
const API_URL: string = 'https://api.example.com';
```

### 10. Use Contextual Names in Functions
**Convention**: When working within a specific context, name variables in a way that makes sense within that scope.

Example:

```
function calculateOrderTotal(order: Order): number {
    let totalAmount = 0;
    for (let item of order.items) {
        totalAmount += item.price * item.quantity;
    }
    return totalAmount;
}
```

Example Usage in Code:

```
class UserService {
    private users: User[] = [];

    addUser(userName: string, userEmail: string): void {
        const newUser: User = {
            id: this.generateUserId(),
            name: userName,
            email: userEmail,
            isActive: true
        };
        this.users.push(newUser);
    }

    private generateUserId(): number {
        return this.users.length + 1;
    }

    getUserById(userId: number): User | undefined {
        return this.users.find(user => user.id === userId);
    }
}
```

### 11. Null vs. Undefined

- Prefer not to use either for explicit unavailability
```
let foo: { x: number, y?: number } = { x:123 };
```

- Use `undefined` in general (do consider returning an object like {valid:boolean, value?:Foo} instead)
```
return undefined;
```

- Use `null` where it's a part of the API or conventional
```
cb(null)
```

- Use truthy check for `objects` being null or undefined
```
if (error)
```

- Use `== null / != null (not === / !==)` to check for `null / undefined` on primitives as it works for both `null/undefined` but not other falsy values (like '', 0, false) e.g.
```
if (error != null) // rules out both null and undefined
```

### 12. Semicolons
- Use semicolons.

### 13. Array
- Annotate arrays as foos: `Foo[] instead of foos: Array<Foo>`

### 14. Filename
- Name files with camelCase. E.g. `utils.ts, map.ts` etc.
- Page Object `LoginPage.ts`
- Test File `login-test.spec.ts`


## II. Common Naming Conventions for Locators in Playwright:

### 1. Prefix with Element Type:

Prefix the variable name with the type of element it refers to (e.g., btn, lnk, lbl, inp).
    Example:
    
```
const btnSubmit = page.locator('button[type="submit"]');
const inpUsername = page.locator('#username');
```

### 2. Use Descriptive Names:

Use clear and descriptive names that indicate the purpose of the element or its content.
    Example:

```
const lblErrorMessage = page.locator('.error-message');
const lnkForgotPassword = page.locator('a.forgot-password');
```

### 3. CamelCase or PascalCase:

Use camelCase for variable names, following the TypeScript standard for variable naming.
    Example:

```
const inputSearchBox = page.locator('#search-box');
const btnLogin = page.locator('#login-button');
```

### 4. Avoid Abbreviations:

Avoid overly abbreviating names, which can make the code harder to understand.
    Example:

```
const buttonSubmitOrder = page.locator('#submit-order');
const inputEmail = page.locator('#email');
```

### 5. Suffix with Context (if necessary):

If an element has multiple similar instances on a page, you can suffix the locator with a contextual hint.
    Example:

```
const btnCancelDialog = page.locator('#cancel-dialog-button');
const btnCancelForm = page.locator('#cancel-form-button');
```

### 6. Grouping by Component (optional):

If you have multiple locators for elements within the same component, consider grouping them in an object or using nested objects.
    Example:

```
const loginForm = {
    inputUsername: page.locator('#username'),
    inputPassword: page.locator('#password'),
    btnSubmit: page.locator('#login-button')
};
```

## Here’s a quick summary of the key naming conventions for variables:

1. `CamelCase`: Use camelCase for variable names.
    - Example: `userName`, `totalAmount`.

2. `Descriptive Names`: Be clear and descriptive, but concise.
    - Example: `isAuthenticated`, `totalPrice`.

3. `Single-Letter Names`: Avoid single-letter names, except for loop counters (`i`, `j`, `k`).
    - Example: `firstName` instead of `f`.

4. `Boolean Variables`: Prefix with is, has, can, should for booleans.
    - Example: `isAdmin`, `hasAccess`.

5. `Plural Names for Collections`: Use plural names for arrays or collections.
    - Example: `users`, `orderItems`.

6. `Avoid Abbreviations`: Use full words unless the abbreviation is universally recognized.
    - Example: `lastName`, not `lName`.

7. `Nouns for Data`: Use nouns for variables that hold data.
    - Example: `user`, `orderTotal`.

8. `Verb-Noun for Results`: Use verb-noun pairs for variables that represent action results.
    - Example: `calculateTotalAmount`, `fetchUserDetails`.

9. `Constants in Uppercase`: Use `UPPERCASE_SNAKE_CASE` for constants.
    - Example: `MAX_USERS`, `API_URL`.

10. `Contextual Names`: Use names that make sense in the function’s context.
    - Example: `orderTotal` inside an `Order` class method.


# Here's the cheat sheet formatted as a Markdown table:

| **Element Type**    | **Naming Convention**       | **Example Locator**                            | **Example Name**                 |
|---------------------|-----------------------------|------------------------------------------------|----------------------------------|
| **Button**          | `btn<Description>`          | `page.locator('text=Submit')`                  | `btnSubmit`                      |
| **Input Field**     | `input<Description>`        | `page.locator('#email')`                       | `inputEmail`                     |
| **Checkbox**        | `chk<Description>`          | `page.locator('input[type="checkbox"]')`       | `chkAgreeTerms`                  |
| **Radio Button**    | `radio<Description>`        | `page.locator('input[type="radio"]')`          | `radioGenderMale`                |
| **Dropdown**        | `ddl<Description>`          | `page.locator('select#country')`               | `ddlCountry`                     |
| **Link**            | `lnk<Description>`          | `page.locator('text=Home')`                    | `lnkHome`                        |
| **Table**           | `tbl<Description>`          | `page.locator('table#userList')`               | `tblUserList`                    |
| **Table Row**       | `row<Description>`          | `page.locator('table#userList tr')`            | `rowUserListFirst`               |
| **Table Cell**      | `cell<Description>`         | `page.locator('table#userList td:nth-child(2)')` | `cellUserListName`             |
| **Image**           | `img<Description>`          | `page.locator('img[alt="Profile Picture"]')`   | `imgProfilePicture`              |
| **Heading**         | `hdr<Description>`          | `page.locator('h1')`                           | `hdrMainTitle`                   |
| **Paragraph**       | `p<Description>`            | `page.locator('p.intro')`                      | `pIntroText`                     |
| **Span**            | `span<Description>`         | `page.locator('span.badge')`                   | `spanBadgeCount`                 |
| **Div**             | `div<Description>`          | `page.locator('div.container')`                | `divMainContainer`               |
| **List (ul/ol)**    | `list<Description>`         | `page.locator('ul.menu')`                      | `listMenuItems`                  |
| **List Item**       | `item<Description>`         | `page.locator('ul.menu li:first-child')`       | `itemFirstMenuItem`              |
| **Form**            | `form<Description>`         | `page.locator('form#loginForm')`               | `formLogin`                      |
| **Modal**           | `modal<Description>`        | `page.locator('.modal')`                       | `modalLogin`                     |
