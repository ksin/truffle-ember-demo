import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('buy-tokens', 'Integration | Component | buy tokens', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{buy-tokens}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#buy-tokens}}
      template block text
    {{/buy-tokens}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
