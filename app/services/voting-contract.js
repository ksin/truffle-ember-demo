import Service from 'ember-service';
import inject from 'ember-service/inject';
import votingArtifacts from 'truffle-ember-demo/contracts/Voting';
import { default as contract } from 'npm:truffle-contract';
import computed from 'ember-computed';
import get from 'ember-metal/get';
import { task } from 'ember-concurrency';

export default Service.extend({
  web3: inject(),

  instance: computed('web3.instance', {
    get() {
      const currentProvider = get(this, 'web3.instance').currentProvider;
      const contractInstance = contract(votingArtifacts);

      contractInstance.setProvider(currentProvider);
      return contractInstance;
    }
  }),

  deployed: task(function * () {
    return yield get(this, 'instance').deployed();
  })
});
