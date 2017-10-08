/* globals web3 */
import Service from 'ember-service';
import computed from 'ember-computed';

export default Service.extend({
  instance: computed({
    get() {
      if (typeof web3 !== 'undefined' && web3.currentProvider) {
        return web3;
      }
    }
  })
});
