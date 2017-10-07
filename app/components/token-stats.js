import Ember from 'ember';
import inject from 'ember-service/inject';
import get from 'ember-metal/get';
import { task } from 'ember-concurrency';

export default Ember.Component.extend({
  votingContract: inject(),
  web3: inject(),

  loadTokenStats: task(function * () {
    const web3 = get(this, 'web3.instance');
    const Voting = get(this, 'votingContract.instance');

    const contractInstance = yield Voting.deployed();

    const tokensTotal = yield contractInstance.totalTokens();
    const tokensSold = yield contractInstance.tokensSold();
    const pricePerToken = yield contractInstance.tokenPrice();
    const balanceInContract = yield this._promisifyGetBalance(web3.eth.getBalance, contractInstance);

    return {
      tokensTotal: tokensTotal.toNumber(),
      tokensSold: tokensSold.toNumber(),
      pricePerToken: parseFloat(web3.fromWei(pricePerToken.toNumber())),
      balanceInContract: web3.fromWei(balanceInContract.toNumber())
    }
  }).on('init'),

  _promisifyGetBalance(getBalance, contractInstance) {
    const web3 = get(this, 'web3.instance');

    return new Promise((resolve, reject) => {
      getBalance(contractInstance.address, (error, result) => {
        if (error) { reject(error); }
        resolve(result);
      });
    });
  }
});
