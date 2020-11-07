class NumbersUtility {
  static beautify(numberToBeautify) {
    if (numberToBeautify < 100) {
      return this.cleanAndAttachPostFix(numberToBeautify, '');
    } else if (numberToBeautify < 10000) {
      return Math.floor(numberToBeautify).toString();
    } else if (numberToBeautify < 1000000) {
      numberToBeautify /= 1000;
      return this.cleanAndAttachPostFix(numberToBeautify, 'k');
    } else if (numberToBeautify < 1000000000) {
      numberToBeautify /= 1000000;
      return this.cleanAndAttachPostFix(numberToBeautify, 'M');
    } else if (numberToBeautify < 1000000000000) {
      numberToBeautify /= 1000000000000;
      return this.cleanAndAttachPostFix(numberToBeautify, 'G');
    } else if (numberToBeautify < 1000000000000000) {
      numberToBeautify /= 1000000000000000;
      return this.cleanAndAttachPostFix(numberToBeautify, 'T');
    }
    return Math.floor(numberToBeautify).toString();
  }

  static cleanAndAttachPostFix(numberToClean, postfix) {
    if (numberToClean % 1 > 0.07) {
      return numberToClean.toFixed(1) + postfix;
    } else {
      return Math.floor(numberToClean).toString() + postfix;
    }
  }
}

export default NumbersUtility;
