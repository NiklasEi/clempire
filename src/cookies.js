class CookieUtility {
  static saveCookie(name, value, expiresInYears = 10, path = '/') {
    document.cookie =
      name +
      '=' +
      value +
      ';expires=' +
      new Date(new Date().getTime() + expiresInYears * 365 * 24 * 3600 * 1000).toGMTString() +
      ';path=' +
      path;
  }

  static getCookie(cname) {
    const name = cname + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return '';
  }

  static hasCookie(cname) {
    const name = cname + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return true;
      }
    }
    return false;
  }
}

export default CookieUtility;
