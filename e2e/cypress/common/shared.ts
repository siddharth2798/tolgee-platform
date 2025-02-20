/// <reference types="cypress" />
import { getAnyContainingAriaLabelAttribute, getInput } from './xPath';
import { Scope } from './types';
import { waitForGlobalLoading } from './loading';
import Value = DataCy.Value;
import Chainable = Cypress.Chainable;

export const allScopes: Scope[] = [
  'keys.edit',
  'translations.edit',
  'translations.view',
];

export const clickAdd = () => {
  cy.wait(100);
  cy.xpath(getAnyContainingAriaLabelAttribute('add')).click();
};

export const getPopover = () => {
  return cy
    .xpath("//*[contains(@class, 'MuiPopover-root')]")
    .filter(':visible')
    .should('be.visible');
};

export const gcy = (dataCy: Value, options?: Parameters<typeof cy.get>[1]) =>
  cy.get('[data-cy="' + dataCy + '"]', options);

export const gcyChain = (...dataCy: Value[]) => {
  let xPath = '.';
  dataCy.forEach((dc) => {
    xPath += '//*[@data-cy="' + dc + '"]';
  });
  return cy.xpath(xPath);
};

export const goToPage = (page: number) =>
  gcy('global-list-pagination').within(() =>
    cy.xpath(".//button[text() = '" + page + "']").click()
  );
export const contextGoToPage = (chainable: Chainable, page: number) =>
  chainable
    .findDcy('global-list-pagination')
    .within(() => cy.xpath(".//button[text() = '" + page + "']").click());

export const clickGlobalSave = () => {
  gcy('global-form-save-button').click();
};

export const confirmHardMode = () => {
  gcy('global-confirmation-hard-mode-text-field').within(() => {
    cy.get('label')
      .then(($label) => {
        cy.get('input').type($label.text().replace('Rewrite text: ', ''));
      })
      .its('text');
  });
  gcy('global-confirmation-confirm').click();
};

export const confirmStandard = () => {
  gcy('global-confirmation-confirm').click();
};

export const assertMessage = (message: string) => {
  return gcy('global-snackbars').should('contain', message);
};

export const assertTooltip = (message: string) => {
  cy.xpath("//*[@role='tooltip']").should('contain', message);
};

export const selectInProjectMenu = (itemName: string) => {
  gcy('project-menu-items').get(`[aria-label="${itemName}"]`).click();
};

export const selectInSelect = (chainable: Chainable, renderedValue: string) => {
  return chainable
    .find('div')
    .first()
    .click()
    .then(() => {
      getPopover().contains(renderedValue).click();
    });
};

export const toggleInMultiselect = (
  chainable: Chainable,
  renderedValues: string[]
) => {
  chainable.find('div').first().click();

  getPopover().within(() => {
    // first select all
    getPopover()
      .get('input')
      .each(
        // cy.xpath(`.//*[text() = '${val}']/ancestor/ancestor::li//input`).each(
        ($input) => {
          const isChecked = $input.is(':checked');
          if (!isChecked) {
            cy.wrap($input).click();
          }
        }
      );

    // unselect necessary
    getPopover()
      .get('.MuiListItemText-primary')
      .each(($label) => {
        const labelText = $label.text();
        if (!renderedValues.includes(labelText)) {
          cy.wrap($label).click();
        }
      });
  });
  cy.get('body').click(0, 0);
  waitForGlobalLoading();
};

export const getInputByName = (name: string): Chainable => {
  return cy.xpath(getInput(name));
};
