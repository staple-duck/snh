module.exports = async function () {
  if (globalThis.__TEARDOWN_MESSAGE__) {
    console.log(globalThis.__TEARDOWN_MESSAGE__);
  }

  // Cleanup is handled by Docker Compose in test environment
  // No action needed here
};
