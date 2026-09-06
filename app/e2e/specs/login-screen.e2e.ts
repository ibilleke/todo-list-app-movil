describe("Login screen", () => {
  it("muestra el formulario de login al iniciar la app", async () => {
    const heading = await $("~login-heading");
    await heading.waitForDisplayed({ timeout: 30000 });
    await expect(heading).toHaveText("Bienvenido de nuevo");

    const emailInput = await $("~login-email-input");
    const passwordInput = await $("~login-password-input");
    const submitButton = await $("~login-submit-button");

    await expect(emailInput).toBeDisplayed();
    await expect(passwordInput).toBeDisplayed();
    await expect(submitButton).toBeDisplayed();
  });

  it("muestra un error al enviar credenciales inválidas", async () => {
    const emailInput = await $("~login-email-input");
    const passwordInput = await $("~login-password-input");
    const submitButton = await $("~login-submit-button");

    await emailInput.setValue("usuario-inexistente@example.com");
    await passwordInput.setValue("clave-incorrecta-123");
    await submitButton.click();

    const errorText = await $("~login-error-text");
    await errorText.waitForDisplayed({ timeout: 30000 });
    await expect(errorText).toBeDisplayed();

    // Sigue en Login: credenciales inválidas nunca deben navegar a TaskList.
    await expect($("~login-heading")).toBeDisplayed();
  });
});
