/**
 * Quiet Editor 落地页 — 系统检测下载、滚动显现、轻量视差
 * 安装包由 GitHub Releases 提供（latest 直链，文件名须与 Release 附件一致）。
 */
(function () {
  'use strict';

  /** 指向当前仓库「最新 Release」附件；发新版时保持附件文件名不变即可沿用同一链接 */
  var DOWNLOAD_BASE = 'https://github.com/smallcham/quiet-editor-page/releases/latest/download/';

  /** 与 Release 附件名、README、「放置安装包说明」保持一致 */
  var FILES = {
    windows: 'QuietEditor-Windows-x64.exe',
    macArm: 'QuietEditor-macOS-arm64.tar.gz',
    macIntel: 'QuietEditor-macOS-x64.tar.gz',
    linuxDeb: 'QuietEditor-Linux-x86_64.deb',
    linuxRpm: 'QuietEditor-Linux-x86_64.rpm',
    android: 'QuietEditor-Android-arm64.apk',
  };

  function linuxPrefersRpm(ua) {
    return /Fedora|Red Hat|rhel|CentOS|Rocky|AlmaLinux|Mageia|OpenMandriva|SUSE|openSUSE|Amazon Linux/i.test(ua);
  }

  function fileHref(name) {
    return DOWNLOAD_BASE + name;
  }

  function isWindows(ua) {
    return /Windows|Win32|Win64|WOW64/i.test(ua);
  }
  function isMac(ua) {
    return /Macintosh|Mac OS X/i.test(ua);
  }
  function isLinux(ua) {
    return /Linux/i.test(ua) && !/Android/i.test(ua);
  }
  function isAndroid(ua) {
    return /Android/i.test(ua);
  }
  function isIOS(ua) {
    return /iPhone|iPad|iPod/i.test(ua);
  }

  function uaArm64(ua) {
    return /aarch64|arm64|ARM64/i.test(ua);
  }

  function resolveMacFile() {
    return new Promise(function (resolve) {
      var ua = navigator.userAgent || '';
      if (uaArm64(ua)) {
        resolve(FILES.macArm);
        return;
      }
      var ud = navigator.userAgentData;
      if (ud && typeof ud.getHighEntropyValues === 'function') {
        ud.getHighEntropyValues(['architecture', 'bitness'])
          .then(function (h) {
            var a = (h.architecture || '').toLowerCase();
            if (a === 'arm' || a === 'arm64') resolve(FILES.macArm);
            else resolve(FILES.macIntel);
          })
          .catch(function () {
            resolve(FILES.macArm);
          });
        return;
      }
      // 无法区分时优先 Apple 芯片包（多数新机型）；Intel 用户可在下载区手动选择
      resolve(FILES.macArm);
    });
  }

  function resolveDownload() {
    var ua = navigator.userAgent || '';
    if (isIOS(ua)) {
      return Promise.resolve({
        href: '#download-ios',
        label: '暂不支持下载',
        sub: '当前为 iOS：不提供安装包下载，请使用 Android 或桌面端（Windows / macOS / Linux）。',
      });
    }
    if (isAndroid(ua)) {
      return Promise.resolve({
        href: fileHref(FILES.android),
        label: '下载 Android 版',
        sub: '已识别为 Android（arm64）。',
      });
    }
    if (isWindows(ua)) {
      return Promise.resolve({
        href: fileHref(FILES.windows),
        label: '下载 Windows 版',
        sub: '已识别为 Windows（x64）。',
      });
    }
    if (isLinux(ua)) {
      var rpmFirst = linuxPrefersRpm(ua);
      var lFile = rpmFirst ? FILES.linuxRpm : FILES.linuxDeb;
      return Promise.resolve({
        href: fileHref(lFile),
        label: '下载 Linux 版',
        sub: rpmFirst
          ? '已识别为 Linux，默认匹配 RPM（Fedora / RHEL 系等）；Debian / Ubuntu 请在下方选用 DEB。'
          : '已识别为 Linux，默认匹配 DEB（Debian / Ubuntu 系等）；Fedora / openSUSE 等请在下方选用 RPM。',
      });
    }
    if (isMac(ua)) {
      if (/Intel Mac OS X/i.test(ua)) {
        return Promise.resolve({
          href: fileHref(FILES.macIntel),
          label: '下载 macOS 版',
          sub: '已识别为 macOS（Intel）。',
        });
      }
      return resolveMacFile().then(function (file) {
        var isArm = file === FILES.macArm;
        return {
          href: fileHref(file),
          label: '下载 macOS 版',
          sub: isArm
            ? '已识别为 macOS，推荐 Apple 芯片安装包；若为 Intel Mac 请在下方选用 x64 安装包。'
            : '已识别为 macOS（Intel）安装包。',
        };
      });
    }
    return Promise.resolve({
      href: '#download',
      label: '选择安装包',
      sub: '未识别到常见桌面/移动系统，请在下方手动选择对应平台。',
    });
  }

  function applyPrimaryDownload(spec) {
    var isIos = spec.href === '#download-ios';
    document.body.classList.toggle('is-ios-visitor', isIos);

    var nodes = document.querySelectorAll('.js-primary-download');
    nodes.forEach(function (el) {
      el.setAttribute('href', spec.href);
      if (spec.href.charAt(0) === '#') {
        el.removeAttribute('download');
        el.removeAttribute('rel');
      } else if (/^https?:\/\//i.test(spec.href)) {
        el.removeAttribute('download');
        el.setAttribute('rel', 'noopener noreferrer');
      } else {
        el.setAttribute('download', '');
        el.removeAttribute('rel');
      }
      var iconName = isIos ? 'block' : 'download';
      var icon = '<span class="material-symbols-outlined">' + iconName + '</span> ';
      if (el.classList.contains('btn--sm')) {
        el.innerHTML = icon + (isIos ? '暂不支持' : '下载应用');
      } else {
        el.innerHTML = icon + spec.label;
      }
      el.classList.toggle('btn--ios-state', isIos);
    });
    var hint = document.getElementById('js-dl-hint');
    if (hint) hint.textContent = spec.sub;
  }

  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        el.classList.add('reveal--visible');
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('reveal--visible');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    els.forEach(function (el) {
      return io.observe(el);
    });
  }

  function initNavScroll() {
    var onScroll = function () {
      document.body.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initHeroParallax() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var orbs = hero.querySelectorAll('.hero__orb');
    if (!orbs.length) return;
    hero.addEventListener(
      'mousemove',
      function (e) {
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        orbs.forEach(function (orb, idx) {
          var m = idx === 0 ? 1 : -0.72;
          orb.style.setProperty('--orb-x', (x * 28 * m).toFixed(2) + 'px');
          orb.style.setProperty('--orb-y', (y * 22 * m).toFixed(2) + 'px');
        });
      },
      { passive: true }
    );
    hero.addEventListener('mouseleave', function () {
      orbs.forEach(function (orb) {
        orb.style.setProperty('--orb-x', '0px');
        orb.style.setProperty('--orb-y', '0px');
      });
    });
  }

  function year() {
    var y = document.getElementById('y');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /** 邮箱不在 HTML 中出现完整串，由点击时拼接，降低静态页被采集的概率 */
  function initAuthorContact() {
    var nodes = document.querySelectorAll('.js-contact-author');
    nodes.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var u = ['sm', 'all', 'ch', 'am', '9', '4'].join('');
        var d = ['gm', 'ai', 'l'].join('');
        var addr = u + String.fromCharCode(64) + d + String.fromCharCode(46) + 'com';
        var subj = encodeURIComponent('关于 Quiet Editor');
        window.location.href = 'mailto:' + addr + '?subject=' + subj;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    year();
    initAuthorContact();
    initReveal();
    initNavScroll();
    initHeroParallax();
    resolveDownload()
      .then(applyPrimaryDownload)
      .catch(function () {
        document.body.classList.remove('is-ios-visitor');
        applyPrimaryDownload({
          href: '#download',
          label: '选择安装包',
          sub: '自动识别失败，请在下方手动选择平台。',
        });
      });
  });
})();
