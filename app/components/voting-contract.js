import Ember from 'ember';
import inject from 'ember-service/inject';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import { task, timeout } from 'ember-concurrency';
import computed from 'ember-computed';

const GAS_AMOUNT_TO_VOTE = 140000;

export default Ember.Component.extend({
  votingContract: inject(),
  web3: inject(),

  contractInstance: computed('votingContract.deployed', {
    get() {
      return get(this, 'votingContract.deployed').perform();
    }
  }),

  tokensRemaining: computed('tokensTotal', 'tokensSold', {
    get() {
      return get(this, 'tokensTotal') - get(this, 'tokensSold');
    }
  }),

  loadTokenStats: task(function * () {
    const web3 = get(this, 'web3.instance');
    const contractInstance = yield get(this, 'contractInstance');

    const tokensTotal = yield contractInstance.totalTokens();
    const tokensSold = yield contractInstance.tokensSold();
    const tokenPrice = yield contractInstance.tokenPrice();
    const balanceInContract = yield this._promisifiedGetBalance(contractInstance);

    set(this, 'tokensTotal', tokensTotal.toNumber());
    set(this, 'tokensSold', tokensSold.toNumber());
    set(this, 'tokenPrice', Number(web3.fromWei(tokenPrice.toNumber())));
    set(this, 'balanceInContract', web3.fromWei(balanceInContract.toNumber()));
  }).on('init'),

  _promisifiedGetBalance(contractInstance) {
    const web3 = get(this, 'web3.instance');

    return new Promise((resolve, reject) => {
      web3.eth.getBalance(contractInstance.address, (error, result) => {
        if (error) { reject(error); }
        resolve(result);
      });
    });
  },

  purchaseTokens: task(function * (tokensToBuy, tokenPrice) {
    tokensToBuy = Number(tokensToBuy); // convert string input to int

    try {
      const contractInstance = yield get(this, 'contractInstance');
      const web3 = get(this, 'web3.instance');
      const pricePaid = tokensToBuy * tokenPrice;

      yield contractInstance.buy({value: web3.toWei(pricePaid, 'ether'), from: web3.eth.accounts[0]});
      this.incrementProperty('tokensSold', tokensToBuy);
      this.incrementProperty('balanceInContract', pricePaid);
      this.incrementProperty('voterTokensBought', tokensToBuy);
    } catch(e) {
      Ember.Logger.warn(e);
      return e;
    }
  }),

  lookupVoterInfo: task(function * () {
    const web3 = get(this, 'web3.instance');
    const contractInstance = yield get(this, 'contractInstance');
    const voterInfo = yield contractInstance.voterDetails(web3.eth.accounts[0]);

    set(this, 'voterTokensBought', Number(voterInfo[0]));

    yield get(this, 'setVotesPerCandidate').perform(voterInfo[1]);

  }).on('init'),

  // votesArray is an array where each index matches the candidate name index
  setVotesPerCandidate: task(function * (votesArray) {
    let candidateNames = get(this, 'candidateNames');
    if (Ember.isEmpty(candidateNames)) {
      candidateNames = yield get(this, 'populateCandidates').perform();
    }

    const map = {};

    for(let i = 0; i < candidateNames.length; i++) {
      const name = candidateNames[i];
      const vote = votesArray[i];

      map[name] = vote.toNumber();
    }

    set(this, 'votesPerCandidate', map);
  }),

  voterTokensRemaining: computed('voterTokensBought', 'votesPerCandidate', {
    get() {
      const votesPerCandidate = get(this, 'votesPerCandidate');
      if (Ember.isEmpty(votesPerCandidate)) {
        return get(this, 'voterTokensBought') ;
      }

      const sumVotes = Object.values(votesPerCandidate).reduce((acc, inc) => { return acc + inc; });
      return get(this, 'voterTokensBought') - sumVotes;
    }
  }),

  populateCandidates: task(function * () {
    const contractInstance = yield get(this, 'contractInstance');
    const web3 = get(this, 'web3.instance');
    const allCandidates = yield contractInstance.allCandidates();
    const candidateNames = allCandidates.map((candidate) => { return web3.toUtf8(candidate); })

    set(this, 'candidateNames', candidateNames);
    return candidateNames;
  }).on('init'),

  populateVotes: task(function * () {
    let candidateNames = get(this, 'candidateNames');
    if (Ember.isEmpty(candidateNames)) {
      candidateNames = yield get(this, 'populateCandidates').perform();
    }

    const map = {};

    for(let i = 0; i < candidateNames.length; i++) {
      const name = candidateNames[i];
      const vote = yield get(this, 'totalVotesFor').perform(name);

      map[name] = vote.toNumber();
    }

    set(this, 'totalVotesPerCandidate', map);
  }).on('init'),

  totalVotesFor: task(function * (name) {
    const contractInstance = yield get(this, 'contractInstance');

    return yield contractInstance.totalVotesFor(name);
  }),

  voteForCandidate: task(function * (candidateName, voteTokens) {
    try {
      const contractInstance = yield get(this, 'contractInstance');
      const web3 = get(this, 'web3.instance');

      yield contractInstance.voteForCandidate(candidateName, voteTokens, { gas: GAS_AMOUNT_TO_VOTE, from: web3.eth.accounts[0] });

      this.updateCandidateVotes(candidateName, Number(voteTokens));
    } catch(e) {
      Ember.Logger.warn(e);
      return e;
    }
  }),

  updateCandidateVotes(name, votes) {
    const totalVotesPerCandidate = get(this, 'totalVotesPerCandidate');
    const votesPerCandidate = get(this, 'votesPerCandidate');

    set(this, `totalVotesPerCandidate.${name}`, totalVotesPerCandidate[name] + votes);
    set(this, `votesPerCandidate.${name}`, votesPerCandidate[name] + votes);

    // force recomputing this cp because it depends on arbitrary object keys in votesPerCandidate
    this.notifyPropertyChange('voterTokensRemaining');
  }
});
