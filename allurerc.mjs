// Allure Report 3 configuration — auto-discovered by the CLI at the project root.
// Schema: https://allurereport.org/docs/installation-config/

export default {
  // The default page <title> for the generated HTML report.
  name: 'Automation Testing Report',
  // Output directory for `allure generate`. Single source of truth — do NOT also
  // pass `-o`/`--output` from package.json scripts (it would override this).
  output: './allure-report',
  plugins: {
    awesome: {
      options: {
        // Heading shown inside the report.
        reportName: 'Daily Regression Report',
        logo: 'https://github.com/khanhdodang/ai-qa-training/blob/main/assets/kd.jpg?raw=true',
      },
    },
  },
};
