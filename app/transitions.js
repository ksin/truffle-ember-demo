export default function(){
  // Add your transitions here, like:
  //   this.transition(
  //     this.fromRoute('people.index'),
  //     this.toRoute('people.detail'),
  //     this.use('toLeft'),
  //     this.reverse('toRight')
  //   );
  this.transition(
    this.hasClass('vote-input'),

    // this makes our rule apply when the liquid-if transitions to the
    // true state.
    this.toValue(true),
    this.use('crossFade', {duration: 500})
  );

  this.transition(
    this.hasClass('candidate-vote'),
    this.use('crossFade', {duration: 2000})
  );

}
