  // Micrograph Figure Kit — offline OCR setup. Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
  // Builds one Web Worker (from a blob, so it also works from file://) that contains:
  // a fetch shim serving eng.traineddata from memory, the Tesseract WASM core and the worker script.
  function offlineOCROptions() {
    const dec = id => decodeURIComponent(escape(atob(document.getElementById(id).textContent.trim())));
    const shim = 'self.__LANG_B64="' + document.getElementById('offLang').textContent.trim() + '";' +
      'self.fetch=function(u,o){if(String(u).indexOf("offline-lang")>=0){const b=atob(self.__LANG_B64),a=new Uint8Array(b.length);' +
      'for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return Promise.resolve(new Response(a));}return Promise.reject(new Error("Network access is disabled in this page."));};\n';
    const url = URL.createObjectURL(new Blob([shim, dec('offCore'), '\n', dec('offWorker')], {type:'application/javascript'}));
    return {workerPath:url, workerBlobURL:false, corePath:'offline-core.js', langPath:'https://offline-lang.local', cacheMethod:'none', gzip:true};
  }
