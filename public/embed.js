// Nuron AI Embeddable Widget Loader
// Usage: <script src="https://app.nuronai.com/embed.js" data-agent-id="YOUR_AGENT_ID" data-color="#ffffff" async></script>
(function() {
  'use strict';

  // Get config from script tag
  var script = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var agentId = script.getAttribute('data-agent-id');
  var color = script.getAttribute('data-color') || '#ffffff';
  var position = script.getAttribute('data-position') || 'bottom-right';
  var baseUrl = script.getAttribute('data-base-url') || window.location.origin;

  if (!agentId) {
    console.error('[Nuron AI] Missing data-agent-id attribute');
    return;
  }

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '#nuron-widget-container { position: fixed; z-index: 99999; font-family: system-ui, -apple-system, sans-serif; }',
    position === 'bottom-left' ? '#nuron-widget-container { bottom: 20px; left: 20px; }' : '#nuron-widget-container { bottom: 20px; right: 20px; }',
    '#nuron-widget-btn { width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 24px rgba(0,0,0,0.3); transition: transform 0.2s ease, box-shadow 0.2s ease; }',
    '#nuron-widget-btn:hover { transform: scale(1.08); box-shadow: 0 6px 32px rgba(0,0,0,0.4); }',
    '#nuron-widget-btn svg { width: 24px; height: 24px; }',
    '#nuron-widget-iframe { width: 380px; height: 560px; border: none; border-radius: 16px; box-shadow: 0 8px 40px rgba(0,0,0,0.5); overflow: hidden; margin-bottom: 12px; display: none; transition: opacity 0.2s ease, transform 0.2s ease; }',
    '#nuron-widget-iframe.open { display: block; animation: nuron-slide-up 0.3s ease; }',
    '@keyframes nuron-slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }',
    '@media (max-width: 420px) { #nuron-widget-iframe { width: calc(100vw - 32px); height: calc(100vh - 120px); } }',
  ].join('\n');
  document.head.appendChild(style);

  // Create container
  var container = document.createElement('div');
  container.id = 'nuron-widget-container';

  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.id = 'nuron-widget-iframe';
  iframe.src = baseUrl + '/widget/' + agentId;
  iframe.title = 'Nuron AI Chat';
  iframe.allow = 'microphone';

  // Create toggle button
  var btn = document.createElement('button');
  btn.id = 'nuron-widget-btn';
  btn.setAttribute('aria-label', 'Chat with AI');
  btn.style.backgroundColor = color;
  var iconColor = isLightColor(color) ? '#000000' : '#ffffff';

  var isOpen = false;
  btn.innerHTML = getChatIcon(iconColor);

  btn.addEventListener('click', function() {
    isOpen = !isOpen;
    if (isOpen) {
      iframe.classList.add('open');
      btn.innerHTML = getCloseIcon(iconColor);
    } else {
      iframe.classList.remove('open');
      btn.innerHTML = getChatIcon(iconColor);
    }
  });

  container.appendChild(iframe);
  container.appendChild(btn);

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { document.body.appendChild(container); });
  } else {
    document.body.appendChild(container);
  }

  // Helpers
  function isLightColor(hex) {
    var c = hex.replace('#', '');
    var r = parseInt(c.substr(0, 2), 16);
    var g = parseInt(c.substr(2, 2), 16);
    var b = parseInt(c.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }

  function getChatIcon(c) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  }

  function getCloseIcon(c) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  }
})();
