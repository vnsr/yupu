'use strict';
// First frame in the chosen theme (and red at night), before the app has loaded its data.
// A separate file, not inline in index.html, so the page's security policy can allow only
// scripts from the app itself.
(function(){try{var l=JSON.parse(localStorage.getItem('yupu-look')||'null'),r=document.documentElement;if(l){r.dataset.pal=l.p||'calm';r.dataset.theme=l.ru>Date.now()?'red':l.p==='oled'?'dark':(l.m==='light'||l.m==='dark')?l.m:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}}catch(e){}})();
