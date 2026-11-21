(() => {
  'use strict';

  const root = document.documentElement;
  const assetBase = new URL('assets/', document.currentScript.src);
  const themeButton = document.querySelector('.theme-toggle');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('joyharness-theme'); } catch { /* Storage may be unavailable. */ }
  function syncProductImages() {
    const theme = root.dataset.theme === 'dark' ? 'dark' : 'light';
    document.querySelectorAll('img[data-product-screen]').forEach(img => {
      const screen = img.dataset.productScreen;
      const filename = screen === 'harness' ? 'harnesses' : screen;
      const source = new URL(`screens/${filename}-${theme}.webp`, assetBase).href;
      if (img.getAttribute('src') !== source) img.src = source;
    });
  }
  function setTheme(theme) {
    root.dataset.theme = theme;
    const label = theme === 'dark' ? '切换到浅色模式' : '切换到深色模式';
    themeButton?.setAttribute('aria-label', label);
    themeButton?.setAttribute('title', label);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#141415' : '#fafafa');
    syncProductImages();
  }
  setTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : systemTheme.matches ? 'dark' : 'light');
  themeButton?.addEventListener('click', () => {
    savedTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(savedTheme);
    try { localStorage.setItem('joyharness-theme', savedTheme); } catch { /* Theme still works without persistence. */ }
  });
  systemTheme.addEventListener('change', event => { if (!savedTheme) setTheme(event.matches ? 'dark' : 'light'); });

  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const contactMenus = document.querySelectorAll('.contact-menu');
  function closeContact(except) {
    contactMenus.forEach(menu => { if (menu !== except) menu.open = false; });
  }
  contactMenus.forEach(menu => menu.addEventListener('toggle', () => { if (menu.open) closeContact(menu); }));
  document.addEventListener('click', event => {
    contactMenus.forEach(menu => { if (!menu.contains(event.target)) menu.open = false; });
  });
  document.addEventListener('focusin', event => {
    contactMenus.forEach(menu => { if (!menu.contains(event.target)) menu.open = false; });
  });
  function closeMenu() {
    closeContact();
    if (!mobileNav || !menuButton) return;
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '展开导航');
  }
  menuButton?.addEventListener('click', () => {
    closeContact();
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    mobileNav.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '收起导航' : '展开导航');
  });
  mobileNav?.querySelectorAll(':scope > a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const openContact = [...contactMenus].find(menu => menu.open);
    if (openContact) {
      closeContact();
      openContact.querySelector('summary').focus();
      return;
    }
    const menuWasOpen = menuButton?.getAttribute('aria-expanded') === 'true';
    closeMenu();
    if (menuWasOpen) menuButton.focus();
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', closeMenu);

  const downloadDialog = document.getElementById('download-dialog');
  document.querySelectorAll('[data-download]').forEach(button => button.addEventListener('click', () => downloadDialog?.showModal()));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });

  const remoteContent = {
    shoulder: { icon: 'R', title: '肩键与扳机', description: '可以绑定鼠标点击或浏览器前进、后退' },
    stick: { icon: '↔', title: '摇杆导航', description: '方向键映射与鼠标模式随时切换' },
    custom: { icon: 'C', title: 'Joy-Con 2 的 C 键', description: '可以绑定修饰键或语音输入快捷键' },
  };
  document.querySelectorAll('[data-remote]').forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.remote;
    document.querySelectorAll('[data-remote]').forEach(item => {
      const selected = item.dataset.remote === name;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    document.getElementById('remote-tooltip-icon').textContent = remoteContent[name].icon;
    document.getElementById('remote-tooltip-title').textContent = remoteContent[name].title;
    document.getElementById('remote-tooltip-description').textContent = remoteContent[name].description;
  }));

  // Geometry follows PhrasesPage.swift; content follows DefaultPhrases.swift.
  const phrases = {
  "continue": {
    "zh": "请继续完成剩余任务，完成后告诉我结果。",
    "en": "Please continue with the remaining tasks and let me know the results when you are done."
  },
  "explain": {
    "zh": "请用通俗的语言解释这部分的作用、实现思路和关键取舍，必要时给一个简单例子。",
    "en": "Please explain what this does, how it works, and the key tradeoffs in plain language. Include a simple example if helpful."
  },
  "confirm": {
    "zh": "好的，按这个方案执行。完成后说明结果和需要我处理的事项。",
    "en": "Sounds good. Please proceed with this plan, then report the results and anything that needs my attention."
  },
  "fix": {
    "zh": "请修复这个问题，尽量缩小改动范围，保留现有功能，并验证修复结果。",
    "en": "Please fix this issue with a focused change, preserve existing functionality, and verify the result."
  },
  "verify": {
    "zh": "请检查实现是否符合需求，运行相关测试和构建，并说明通过情况及尚未验证的部分。",
    "en": "Please verify that the implementation meets the requirements, run the relevant tests and build, and report what passed and what remains unverified."
  }
};
  let selectedPhrase = 'continue';
  let phraseLanguage = 'zh';
  const phraseButtons = [...document.querySelectorAll('[data-phrase]')];
  const languageButtons = [...document.querySelectorAll('[data-phrase-language]')];
  function updatePhraseDemo() {
    const output = document.getElementById('phrase-output');
    if (!output) return;
    phraseButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.phrase === selectedPhrase)));
    languageButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.phraseLanguage === phraseLanguage)));
    output.lang = phraseLanguage === 'en' ? 'en' : 'zh-CN';
    output.textContent = phrases[selectedPhrase][phraseLanguage];
  }
  function selectPhrase(button) {
    selectedPhrase = button.dataset.phrase;
    updatePhraseDemo();
  }
  phraseButtons.forEach(button => {
    button.addEventListener('click', () => selectPhrase(button));
    button.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectPhrase(button);
        return;
      }
      const directions = { ArrowUp: 'continue', ArrowDown: 'verify', ArrowLeft: 'explain', ArrowRight: 'fix', Home: 'confirm' };
      const next = phraseButtons.find(item => item.dataset.phrase === directions[event.key]);
      if (next) {
        event.preventDefault();
        next.focus();
        selectPhrase(next);
      }
    });
  });
  languageButtons.forEach(button => button.addEventListener('click', () => {
    phraseLanguage = button.dataset.phraseLanguage;
    updatePhraseDemo();
  }));

  const screens = {
    mapping: { title: '按键映射', caption: '为当前手柄配置单击、双击和长按', alt: 'Joy-Con 2 示意图、按键连线、三种手势与全局按键' },
    harness: { title: '应用 Harness', caption: '为内置和自定义应用绑定键位方案', alt: '应用列表、运行状态与方案绑定' },
    connection: { title: '连接与摇杆', caption: '查看已连接手柄，校准摇杆和配置鼠标模式', alt: '连接状态、电量、设备列表和摇杆设置' },
    macros: { title: '组合动作', caption: '把快捷键、输入文本和等待编排到同一个动作里', alt: '组合动作列表与步骤编辑器' },
    profiles: { title: '键位方案', caption: '管理默认方案与应用专用方案', alt: '当前手柄的键位方案与 Harness 绑定' },
    phrases: { title: '常用语', caption: '分配五向位置，编辑每条常用语的两组内容', alt: '常用语库、五向分配和两组内容编辑区' },
  };
  const tabs = [...document.querySelectorAll('[data-screen]')];
  const screenshot = document.getElementById('showcase-image');
  let currentScreen = 'mapping';
  function selectScreen(tab) {
    currentScreen = tab.dataset.screen;
    const screen = screens[currentScreen];
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    screenshot.dataset.productScreen = currentScreen;
    syncProductImages();
    screenshot.alt = `${screen.title}：${screen.alt}`;
    document.getElementById('showcase-panel').setAttribute('aria-labelledby', tab.id);
    document.getElementById('screen-window-title').textContent = screen.title;
    document.getElementById('screen-caption').textContent = screen.caption;
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectScreen(tab));
    tab.addEventListener('keydown', event => {
      let nextIndex;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex === undefined) return;
      event.preventDefault();
      selectScreen(tabs[nextIndex]);
      tabs[nextIndex].focus();
    });
  });
  document.getElementById('expand-screenshot')?.addEventListener('click', () => {
    const expanded = document.getElementById('expanded-image');
    expanded.dataset.productScreen = currentScreen;
    syncProductImages();
    expanded.alt = screenshot.alt;
    document.getElementById('screenshot-dialog').showModal();
  });
})();
