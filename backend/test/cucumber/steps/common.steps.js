//Then, Given, When parecidos

import { Then } from '@cucumber/cucumber';
import assert from 'node:assert';

Then('la respuesta tiene estado {int}', function (status) {
  assert.equal(this.response.status, status);
});