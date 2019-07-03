onmessage = function(e) {
  let id = e.data.id;
  let request = new XMLHttpRequest();
  request.open('GET', e.data.url, false);
  request.responseType = 'arraybuffer';
  request.send();
  postMessage({id: e.data.id, response: request.response})
}