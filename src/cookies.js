class CookieUtility {
  static saveCookie(name, value, expiresInYears = 10, path = "/") {
    document.cookie = name + "=" + value + ";expires=" + new Date(new Date().getTime() + expiresInYears * 365 * 24 * 3600 * 1000).toGMTString() + ";path=" + path;
  }

  static getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  static hasCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return true;
      }
    }
    return false;
  }
}

export default CookieUtility
