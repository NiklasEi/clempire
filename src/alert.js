class Alert {
  constructor(selector, options) {
    this.selector = selector;
    this.options = options;
  }

  show(msg) {
    if (msg === '' || typeof msg === 'undefined' || msg === null) {
      throw '"msg parameter is empty"';
    } else {
      let alertArea = document.querySelector(this.selector);
      let alertBox = document.createElement('div');
      let alertContent = document.createElement('div');
      let alertClose = document.createElement('a');
      alertContent.classList.add('alert-content');
      alertContent.innerText = msg;
      alertClose.classList.add('alert-close');
      alertClose.setAttribute('href', '#');
      alertBox.classList.add('alert-box');
      alertBox.appendChild(alertContent);
      alertArea.appendChild(alertBox);
      let alertTimeout;
      if (!this.options.persistent) {
        alertTimeout = setTimeout(function () {
          this.hide.apply({this: this, box: alertBox});
        }.bind(this), this.options.closeTime);
      }
      if (!this.options.hideCloseButton || typeof this.options.hideCloseButton === 'undefined') {
        alertBox.appendChild(alertClose);
        alertClose.addEventListener('click', function (event) {
          event.preventDefault();
          clearTimeout(this.timeout);
          this.hide.apply({box: alertBox});
        }.bind({hide: this.hide, timeout: alertTimeout}));
      }
    }
  }

  hide() {
    this.box.classList.add('hide');
    let disperseTimeout = setTimeout(function () {
      this.box.parentNode.removeChild(this.box);
      clearTimeout(disperseTimeout);
    }.bind(this), 500);
  }

  static autoSave() {
    (new Alert("#auto-update-alerts", {
      closeTime: 5000,
      persistent: false,
      hideCloseButton: false
    })).show("Game was saved...")
  }
}

export default Alert
