Here’s your content converted into a clean Markdown (.md) file format — ready to copy:

# TypeScript Basic Outline for Fresher Automation QA

---

## 🟦 1. What is TypeScript?
- Superset of JavaScript
- Adds **static typing**
- Compiles → JavaScript

### Why QA Automation uses it:
- Prevent bugs early
- Better IDE support (auto-complete)
- Cleaner, maintainable test code

---

## 🟦 2. Basic Setup
```bash
npm init -y
npm install typescript ts-node @types/node --save-dev
npx tsc --init
```

Run file:
```bash
npx ts-node index.ts
```

🟦 3. Basic Types

```bash
let username: string = "khanh";
let age: number = 25;
let isActive: boolean = true;

let skills: string[] = ["manual", "automation"];

let data: any = "can be anything"; // avoid if possible
```

🟦 4. Functions

```bash
function add(a: number, b: number): number {
  return a + b;
}

const login = (user: string, pass: string): boolean => {
  return user === "admin" && pass === "123";
};
```

🟦 5. Object & Type

```bash
type User = {
  username: string;
  password: string;
  role?: string; // optional
};

const user1: User = {
  username: "qa",
  password: "123"
};
```

🟦 6. Interface (Common in Automation)

```bash
interface LoginData {
  username: string;
  password: string;
}

const testUser: LoginData = {
  username: "admin",
  password: "123456"
};
```

Use interface for test data models

🟦 7. Classes (Very Important for POM)

```bash
class LoginPage {
  username: string;

  constructor(username: string) {
    this.username = username;
  }

  login() {
    console.log(`Login with ${this.username}`);
  }
}

const page = new LoginPage("admin");
page.login();
```

🟦 8. Async / Await (Critical for Automation)

```bash
async function fetchData(): Promise<string> {
  return "data loaded";
}

async function run() {
  const data = await fetchData();
  console.log(data);
}
```

🟦 9. Modules (Import / Export)
// user.ts
```bash
export const username = "qa";
```

// main.ts
```bash
import { username } from "./user";
```

🟦 10. Example for Automation (Playwright Style)

```bash
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async login(username: string, password: string) {
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
    await this.page.click('#login');
  }
}
```

🟦 11. Best Practices for Freshers
- Avoid any
- Use type / interface for test data
- Use async/await everywhere
- Follow Page Object Model (POM)
- Keep functions small & reusable
