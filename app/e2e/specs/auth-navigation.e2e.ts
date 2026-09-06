describe("Navegación entre Login y Register", () => {
  it("permite ir de Login a Register y volver sin perder la pantalla correcta", async () => {
    const loginHeading = await $("~login-heading");
    await loginHeading.waitForDisplayed({ timeout: 30000 });

    const registerLink = await $("~login-register-link");
    await registerLink.click();

    const registerHeading = await $("~register-heading");
    await registerHeading.waitForDisplayed({ timeout: 15000 });
    await expect(registerHeading).toHaveText("Creá tu cuenta");
    await expect($("~register-email-input")).toBeDisplayed();
    await expect($("~register-password-input")).toBeDisplayed();
    await expect($("~register-confirm-password-input")).toBeDisplayed();

    const loginLink = await $("~register-login-link");
    await loginLink.click();

    const loginHeadingAgain = await $("~login-heading");
    await loginHeadingAgain.waitForDisplayed({ timeout: 15000 });
    await expect(loginHeadingAgain).toHaveText("Bienvenido de nuevo");
  });
});
