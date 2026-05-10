# REST Assured — Java DSL Guideline

> How to use [REST Assured](https://rest-assured.io/) — the de-facto Java DSL for HTTP API testing — alongside this repo's TypeScript [`tests/api/`](../../tests/api/). Same 5-step assertion shape, different language. Pinned to **REST Assured 5.4.x** (cross-checked May 2026); flag any DSL drift in a PR.

## Why a Java tool exists in a TS repo

This repo's automation is TypeScript-first, but most QA orgs in the wild are **multi-language**: a back-end team writes services in Java/Kotlin, a Spring Boot project ships unit + integration tests in JUnit 5, and the natural API testing surface for that team is REST Assured — not Postman, not Playwright.

This guideline exists so that **when a Java service joins the testing scope** (microservice provider, partner integration, internal platform API), the team gets the same evidence shape, the same tag taxonomy, and the same dashboard wiring as the TS lane. Don't import REST Assured into the TS world; **don't** import Playwright into the Java world. Bridge them via the shared CI artifacts (JUnit XML + Allure JSON).

## When to reach for REST Assured

Use REST Assured when:

- 🍵 The **service under test is JVM-native** (Spring Boot, Quarkus, Micronaut, Dropwizard) and the service team owns the tests
- 🧪 The team already runs **JUnit 5 / TestNG** for unit tests; one runner, one report, one IDE integration
- 🔁 You need to **share fixtures with the production code** (test-containers, Spring `@MockBean`, JPA test data builders)
- 🔐 You're testing **JVM-specific auth flows** (Spring Security, OAuth2 client credentials with the Spring `WebClient`)
- 📦 The artifact under test is a **`.jar` / `.war`** that runs locally via Test Containers in the same JUnit lifecycle

Avoid REST Assured when:

- 🚫 The endpoint is already in [`tests/api/`](../../tests/api/) — don't fork the contract across two languages
- 🚫 The team does **not** already own a JVM build (don't introduce Maven/Gradle just to run API tests; use Playwright or [Supertest](./supertest.md))
- 🚫 You need **AI-assisted authoring** — the in-repo skills ([`api-fuzzer-generator`](../../.agents/skills/api-fuzzer-generator/SKILL.md), etc.) target TS
- 🚫 You're tempted to drive a **browser** through it — REST Assured is HTTP-only; that's Playwright's lane

## Position vs the other API tools

| Concern | REST Assured | [Postman](./postman.md) | [`tests/api/`](../../tests/api/) (Playwright) | [Supertest](./supertest.md) |
|---|---|---|---|---|
| **Language** | Java / Kotlin / Groovy | n/a (JS in script tabs) | TypeScript | TypeScript / JavaScript |
| **Runner** | JUnit 5 / TestNG | Postman GUI / Newman | Playwright | Mocha / Jest / Vitest |
| **Best for** | JVM service test suites | Exploration, stakeholder demos | Cross-browser + API regression | Node.js service in-process tests |
| **CI integration** | Maven Surefire / Gradle Test | Newman | Playwright projects | Mocha/Jest in CI |
| **Mocking** | WireMock / MockServer | Postman mock server | Playwright `route()` | nock / MSW |
| **Spec sync** | Manual / Swagger Codegen | Manual / Apidog | [`openapi-spec-generation`](../../.agents/skills/openapi-spec-generation/SKILL.md) | Manual |

The rule of thumb: **REST Assured for JVM-team-owned API regression**, [`tests/api/`](../../tests/api/) for the cross-language regression gate that runs in this repo's pipeline, [Postman](./postman.md) / [Apidog](./apidog.md) for stakeholder-friendly exploration.

## Project layout (when REST Assured tests live in a sibling repo)

```
<your-jvm-service>/
├── pom.xml                           ← Maven; Gradle equivalent works the same
├── src/
│   ├── main/java/                    ← service code
│   └── test/
│       ├── java/
│       │   └── com/acme/api/
│       │       ├── BaseApiTest.java          ← Abstract base; spec, auth, logging
│       │       ├── CartApiTest.java          ← module:cart  → @P1, @P2 cases
│       │       ├── CheckoutApiTest.java      ← module:checkout
│       │       ├── ProductApiTest.java       ← module:product
│       │       └── support/
│       │           ├── AuthHelper.java        ← login + token capture
│       │           ├── SchemaLoader.java      ← JSON schema resources
│       │           └── TestDataFactory.java   ← analogous to repo's data/
│       └── resources/
│           ├── schemas/                       ← *.schema.json (JSON Schema 2020-12)
│           │   ├── cart.schema.json
│           │   └── product.schema.json
│           ├── application-test.yml           ← Spring profile: test
│           └── junit-platform.properties      ← parallel exec config
└── target/
    ├── surefire-reports/                      ← JUnit XML → dashboard
    └── allure-results/                        ← Allure JSON → trend panel
```

The reason for the layout: **the test sources live with the service**, not in this repo. This repo only consumes the JUnit XML produced by their CI (see §CI integration).

## Maven dependency block

Pinned versions (May 2026 compatible). Run `mvn versions:display-dependency-updates` quarterly per [`training/track-p-people-and-management/p04-running-qa-program-at-scale.md`](../../training/track-p-people-and-management/p04-running-qa-program-at-scale.md) §"Build vs buy".

```xml
<dependencies>
  <!-- REST Assured core -->
  <dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <version>5.4.0</version>
    <scope>test</scope>
  </dependency>

  <!-- JSON path / XML path matchers -->
  <dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>json-path</artifactId>
    <version>5.4.0</version>
    <scope>test</scope>
  </dependency>

  <!-- JSON Schema validation (Draft 2020-12) -->
  <dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>json-schema-validator</artifactId>
    <version>5.4.0</version>
    <scope>test</scope>
  </dependency>

  <!-- JUnit 5 -->
  <dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.2</version>
    <scope>test</scope>
  </dependency>

  <!-- Allure (for the trend panel + traceability) -->
  <dependency>
    <groupId>io.qameta.allure</groupId>
    <artifactId>allure-rest-assured</artifactId>
    <version>2.27.0</version>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>io.qameta.allure</groupId>
    <artifactId>allure-junit5</artifactId>
    <version>2.27.0</version>
    <scope>test</scope>
  </dependency>

  <!-- Test Containers (for spinning the service + its DB locally) -->
  <dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>1.19.7</version>
    <scope>test</scope>
  </dependency>

  <!-- WireMock for stubbing 3rd-party APIs (parallel to api-testing-mock skill) -->
  <dependency>
    <groupId>org.wiremock</groupId>
    <artifactId>wiremock-standalone</artifactId>
    <version>3.5.4</version>
    <scope>test</scope>
  </dependency>
</dependencies>
```

## Base class — the equivalent of [`pages/base-page.ts`](../../pages/base-page.ts)

Every test extends this. It holds the same three concerns the TS base does: shared spec, shared auth, shared logging.

```java
package com.acme.api;

import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.specification.RequestSpecification;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;

import static io.restassured.config.RestAssuredConfig.config;
import static io.restassured.config.LogConfig.logConfig;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class BaseApiTest {

    protected static RequestSpecification spec;

    @BeforeAll
    void setUpSpec() {
        // Mirror profiles/.env.<ENV> via the JVM property -DENV=qa|uat|prod
        String env = System.getProperty("ENV", "qa");
        String baseUrl = switch (env) {
            case "qa"   -> "https://opencart-qa.example.com";
            case "uat"  -> "https://opencart-uat.example.com";
            case "prod" -> "https://opencart.example.com";
            default     -> throw new IllegalArgumentException("Unknown env: " + env);
        };

        spec = new RequestSpecBuilder()
                .setBaseUri(baseUrl)
                .setBasePath("/index.php?route=")
                .setContentType("application/x-www-form-urlencoded")
                .addFilter(new AllureRestAssured())             // → allure-results/*.json
                .build();

        // Log only on failure; never log secrets unconditionally
        RestAssured.config = config().logConfig(
                logConfig().enableLoggingOfRequestAndResponseIfValidationFails()
        );
    }
}
```

## A `@P1` happy path — the 5-step assertion shape in Java

The shape **must match** [`tests/api/test-cart.spec.ts`](../../tests/api/test-cart.spec.ts) and [`automation-framework/assertions.md`](../automation-framework/assertions.md). Reviewers compare the two by eye; drift between them is a defect.

```java
package com.acme.api;

import io.qameta.allure.*;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.given;
import static io.restassured.module.jsv.JsonSchemaValidator.matchesJsonSchemaInClasspath;
import static org.hamcrest.Matchers.*;

@Epic("module:cart")
@Feature("Add to cart")
@Tag("P1") @Tag("critical") @Tag("regression")     // ↔ prompts/core/test-tags.md
public class CartApiTest extends BaseApiTest {

    @Test
    @TmsLink("TC-CART-01")                          // ↔ documents/manual-testcases/
    @Story("Happy path: valid product, qty=1, returns success + total")
    void addProductToCart_returnsSuccess() {
        long start = System.currentTimeMillis();

        var response = given()
                .spec(spec)
                .formParam("product_id", 40)
                .formParam("quantity", 1)
                .when()
                .post("checkout/cart/add")
                .then()
                .extract().response();

        long elapsed = System.currentTimeMillis() - start;

        // 1. Status
        Assertions.assertEquals(200, response.statusCode(), "Status code");

        // 2. Response time budget (matches assertToBeLessThan in repo)
        Assertions.assertTrue(elapsed < 2000, "Response under 2s — was " + elapsed + "ms");

        // 3. Payload size sanity
        Assertions.assertTrue(response.body().asByteArray().length > 0, "Body non-empty");

        // 4. Schema (matches Assertions.assertSchemaByType)
        response.then().body(matchesJsonSchemaInClasspath("schemas/cart-add.schema.json"));

        // 5. Data correctness (matches assertToContainText)
        response.then()
                .body("success", containsString("HTC Touch HD"))
                .body("total", not(emptyString()));
    }
}
```

The schema file lives at `src/test/resources/schemas/cart-add.schema.json` and **is the same JSON** the TS lane uses (move it to a shared repo or copy with a tracking comment; never let them diverge silently).

## Negative + boundary cases

When porting from the [`api-fuzzer-generator`](../../.agents/skills/api-fuzzer-generator/SKILL.md) skill output, REST Assured uses JUnit 5 parameterised tests:

```java
@ParameterizedTest(name = "qty={0} → status {1}")
@CsvSource({
    "0,    400",     // boundary: zero
    "-1,   400",     // negative
    "9999, 422",     // boundary: above stock
    "abc,  400",     // type-mismatch
})
@Tag("P2") @Tag("major")
void addToCart_invalidQuantity_isRejected(String qty, int expectedStatus) {
    given().spec(spec)
        .formParam("product_id", 40)
        .formParam("quantity", qty)
    .when()
        .post("checkout/cart/add")
    .then()
        .statusCode(expectedStatus);
}
```

Anti-patterns:

- ❌ `.statusCode(anyOf(is(400), is(422)))` — accepts both; means you don't know which is correct
- ❌ One `@Test` covering 6 scenarios — split via `@ParameterizedTest`
- ❌ `Thread.sleep(2000)` to "wait for the cart" — use `Awaitility` or fix the underlying race

## Auth — login once per class, reuse the token

Match the in-repo [`fixtures/auth.fixture.ts`](../../fixtures/auth.fixture.ts) pattern: log in once, reuse, never put credentials in test code.

```java
package com.acme.api.support;

import io.restassured.specification.RequestSpecification;

import static io.restassured.RestAssured.given;

public final class AuthHelper {
    private static String cachedToken;

    public static String token(RequestSpecification spec) {
        if (cachedToken != null) return cachedToken;

        cachedToken = given().spec(spec)
                .formParam("email",    System.getenv("USERNAME"))
                .formParam("password", System.getenv("PASSWORD"))
                .when().post("account/login")
                .then().statusCode(200)
                .extract().path("token");

        return cachedToken;
    }
}
```

Use it as:

```java
.header("Authorization", "Bearer " + AuthHelper.token(spec))
```

**Secrets:** never `@Value("${api.password}")` from `application.yml` — read from env vars (`System.getenv`) so secrets stay outside the artefact. Same rule as `profiles/.env.<ENV>` on the TS side.

## Schema validation against an OpenAPI / Swagger spec

If the team owns an OpenAPI spec, validate against it directly so REST Assured tests automatically catch schema drift:

```java
import io.swagger.parser.OpenAPIParser;

@Test
void productSchema_matchesOpenApi() {
    var openApi = new OpenAPIParser().readLocation("openapi.yaml", null, null).getOpenAPI();
    var schema = openApi.getComponents().getSchemas().get("Product");

    given().spec(spec)
    .when().get("product/40")
    .then().body(matchesJsonSchema(schema));
}
```

This is the equivalent of [`openapi-spec-generation`](../../.agents/skills/openapi-spec-generation/SKILL.md) on the TS side.

## CI integration — emit JUnit + Allure to the shared dashboard

The dashboard at [`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html) consumes JUnit XML from any source. The JVM service's CI must:

1. Run `mvn -DENV=qa test` (or `gradle test`).
2. Upload `target/surefire-reports/*.xml` to the **same artifact path** the TS lane uses (`reports/api/junit.xml`).
3. Upload `target/allure-results/` so the trend panel works across both languages.

GitHub Actions snippet (lives in the JVM service repo, not this one):

```yaml
name: api-tests
on: [push, pull_request]

jobs:
  rest-assured:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'
      - name: Run REST Assured
        env:
          USERNAME: ${{ secrets.QA_USERNAME }}
          PASSWORD: ${{ secrets.QA_PASSWORD }}
        run: mvn -B -DENV=qa test
      - name: Upload JUnit XML for dashboard
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: junit-rest-assured
          path: target/surefire-reports/*.xml
      - name: Upload Allure results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-rest-assured
          path: target/allure-results/
```

Failure routing follows the same loop as the TS lane: defects via [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill, flake triage via [`flaky-test-triage`](../../.agents/skills/flaky-test-triage/SKILL.md). The bug-label rules in [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) apply unchanged.

## Parallel execution

JUnit 5 parallelism, configured in `src/test/resources/junit-platform.properties`:

```properties
junit.jupiter.execution.parallel.enabled = true
junit.jupiter.execution.parallel.mode.default = concurrent
junit.jupiter.execution.parallel.mode.classes.default = concurrent
junit.jupiter.execution.parallel.config.strategy = dynamic
junit.jupiter.execution.parallel.config.dynamic.factor = 0.75
```

Test isolation rules apply (parallel to [`parallel-sharding`](../../.agents/skills/parallel-sharding/SKILL.md)):

- ❌ Static mutable state across tests
- ❌ A shared cart resource that two tests both write to
- ✅ Per-test data builder; per-test user (createUser fixture); per-test idempotent assertions

## Logging & traces

REST Assured prints raw request/response on failure if you wire it as in `BaseApiTest` above. For deeper debugging:

- **WireMock recording mode** to capture a real upstream response and replay it deterministically.
- **MockServer expectation diffs** when an integration partner changes their contract — same role as Playwright traces in the TS lane.

## Anti-patterns this guideline rules out

- ❌ Importing REST Assured into a Node-only service "to standardise"
- ❌ Running REST Assured in this repo's CI (it has its own pipeline; bridge by JUnit XML upload, don't fork the build)
- ❌ Reusing production code's auth secrets in test code (separate test-tier credentials)
- ❌ `String json = "{...long string...}"` request bodies — use a `Map<String,Object>` or a Jackson POJO
- ❌ Validating only `statusCode(200)` and calling it a test (need the 5-step shape)
- ❌ Hand-rolled JSON Schema strings inside test source — load from `src/test/resources/schemas/` so the TS lane can share them

## Promotion path

REST Assured tests **stay** in the JVM service repo; they don't migrate to [`tests/api/`](../../tests/api/). The migration that does happen:

1. **JVM team owns its tests in REST Assured** for fast inner-loop and JVM-native fixtures.
2. **This repo's [`tests/api/`](../../tests/api/) covers the same endpoints** at the contract level for cross-language regression.
3. **Shared schema + JUnit XML** is the bridge — both sides assert against the same shape, the dashboard merges both result streams.

If you're tempted to drop one side, you're either creating a **single point of failure** (only the JVM lane sees JVM-specific concurrency bugs) or **wasting effort** (re-implementing the same case in two languages). The right answer is contract-level overlap with deliberate division of labour: see [`pact.md`](./pact.md) for the consumer-driven contract pattern that makes this safe.

## Related

- [`README.md`](./README.md) — folder index
- [`postman.md`](./postman.md), [`apidog.md`](./apidog.md) — GUI authoring lanes
- [`supertest.md`](./supertest.md) — Node.js equivalent (in-process Express/Fastify)
- [`pact.md`](./pact.md) — contract testing layer that bridges JVM ↔ TS
- [`tool-comparison.md`](./tool-comparison.md) — when-to-use matrix (now includes REST Assured / Supertest / Pact)
- [`tests/api/test-cart.spec.ts`](../../tests/api/test-cart.spec.ts) — the 5-step assertion shape in TypeScript
- [`automation-framework/assertions.md`](../automation-framework/assertions.md) — the underlying `Assertions` helper
- [`.agents/skills/api-fuzzer-generator/SKILL.md`](../../.agents/skills/api-fuzzer-generator/SKILL.md), [`.agents/skills/api-security-testing/SKILL.md`](../../.agents/skills/api-security-testing/SKILL.md), [`.agents/skills/contract-testing/SKILL.md`](../../.agents/skills/contract-testing/SKILL.md) — agent skills that complement REST Assured
- [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md) — tag taxonomy (P1..P4 + severity) — applies identically in JUnit `@Tag(...)`
