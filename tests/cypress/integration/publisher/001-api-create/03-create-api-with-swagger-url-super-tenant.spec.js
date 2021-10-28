/*
 * Copyright (c) 2021, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *  
 * http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
describe("Create api with swagger file super tenant", () => {
    const username = 'admin'
    const password = 'admin'
    beforeEach(function () {
        cy.loginToPublisher(username, password)
    })

    it("Create API from swagger from file openapi 2", () => {
        cy.visit(`/publisher/apis`);
        // select the option from the menu item
        cy.get('[data-testid="itest-id-createapi"]').click();
        cy.get('[data-testid="create-api-open-api"]').click();
        cy.get('[data-testid="open-api-url-select-radio"]').click();

        // provide the swagger url
        cy.get('[data-testid="swagger-url-endpoint"]').type('https://petstore.swagger.io/v2/swagger.json');
        // go to the next step
        cy.get('[data-testid="url-validated"]', { timeout: 30000 });
        cy.get('[data-testid="api-create-next-btn"]').click();
        cy.get('[data-testid="itest-id-apiversion-input"] input[type="text"]', { timeout: 30000 });
        cy.document().then((doc) => {
            const version = doc.querySelector('[data-testid="itest-id-apiversion-input"] input[type="text"]').value;
            cy.get('[data-testid="itest-id-apiversion-input"] input[type="text"]').click();

            // finish the wizard
            cy.get('[data-testid="api-create-finish-btn"]').click();

            // validate
            cy.get('[data-testid="itest-api-name-version"]', { timeout: 30000 }).contains(version);
        });
    });

    it("Create API from swagger from file openapi 3", () => {
        cy.visit(`/publisher/apis`);
        // select the option from the menu item
        cy.get('[data-testid="itest-id-createapi"]').click();
        cy.get('[data-testid="create-api-open-api"]').click();
        cy.get('[data-testid="open-api-url-select-radio"]').click();

        // upload the swagger
        cy.get('[data-testid="swagger-url-endpoint"]').type('https://petstore3.swagger.io/api/v3/openapi.json');
        // go to the next step
        cy.get('[data-testid="url-validated"]', { timeout: 30000 });
        cy.get('[data-testid="api-create-next-btn"]').click();

        cy.get('[data-testid="itest-id-apiversion-input"] input[type="text"]', { timeout: 30000 });
        cy.document().then((doc) => {
            cy.get('[data-testid="itest-id-apicontext-input"] input[type="text"]').type('petstore3');
            cy.get('[data-testid="itest-id-apiversion-input"] input[type="text"]').click();
            const version = doc.querySelector('[data-testid="itest-id-apiversion-input"] input[type="text"]').value;

            // finish the wizard
            cy.get('[data-testid="api-create-finish-btn"]').click();
  
            // validate
            cy.get('[data-testid="itest-api-name-version"]', { timeout: 30000 });
            cy.get('[data-testid="itest-api-name-version"]').contains(version);
        });
    });

    afterEach(function () {
        // Test is done. Now delete the api
        cy.get(`[data-testid="itest-id-deleteapi-icon-button"]`).click();
        cy.get(`[data-testid="itest-id-deleteconf"]`).click();
    })
})