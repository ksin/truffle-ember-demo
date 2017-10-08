import Ember from 'ember';
import inject from 'ember-service/inject';
import get from 'ember-metal/get';

export default Ember.Helper.extend({
  web3: inject(),

  compute() {
    const web3 = get(this, 'web3.instance');
    return !!(web3 && web3.currentProvider);
  }
});
