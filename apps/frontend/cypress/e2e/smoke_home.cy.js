/// <reference types="cypress" />

describe('Homepage smoke test', () => {
  it('loads the app shell', () => {
    cy.visit('/');
    // Expect at least the navigation or page header text to be present
    cy.contains('Projects').should('exist');
  });
});


