/// <reference types="cypress" />

const EMAIL = 'admin@example.com';
const PASSWORD = 'admin123';

describe('Projects page integration', () => {
  it('logs in and renders project list from backend', () => {
    cy.loginViaApi(EMAIL, PASSWORD).then(() => {
      const token = Cypress.env('authToken');
      // Inject token before the app loads to pass ProtectedRoute
      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', token);
        }
      });
    });

    // Should show Projects header
    cy.contains('Projects');

    // Should render at least one project from backend
    cy.get('li.MuiListItem-root').should('exist');

    // Create a project via UI to ensure frontend calls backend and updates list
    const key = `CYP-${Date.now().toString().slice(-4)}`;
    const name = `Cypress Project ${Date.now()}`;
    cy.contains('label', 'Key').invoke('attr', 'for').then((id) => {
      cy.get(`#${id}`).clear().type(key);
    });
    cy.contains('label', 'Name').invoke('attr', 'for').then((id) => {
      cy.get(`#${id}`).clear().type(name);
    });
    cy.contains('button', 'Create').click();

    // Assert the new project appears in the list ("KEY — Name")
    cy.contains(`${key} — ${name}`).should('exist');
  });

  it('shows an error alert when backend is unreachable', () => {
    // Ensure no token so app still tries to fetch after login attempt
    cy.clearLocalStorage('token');
    // Intercept to force a network error on projects fetch
    cy.intercept('GET', '**/api/projects', { forceNetworkError: true }).as('projects');
    // Visit login and authenticate via UI to redirect to '/'
    cy.visit('/login');
    cy.get('input[type="email"]').type(EMAIL);
    cy.get('input[type="password"]').type(PASSWORD);
    cy.contains('button', 'Login').click();
    cy.wait('@projects');
    cy.contains('Failed to load projects').should('exist');
  });
});
