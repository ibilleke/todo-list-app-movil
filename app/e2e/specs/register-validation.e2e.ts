describe("Validación de registro", () => {
  it("muestra un error cuando las contraseñas no coinciden, sin llamar a Firebase", async () => {
    const registerLink = await $("~login-register-link");
    await registerLink.waitForDisplayed({ timeout: 30000 });
    await registerLink.click();

    const emailInput = await $("~register-email-input");
    const passwordInput = await $("~register-password-input");
    const confirmPasswordInput = await $("~register-confirm-password-input");
    const submitButton = await $("~register-submit-button");

    await emailInput.waitForDisplayed({ timeout: 15000 });
    await emailInput.setValue("nuevo-usuario@example.com");
    await passwordInput.setValue("clave123");
    await confirmPasswordInput.setValue("clave-distinta");
    await submitButton.click();

    const errorText = await $("~register-error-text");
    await errorText.waitForDisplayed({ timeout: 15000 });
    await expect(errorText).toHaveText("Las contraseñas no coinciden");

    // Validación es 100% cliente: nunca navega a TaskList aunque falle el submit.
    await expect($("~register-heading")).toBeDisplayed();
  });
});
