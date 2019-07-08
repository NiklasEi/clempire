class CookieUtility {
  static saveCookie(name, value) {
    saveCookie(name, value, new Date().setFullYear(2035).toISOString(), "/");
  }

  static saveCookie(name, value, date, path) {
    document.cookie = name + "=" + value + "; expires=" + date + "; path=" + path;
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
}
