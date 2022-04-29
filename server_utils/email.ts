export const templates = {
  login_code: "login_code",
};

export const constructBody = (
  { template, from = "Tuteria <automated@tuteria.com>", to, data },
  newEmail?: string
) => {
  let result = {
    backend: "postmark_backend",
    template: template,
    from_mail: from,
    to: [newEmail || to],
    context: [data],
  };
  return result;
};

export const sendClientLoginCodes = (email, code) => {
  let data = { code };
  return constructBody({
    template: templates.login_code,
    to: email,
    data,
  });
};
