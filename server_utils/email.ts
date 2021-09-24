export const templates = {
  login_code: "login_code",
};

const constructBody = (
  { template, from = "Tuteria <automated@tuteria.com>", to, data }
) => {
  let result = {
    backend: "postmark_backend",
    template: template,
    from_mail: from,
    to: [to],
    context: [data],
  };
  return result;
};

export const sendClientLoginCodes = (email, code) => {
  let data = {code};
  return constructBody({
    template: templates.login_code,
    to: email,
    data,
  });
};
