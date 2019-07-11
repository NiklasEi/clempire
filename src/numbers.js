class NumbersUtility {
  static beautify(number) {
    if(number < 100) {
      return this.cleanAndAttachPostFix(number, "");
    } else if(number < 10000) {
      return Math.floor(number).toString()
    } else if (number < 1000000) {
      number /= 1000;
      return this.cleanAndAttachPostFix(number, "k");
    } else if (number < 1000000000) {
      number /= 1000000;
      return this.cleanAndAttachPostFix(number, "M");
    } else if (number < 1000000000000) {
      number /= 1000000000000;
      return this.cleanAndAttachPostFix(number, "G");
    } else if (number < 1000000000000000) {
      number /= 1000000000000000;
      return this.cleanAndAttachPostFix(number, "T");
    }
    return Math.floor(number).toString();
  }

  static cleanAndAttachPostFix(number, postfix) {
    if (number % 1 > 0.07) {
      return number.toFixed(1) + postfix;
    } else {
      return Math.floor(number).toString() + postfix;
    }
  }
}

export default NumbersUtility
