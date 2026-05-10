
# Here's the cheat sheet formatted as a Markdown table:

| **No** | **Element Type**         | **Naming Convention**       | **Example Locator**                              | **Example Name**           |
|-------:|--------------------------|-----------------------------|--------------------------------------------------|----------------------------|
|      1 | **Button**               | `btn<Description>`          | `page.locator('text=Submit')`                    | `btnSubmit`                |
|      2 | **Input Field**          | `input<Description>`        | `page.locator('#email')`                         | `inputEmail`               |
|      3 | **Textarea**             | `txa<Description>`          | `page.locator('textarea#bio')`                   | `txaBio`                   |
|      4 | **Checkbox**             | `chk<Description>`          | `page.locator('input[type="checkbox"]')`         | `chkAgreeTerms`            |
|      5 | **Radio Button**         | `radio<Description>`        | `page.locator('input[type="radio"]')`            | `radioGenderMale`          |
|      6 | **Dropdown (select)**    | `ddl<Description>`          | `page.locator('select#country')`                 | `ddlCountry`               |
|      7 | **Toggle / Switch**      | `toggle<Description>`       | `page.locator('input[role="switch"]')`           | `toggleDarkMode`           |
|      8 | **Slider / Range**       | `slider<Description>`       | `page.locator('input[type="range"]')`            | `sliderPriceRange`         |
|      9 | **Date Picker**          | `datePicker<Description>`   | `page.locator('input[type="date"]')`             | `datePickerStartDate`      |
|     10 | **File Upload**          | `fileUpload<Description>`   | `page.locator('input[type="file"]')`             | `fileUploadAvatar`         |
|     11 | **Label**                | `lbl<Description>`          | `page.locator('label[for="email"]')`             | `lblEmail`                 |
|     12 | **Link**                 | `lnk<Description>`          | `page.locator('text=Home')`                      | `lnkHome`                  |
|     13 | **Icon**                 | `ico<Description>`          | `page.locator('i.fa-search')`                    | `icoSearch`                |
|     14 | **Image**                | `img<Description>`          | `page.locator('img[alt="Profile Picture"]')`     | `imgProfilePicture`        |
|     15 | **Avatar**               | `avatar<Description>`       | `page.locator('img.user-avatar')`                | `avatarUser`               |
|     16 | **Heading**              | `hdr<Description>`          | `page.locator('h1')`                             | `hdrMainTitle`             |
|     17 | **Paragraph**            | `p<Description>`            | `page.locator('p.intro')`                        | `pIntroText`               |
|     18 | **Span**                 | `span<Description>`         | `page.locator('span.badge')`                     | `spanBadgeCount`           |
|     19 | **Div**                  | `div<Description>`          | `page.locator('div.container')`                  | `divMainContainer`         |
|     20 | **Section**              | `section<Description>`      | `page.locator('section#hero')`                   | `sectionHero`              |
|     21 | **Header (Page)**        | `header<Description>`       | `page.locator('header.site-header')`             | `headerSite`               |
|     22 | **Footer (Page)**        | `footer<Description>`       | `page.locator('footer.site-footer')`             | `footerSite`               |
|     23 | **Navigation Bar**       | `nav<Description>`          | `page.locator('nav.navbar')`                     | `navTop`                   |
|     24 | **Sidebar**              | `sidebar<Description>`      | `page.locator('aside.sidebar')`                  | `sidebarFilters`           |
|     25 | **Menu**                 | `menu<Description>`         | `page.locator('nav.main-menu')`                  | `menuMain`                 |
|     26 | **Menu Item**            | `menuItem<Description>`     | `page.locator('nav.main-menu a')`                | `menuItemHome`             |
|     27 | **Breadcrumb**           | `breadcrumb<Description>`   | `page.locator('.breadcrumb')`                    | `breadcrumbProductDetails` |
|     28 | **Tab**                  | `tab<Description>`          | `page.locator('[role="tab"]')`                   | `tabProfile`               |
|     29 | **Tab Panel**            | `panel<Description>`        | `page.locator('[role="tabpanel"]')`              | `panelProfile`             |
|     30 | **Accordion**            | `accordion<Description>`    | `page.locator('.accordion-item')`                | `accordionFAQ`             |
|     31 | **Pagination**           | `pagination<Description>`   | `page.locator('.pagination')`                    | `paginationProducts`       |
|     32 | **Stepper**              | `stepper<Description>`      | `page.locator('.stepper')`                       | `stepperCheckout`          |
|     33 | **Card**                 | `card<Description>`         | `page.locator('.product-card')`                  | `cardProduct`              |
|     34 | **Badge / Pill**         | `badge<Description>`        | `page.locator('.badge.badge-success')`           | `badgeCartCount`           |
|     35 | **Chip / Tag**           | `chip<Description>`         | `page.locator('.chip')`                          | `chipFilterCategory`       |
|     36 | **Tooltip**              | `tooltip<Description>`      | `page.locator('[role="tooltip"]')`               | `tooltipInfo`              |
|     37 | **Toast / Alert / Message** | `msg<Description>`       | `page.locator('.alert-success')`                 | `msgSuccess`               |
|     38 | **Progress Bar**         | `progress<Description>`     | `page.locator('progress#upload')`                | `progressUpload`           |
|     39 | **Spinner / Loader**     | `spinner<Description>`      | `page.locator('.spinner')`                       | `spinnerPageLoad`          |
|     40 | **List (ul/ol)**         | `list<Description>`         | `page.locator('ul.menu')`                        | `listMenuItems`            |
|     41 | **List Item**            | `item<Description>`         | `page.locator('ul.menu li:first-child')`         | `itemFirstMenuItem`        |
|     42 | **Table**                | `tbl<Description>`          | `page.locator('table#userList')`                 | `tblUserList`              |
|     43 | **Table Row**            | `row<Description>`          | `page.locator('table#userList tr')`              | `rowUserListFirst`         |
|     44 | **Table Cell**           | `cell<Description>`         | `page.locator('table#userList td:nth-child(2)')` | `cellUserListName`         |
|     45 | **Form**                 | `form<Description>`         | `page.locator('form#loginForm')`                 | `formLogin`                |
|     46 | **Modal / Dialog**       | `modal<Description>`        | `page.locator('[role="dialog"]')`                | `modalLogin`               |
|     47 | **Iframe**               | `iframe<Description>`       | `page.locator('iframe[name="payment"]')`         | `iframePayment`            |
|     48 | **Video**                | `video<Description>`        | `page.locator('video.player')`                   | `videoProductDemo`         |
|     49 | **Audio**                | `audio<Description>`        | `page.locator('audio')`                          | `audioPodcast`             |
|     50 | **Canvas**               | `canvas<Description>`       | `page.locator('canvas')`                         | `canvasChart`              |
