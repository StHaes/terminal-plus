export default {
  import: ["e2e/steps/**/*.ts", "e2e/support/**/*.ts"],
  paths: ["e2e/features/**/*.feature"],
  format: [
    "progress-bar",
    "html:e2e/reports/report.html",
  ],
  publishQuiet: true,
};
