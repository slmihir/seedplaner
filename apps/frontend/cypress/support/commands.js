// custom commands can go here
Cypress.Commands.add('loginViaApi', (email, password) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('API_BASE') || 'http://localhost:4000'}/api/auth/login`,
    body: { email, password }
  }).then((res) => {
    const { token, user } = res.body;
    Cypress.env('authToken', token);
    return user;
  });
});
