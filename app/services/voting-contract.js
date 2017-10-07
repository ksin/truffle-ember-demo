import Service from 'ember-service';
import inject from 'ember-service/inject';
import votingArtifacts from 'truffle-ember/contracts/Voting';
import { default as contract } from 'npm:truffle-contract';
import computed from 'ember-computed';
import get from 'ember-metal/get';

export default Service.extend({
  web3: inject(),

  instance: computed({
    get() {
      const currentProvider = get(this, 'web3.instance').currentProvider;
      const contractInstance = contract(votingArtifacts);

      contractInstance.setProvider(currentProvider);
      return contractInstance;
    }
  })
});
