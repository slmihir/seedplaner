/// <reference types="cypress" />

const EMAIL = 'admin@example.com';
const PASSWORD = 'admin123';

function apiBase() {
  return Cypress.env('API_BASE') || 'http://localhost:4000';
}

describe('Project -> Issue create & list flow', () => {
  it('creates a project via API, then creates an issue via UI and sees it listed', () => {
    cy.loginViaApi(EMAIL, PASSWORD).then(() => {
      const token = Cypress.env('authToken');
      const key = `CYP${Date.now().toString().slice(-4)}`;
      const name = `Cypress E2E ${Date.now()}`;

      // Create a project via API so we have a stable target
      cy.request({
        method: 'POST',
        url: `${apiBase()}/api/projects`,
        headers: { Authorization: `Bearer ${token}` },
        body: { key, name }
      }).then((res) => {
        const projectId = res.body.project._id;
        const title = `Issue ${Date.now()}`;

        // Visit Issues filtered by this project with token pre-loaded
        cy.visit(`/issues?project=${projectId}`, {
          onBeforeLoad(win) {
            win.localStorage.setItem('token', token);
          }
        });

        // Fill title only (project preselected by query param, type default is task)
        cy.get('input[label="Title"], input[name="Title"], input').first().clear().type(title);
        cy.contains('button', 'Create').click();

        // Assert the new issue appears in the list
        cy.contains(title).should('exist');
      });
    });
  });
});


