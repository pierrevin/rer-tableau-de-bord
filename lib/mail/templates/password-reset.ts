export function buildPasswordResetTemplate(options: {
  resetUrl: string;
}): { subject: string; text: string; html: string } {
  const subject = "Réinitialisation de votre mot de passe";
  const text = [
    "Bonjour,",
    "",
    "Vous avez demandé la réinitialisation de votre mot de passe.",
    `Utilisez ce lien (valide 60 minutes) : ${options.resetUrl}`,
    "",
    "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
  ].join("\n");

  const html = `<p>Bonjour,</p><p>Vous avez demandé la réinitialisation de votre mot de passe.</p><p><a href="${options.resetUrl}">Réinitialiser mon mot de passe</a> (valide 60 minutes)</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`;

  return { subject, text, html };
}
