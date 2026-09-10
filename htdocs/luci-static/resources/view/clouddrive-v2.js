'use strict';
'require fs';
'require ui';
'require view';
'require poll';
'require uci';

var CTL = '/usr/sbin/clouddrive2-ctl';
var LOG_FILE = '/tmp/clouddrive2-deploy.log';
var STATUS_FILE = '/tmp/clouddrive2-deploy.status';
var DEPLOY_STEPS = ['downloading', 'extracting', 'installing', 'starting'];

var MIRRORS = [
    ['', _('GitHub (default)')],
    ['https://ghfast.top/https://github.com', 'ghfast.top'],
    ['https://gh.zwy.one/https://github.com', 'gh.zwy.one']
];

var STYLE =
    '#cd2-view{' +
    '--cd2-card-bg:rgba(128,128,128,.07);--cd2-card-border:rgba(128,128,128,.28);' +
    '--cd2-muted:GrayText;--cd2-ok:#1f8a5f;--cd2-err:#c0392b;--cd2-info:#2f6fb0;--cd2-warn:#b8860b;' +
    '--cd2-ok-bg:rgba(31,138,95,.14);--cd2-err-bg:rgba(192,57,43,.14);--cd2-info-bg:rgba(47,111,176,.14);--cd2-warn-bg:rgba(184,134,11,.14);' +
    '--cd2-log-bg:rgba(0,0,0,.55);--cd2-log-fg:#d4d4d4;}' +
    '@media (prefers-color-scheme:dark){#cd2-view{--cd2-ok:#63c79b;--cd2-err:#e8897e;--cd2-info:#7fb3e8;--cd2-warn:#e0c060;}}' +
    '#cd2-view .cd2-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.6em;margin-bottom:.9em;}' +
    '#cd2-view .cd2-header h2{margin:0;}' +
    '#cd2-view .cd2-header-right{display:flex;align-items:center;gap:.6em;flex-wrap:wrap;}' +
    '#cd2-view .cd2-descr{color:var(--cd2-muted);margin:0 0 1em;font-size:.92em;}' +
    '#cd2-view .cd2-badge{display:inline-flex;align-items:center;gap:.45em;padding:.3em .8em;border-radius:999px;font-size:.9em;border:1px solid var(--cd2-card-border);background:var(--cd2-card-bg);}' +
    '#cd2-view .cd2-badge[data-state="running"]{color:var(--cd2-ok);background:var(--cd2-ok-bg);border-color:transparent;}' +
    '#cd2-view .cd2-badge[data-state="stopped"]{color:var(--cd2-warn);background:var(--cd2-warn-bg);border-color:transparent;}' +
    '#cd2-view .cd2-badge[data-state="deploying"]{color:var(--cd2-info);background:var(--cd2-info-bg);border-color:transparent;}' +
    '#cd2-view .cd2-badge[data-state="failed"]{color:var(--cd2-err);background:var(--cd2-err-bg);border-color:transparent;}' +
    '#cd2-view .cd2-dot{width:.6em;height:.6em;border-radius:50%;background:var(--cd2-muted);flex:0 0 auto;}' +
    '#cd2-view [data-state="running"] .cd2-dot{background:var(--cd2-ok);}' +
    '#cd2-view [data-state="stopped"] .cd2-dot{background:var(--cd2-warn);}' +
    '#cd2-view [data-state="failed"] .cd2-dot{background:var(--cd2-err);}' +
    '#cd2-view [data-state="deploying"] .cd2-dot{background:var(--cd2-info);animation:cd2-pulse 1.2s ease-in-out infinite;}' +
    '@keyframes cd2-pulse{0%,100%{opacity:1}50%{opacity:.3}}' +
    '#cd2-view .cd2-stats{display:grid;gap:.75em;grid-template-columns:repeat(auto-fit,minmax(min(11em,100%),1fr));margin-bottom:1em;}' +
    '#cd2-view .cd2-card{background:var(--cd2-card-bg);border:1px solid var(--cd2-card-border);border-radius:8px;padding:.75em .95em;min-width:0;overflow-wrap:anywhere;}' +
    '#cd2-view .cd2-label{font-size:.82em;color:var(--cd2-muted);margin-bottom:.3em;}' +
    '#cd2-view .cd2-value{font-size:1.25em;line-height:1.3;font-variant-numeric:tabular-nums;display:flex;align-items:center;gap:.5em;}' +
    '#cd2-view .cd2-value.cd2-mono{font-family:monospace;font-size:.95em;}' +
    '#cd2-view .cd2-main{display:grid;gap:1em;grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:1em;}' +
    '@media (max-width:900px){#cd2-view .cd2-main{grid-template-columns:1fr;}}' +
    '#cd2-view .cd2-panel{background:var(--cd2-card-bg);border:1px solid var(--cd2-card-border);border-radius:8px;padding:1em;min-width:0;}' +
    '#cd2-view .cd2-panel-head{display:flex;align-items:center;justify-content:space-between;gap:.6em;margin-bottom:.8em;flex-wrap:wrap;}' +
    '#cd2-view .cd2-panel-title{font-weight:bold;font-size:1.05em;margin:0;}' +
    '#cd2-view .cd2-btns{display:flex;flex-wrap:wrap;gap:.5em;}' +
    '#cd2-view .cd2-btns .btn,#cd2-view .cd2-btns .cbi-button{margin:0;}' +
    '#cd2-view .cd2-form{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:.7em .9em;align-items:center;}' +
    '#cd2-view .cd2-form label{color:var(--cd2-muted);font-size:.9em;white-space:nowrap;}' +
    '#cd2-view .cd2-form .cd2-inline{display:flex;gap:.5em;align-items:center;min-width:0;}' +
    '#cd2-view .cd2-form .cd2-inline>select,#cd2-view .cd2-form .cd2-inline>input{flex:1 1 auto;min-width:0;}' +
    '#cd2-view .cd2-form select,#cd2-view .cd2-form input{width:100%;box-sizing:border-box;}' +
    '#cd2-view .cd2-form-foot{grid-column:1/-1;display:flex;justify-content:flex-end;gap:.5em;margin-top:.3em;}' +
    '#cd2-view .cd2-divider{border:0;border-top:1px solid var(--cd2-card-border);margin:1em 0;}' +
    '#cd2-view .cd2-collapse-toggle{display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;gap:.5em;}' +
    '#cd2-view .cd2-collapse-toggle .cd2-chevron{transition:transform .2s;display:inline-block;font-size:.8em;color:var(--cd2-muted);}' +
    '#cd2-view .cd2-collapse[data-open="true"] .cd2-chevron{transform:rotate(90deg);}' +
    '#cd2-view .cd2-collapse-body{display:none;margin-top:.8em;}' +
    '#cd2-view .cd2-collapse[data-open="true"] .cd2-collapse-body{display:block;}' +
    '#cd2-view .cd2-summary{color:var(--cd2-muted);font-size:.9em;}' +
    '#cd2-view .cd2-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:.4em;margin-bottom:.7em;}' +
    '#cd2-view .cd2-step{text-align:center;font-size:.8em;padding:.35em .2em;border-radius:6px;border:1px solid var(--cd2-card-border);color:var(--cd2-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '#cd2-view .cd2-step[data-state="active"]{color:var(--cd2-info);background:var(--cd2-info-bg);border-color:transparent;}' +
    '#cd2-view .cd2-step[data-state="done"]{color:var(--cd2-ok);background:var(--cd2-ok-bg);border-color:transparent;}' +
    '#cd2-view .cd2-step[data-state="failed"]{color:var(--cd2-err);background:var(--cd2-err-bg);border-color:transparent;}' +
    '#cd2-view #cd2-log{width:100%;box-sizing:border-box;font-family:monospace;font-size:12px;white-space:pre;resize:vertical;background:var(--cd2-log-bg);color:var(--cd2-log-fg);border:1px solid var(--cd2-card-border);border-radius:6px;padding:.6em;min-height:14em;}' +
    '#cd2-view .cd2-preview-wrap{margin-bottom:1em;}' +
    '#cd2-view .cd2-preview-wrap>.cd2-collapse-toggle{padding:.4em 0;}' +
    '#cd2-view .cd2-preview-frame{display:block;width:100%;height:70vh;border:1px solid var(--cd2-card-border);border-radius:6px;background:var(--cd2-card-bg);}' +
    '#cd2-view .cd2-alert{padding:.6em .9em;border-radius:6px;font-size:.9em;margin-bottom:.8em;color:var(--cd2-warn);background:var(--cd2-warn-bg);}' +
    '#cd2-view .cd2-hint{color:var(--cd2-muted);font-size:.85em;margin-top:.5em;}';

return view.extend({
    _polling: false,
    _pollFn: null,
    _status: null,
    _deployStatus: 'idle',

    load: function() {
        return Promise.all([
            L.resolveDefault(fs.exec(CTL, ['status']), {}),
            L.resolveDefault(fs.exec('/bin/cat', [STATUS_FILE]), {}),
            uci.load('clouddrive2')
        ]);
    },

    /* ---------- helpers ---------- */

    isTrue: function(v) {
        return String(v) === 'true';
    },

    parseStatus: function(stdout) {
        try { return JSON.parse(stdout || '{}'); } catch (e) { return {}; }
    },

    parseVersions: function(stdout) {
        if (!stdout) return [];
        return stdout.split('\n').filter(function(v) { return v; });
    },

    cd2Url: function() {
        var status = this._status || {};
        return 'http://' + window.location.hostname + ':' + (status.port || '19798') + '/';
    },

    setText: function(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    },

    setOpen: function(id, open) {
        var el = document.getElementById(id);
        if (el) el.setAttribute('data-open', open ? 'true' : 'false');
    },

    isOpen: function(id) {
        var el = document.getElementById(id);
        return el && el.getAttribute('data-open') === 'true';
    },

    collapse: function(id, titleNode, bodyNodes, open, extraHead) {
        var self = this;
        var head = E('div', { 'class': 'cd2-collapse-toggle' }, [
            E('div', { 'style': 'display:flex;align-items:center;gap:.6em;min-width:0;flex:1 1 auto;' }, [
                E('span', { 'class': 'cd2-chevron' }, '\u25B6'),
                titleNode
            ]),
            extraHead || ''
        ]);
        head.addEventListener('click', function(ev) {
            if (ev.target.closest('button, a, select, input')) return;
            self.setOpen(id, !self.isOpen(id));
        });
        return E('div', { 'class': 'cd2-collapse', 'id': id, 'data-open': open ? 'true' : 'false' }, [
            head,
            E('div', { 'class': 'cd2-collapse-body' }, bodyNodes)
        ]);
    },

    statCard: function(label, id, value, mono) {
        return E('div', { 'class': 'cd2-card' }, [
            E('div', { 'class': 'cd2-label' }, label),
            E('div', { 'class': 'cd2-value' + (mono ? ' cd2-mono' : ''), 'id': id }, value)
        ]);
    },

    /* ---------- status ---------- */

    refreshStatus: function() {
        var self = this;
        return L.resolveDefault(fs.exec(CTL, ['status']), {}).then(function(res) {
            self._status = self.parseStatus(res.stdout);
            self.updateStatusCard();
            return self._status;
        });
    },

    badgeState: function() {
        var status = this._status || {};
        if (this._deployStatus === 'failed') return 'failed';
        if (this._polling) return 'deploying';
        if (!this.isTrue(status.installed)) return 'none';
        return this.isTrue(status.running) ? 'running' : 'stopped';
    },

    badgeText: function(state) {
        var status = this._status || {};
        switch (state) {
            case 'running': return _('Running') + (status.version ? ' \u00B7 ' + status.version : '');
            case 'stopped': return _('Stopped') + (status.version ? ' \u00B7 ' + status.version : '');
            case 'deploying': return _('Deploying...');
            case 'failed': return _('Deployment failed');
            default: return _('Not installed');
        }
    },

    updateStatusCard: function() {
        var status = this._status || {};
        var installed = this.isTrue(status.installed);
        var running = this.isTrue(status.running);
        var state = this.badgeState();

        var badge = document.getElementById('cd2-badge');
        if (badge) {
            badge.setAttribute('data-state', state);
            this.setText('cd2-badge-text', this.badgeText(state));
        }

        this.setText('cd2-stat-installed', installed ? _('Yes') : _('No'));
        var runEl = document.getElementById('cd2-stat-running');
        if (runEl) {
            runEl.setAttribute('data-state', installed ? (running ? 'running' : 'stopped') : 'none');
            this.setText('cd2-stat-running-text', installed ? (running ? _('Running') : _('Stopped')) : '-');
        }
        this.setText('cd2-stat-version', status.version || '-');
        this.setText('cd2-stat-arch', status.arch || '-');
        this.setText('cd2-stat-port', (status.port || '19798') + (status.pid ? '  \u00B7  PID ' + status.pid : ''));
        this.setText('cd2-stat-path', status.install_path || '-');
        this.setText('cd2-arch-prefix', status.arch_prefix || _('Detecting...'));

        var svc = document.getElementById('cd2-service-block');
        if (svc) svc.style.display = installed ? '' : 'none';
        var upgrade = document.getElementById('cd2-upgrade');
        if (upgrade) upgrade.style.display = installed ? '' : 'none';
        var fresh = document.getElementById('cd2-fresh-deploy');
        if (fresh) fresh.style.display = installed ? 'none' : '';

        /* keep the single deploy form in the right container */
        var form = this._deployForm;
        if (form) {
            var target = installed ? (upgrade && upgrade.querySelector('.cd2-collapse-body')) : fresh;
            if (target && form.parentNode !== target) target.appendChild(form);
        }
        var uninstall = document.getElementById('cd2-uninstall-block');
        if (uninstall) uninstall.style.display = installed ? '' : 'none';

        var deployBtn = document.getElementById('cd2-deploy-btn');
        if (deployBtn && !this._polling) deployBtn.textContent = installed ? _('Upgrade / Redeploy') : _('Deploy');

        ['cd2-open-btn', 'cd2-open-btn-2'].forEach(function(id) {
            var b = document.getElementById(id);
            if (b) b.disabled = !running;
        });
        ['cd2-start-btn', 'cd2-stop-btn', 'cd2-restart-btn'].forEach(function(id) {
            var b = document.getElementById(id);
            if (b) b.disabled = !installed;
        });

        var preview = document.getElementById('cd2-preview');
        if (preview) preview.style.display = installed ? '' : 'none';
        if (running && this.isOpen('cd2-preview')) this.loadPreview();
    },

    /* ---------- preview ---------- */

    loadPreview: function() {
        var frame = document.getElementById('cd2-preview-frame');
        if (!frame) return;
        var url = this.cd2Url();
        if (frame.getAttribute('src') !== url) frame.setAttribute('src', url);
    },

    openCloudDrive2: function() {
        window.open(this.cd2Url(), '_blank');
    },

    /* ---------- log / deploy ---------- */

    readDeployLog: function() {
        return L.resolveDefault(fs.exec('/bin/cat', [LOG_FILE]), {}).then(function(res) {
            var el = document.getElementById('cd2-log');
            if (el && res.stdout) {
                el.value = res.stdout;
                el.scrollTop = el.scrollHeight;
            }
        }).catch(function() {});
    },

    setDeployStatus: function(deployStatus) {
        this._deployStatus = deployStatus || 'idle';
        var idx = DEPLOY_STEPS.indexOf(this._deployStatus);
        DEPLOY_STEPS.forEach(function(step, i) {
            var el = document.getElementById('cd2-step-' + step);
            if (!el) return;
            var s = '';
            if (deployStatus === 'completed') s = 'done';
            else if (deployStatus === 'failed') s = (i <= idx || idx < 0) ? 'failed' : '';
            else if (idx >= 0) s = i < idx ? 'done' : (i === idx ? 'active' : '');
            el.setAttribute('data-state', s);
        });

        var summary;
        switch (this._deployStatus) {
            case 'completed': summary = _('Last deployment completed'); break;
            case 'failed': summary = _('Last deployment failed'); break;
            case 'idle': summary = _('No deployment in progress'); break;
            default: summary = _('Deploying: %s').format(this._deployStatus);
        }
        this.setText('cd2-log-summary', summary);
    },

    setDeployState: function(state) {
        var btn = document.getElementById('cd2-deploy-btn');
        var select = document.getElementById('cd2-version');
        var installed = this.isTrue((this._status || {}).installed);
        if (btn) {
            btn.disabled = state === 'deploying';
            btn.textContent = state === 'deploying' ? _('Deploying...') : (installed ? _('Upgrade / Redeploy') : _('Deploy'));
        }
        if (select) select.disabled = state === 'deploying';
    },

    startDeployPolling: function() {
        if (this._polling) return;
        this._polling = true;
        this.setOpen('cd2-log-collapse', true);
        this.updateStatusCard();

        var self = this;
        this._pollFn = function() {
            return Promise.all([
                self.refreshStatus(),
                self.readDeployLog(),
                L.resolveDefault(fs.exec('/bin/cat', [STATUS_FILE]), {})
            ]).then(function(results) {
                var deployStatus = ((results[2] || {}).stdout || 'idle').trim();
                self.setDeployStatus(deployStatus);
                if (deployStatus === 'completed' || deployStatus === 'failed' || deployStatus === 'idle') {
                    self.stopDeployPolling();
                    self.setDeployState('idle');
                    self.updateStatusCard();
                    if (deployStatus === 'failed')
                        ui.addNotification(null, E('p', _('CloudDrive2 deployment failed.')), 'error');
                }
            }).catch(function() {});
        };
        poll.add(this._pollFn, 2);
    },

    stopDeployPolling: function() {
        if (this._polling && this._pollFn) {
            poll.remove(this._pollFn);
            this._polling = false;
            this._pollFn = null;
        }
    },

    handleDeploy: function() {
        var select = document.getElementById('cd2-version');
        var proxyInput = document.getElementById('cd2-proxy');
        var installInput = document.getElementById('cd2-install-path');
        if (!select || !select.value) {
            ui.addNotification(null, E('p', _('Please select a version.')), 'warning');
            return;
        }
        var version = select.value;
        var proxy = proxyInput ? (proxyInput.value || '').trim() : '';
        var installPath = installInput ? (installInput.value || '').trim() : '';
        if (!installPath) {
            ui.addNotification(null, E('p', _('Please enter an install path.')), 'warning');
            return;
        }
        var self = this;

        if (!confirm(_('Deploy CloudDrive2 %s to %s?').format(version, installPath))) return;

        this._deployStatus = 'downloading';
        this.setDeployState('deploying');

        function doDeploy() {
            self.setDeployStatus('downloading');
            self.startDeployPolling();
            var args = ['deploy', version];
            if (proxy) args.push(proxy);
            fs.exec(CTL, args).catch(function(err) {
                self.stopDeployPolling();
                self.setDeployState('idle');
                ui.addNotification(null, E('p', _('Deployment request failed: ') + err.message), 'error');
            });
        }

        var currentPath = uci.get('clouddrive2', 'config', 'install_path') || '/opt/clouddrive2';
        if (installPath !== currentPath) {
            this.saveUciOption('install_path', installPath).then(doDeploy).catch(function() {
                self.setDeployState('idle');
            });
        } else {
            doDeploy();
        }
    },

    /* ---------- versions / uci ---------- */

    loadVersions: function() {
        var self = this;
        var select = document.getElementById('cd2-version');
        var reloadBtn = document.getElementById('cd2-reload-versions-btn');
        if (select) {
            select.innerHTML = '';
            select.appendChild(E('option', { 'value': '' }, _('Loading versions...')));
            select.disabled = true;
        }
        if (reloadBtn) reloadBtn.disabled = true;

        return L.resolveDefault(fs.exec_direct(CTL, ['versions']), '').then(function(res) {
            var versions = self.parseVersions(res);
            var saved = uci.get('clouddrive2', 'config', 'version') || '';
            if (!select) return;
            select.innerHTML = '';
            select.appendChild(E('option', { 'value': '' }, _('Select a version...')));
            versions.forEach(function(v) {
                var opt = E('option', { 'value': v }, v);
                if (v === saved) opt.selected = true;
                select.appendChild(opt);
            });
            select.disabled = false;
        }).catch(function(err) {
            if (select) {
                select.innerHTML = '';
                select.appendChild(E('option', { 'value': '' }, _('Failed to load versions')));
                select.disabled = false;
            }
            ui.addNotification(null, E('p', _('Failed to load version list: ') + (err.message || '')), 'error');
        }).finally(function() {
            if (reloadBtn) reloadBtn.disabled = false;
        });
    },

    saveUciOption: function(option, value) {
        return L.resolveDefault(fs.exec('/sbin/uci', ['set', 'clouddrive2.config.' + option + '=' + value]), {})
            .then(function() { return L.resolveDefault(fs.exec('/sbin/uci', ['commit', 'clouddrive2']), {}); })
            .catch(function(err) {
                ui.addNotification(null, E('p', _('Failed to save ') + option + ': ' + err.message), 'error');
            });
    },

    /* ---------- service ---------- */

    handleServiceAction: function(action) {
        var self = this;
        return fs.exec(CTL, [action]).then(function() {
            ui.addNotification(null, E('p', _('%s command sent.').format(action)), 'info');
            return self.refreshStatus();
        }).catch(function(err) {
            ui.addNotification(null, E('p', _('%s failed: ').format(action) + err.message), 'error');
        });
    },

    handleUninstall: function() {
        var self = this;
        if (!confirm(_('Are you sure you want to uninstall CloudDrive2? All data under the install path will be removed.'))) return;
        return fs.exec(CTL, ['uninstall']).then(function() {
            ui.addNotification(null, E('p', _('CloudDrive2 uninstalled.')), 'info');
            self._deployStatus = 'idle';
            self.setDeployStatus('idle');
            return self.refreshStatus();
        }).catch(function(err) {
            ui.addNotification(null, E('p', _('Uninstall failed: ') + err.message), 'error');
        });
    },

    /* ---------- render ---------- */

    render: function(data) {
        var self = this;
        this._status = this.parseStatus((data[0] || {}).stdout);
        this._deployStatus = (((data[1] || {}).stdout) || 'idle').trim();
        var deploying = DEPLOY_STEPS.indexOf(this._deployStatus) >= 0;

        var status = this._status;
        var installed = this.isTrue(status.installed);
        var running = this.isTrue(status.running);
        var savedMirror = uci.get('clouddrive2', 'config', 'mirror') || '';

        /* header */
        var header = E('div', { 'class': 'cd2-header' }, [
            E('h2', {}, _('CloudDrive2')),
            E('div', { 'class': 'cd2-header-right' }, [
                E('span', { 'class': 'cd2-badge', 'id': 'cd2-badge', 'data-state': 'none' }, [
                    E('span', { 'class': 'cd2-dot' }),
                    E('span', { 'id': 'cd2-badge-text' }, '')
                ]),
                E('button', {
                    'class': 'btn cbi-button-action',
                    'click': ui.createHandlerFn(this, 'refreshStatus')
                }, _('Refresh'))
            ])
        ]);

        /* stat cards */
        var stats = E('div', { 'class': 'cd2-stats' }, [
            this.statCard(_('Installed'), 'cd2-stat-installed', ''),
            E('div', { 'class': 'cd2-card' }, [
                E('div', { 'class': 'cd2-label' }, _('Status')),
                E('div', { 'class': 'cd2-value', 'id': 'cd2-stat-running', 'data-state': 'none' }, [
                    E('span', { 'class': 'cd2-dot' }),
                    E('span', { 'id': 'cd2-stat-running-text' }, '')
                ])
            ]),
            this.statCard(_('Version'), 'cd2-stat-version', ''),
            this.statCard(_('Architecture'), 'cd2-stat-arch', ''),
            this.statCard(_('Port'), 'cd2-stat-port', '', true),
            this.statCard(_('Install Path'), 'cd2-stat-path', '', true)
        ]);

        /* deploy form (shared between fresh deploy and upgrade) */
        var versionSelect = E('select', { 'id': 'cd2-version', 'class': 'cbi-input-select' }, [
            E('option', { 'value': '' }, _('Select a version...'))
        ]);
        var mirrorSelect = E('select', {
            'id': 'cd2-mirror',
            'class': 'cbi-input-select',
            'change': function(ev) { self.saveUciOption('mirror', ev.target.value); }
        });
        MIRRORS.forEach(function(m) {
            var o = E('option', { 'value': m[0] }, m[1]);
            if (m[0] === savedMirror) o.selected = true;
            mirrorSelect.appendChild(o);
        });

        var deployForm = E('div', { 'class': 'cd2-form' }, [
            E('label', {}, _('Version')),
            E('div', { 'class': 'cd2-inline' }, [
                versionSelect,
                E('button', {
                    'class': 'btn cbi-button-action',
                    'id': 'cd2-reload-versions-btn',
                    'click': ui.createHandlerFn(this, 'loadVersions')
                }, _('Reload'))
            ]),
            E('label', {}, _('Target Architecture')),
            E('div', { 'id': 'cd2-arch-prefix', 'style': 'font-family:monospace;font-size:.9em;' }, ''),
            E('label', {}, _('Install Path')),
            E('input', {
                'type': 'text',
                'id': 'cd2-install-path',
                'class': 'cbi-input-text',
                'placeholder': '/opt/clouddrive2',
                'value': uci.get('clouddrive2', 'config', 'install_path') || '/opt/clouddrive2'
            }),
            E('label', {}, _('Download Mirror')),
            mirrorSelect,
            E('label', {}, _('Download Proxy')),
            E('input', {
                'type': 'text',
                'id': 'cd2-proxy',
                'class': 'cbi-input-text',
                'placeholder': _('e.g. http://127.0.0.1:7890'),
                'value': uci.get('clouddrive2', 'config', 'proxy') || ''
            }),
            E('div', { 'class': 'cd2-form-foot' }, [
                E('button', {
                    'class': 'btn cbi-button-positive',
                    'id': 'cd2-deploy-btn',
                    'click': ui.createHandlerFn(this, 'handleDeploy')
                }, installed ? _('Upgrade / Redeploy') : _('Deploy'))
            ])
        ]);

        /* left panel: actions */
        var serviceBlock = E('div', { 'id': 'cd2-service-block', 'style': installed ? '' : 'display:none;' }, [
            E('div', { 'class': 'cd2-btns' }, [
                E('button', { 'class': 'btn cbi-button-positive', 'id': 'cd2-start-btn',
                    'click': ui.createHandlerFn(this, function() { return this.handleServiceAction('start'); }) }, _('Start')),
                E('button', { 'class': 'btn cbi-button-neutral', 'id': 'cd2-stop-btn',
                    'click': ui.createHandlerFn(this, function() { return this.handleServiceAction('stop'); }) }, _('Stop')),
                E('button', { 'class': 'btn cbi-button-action', 'id': 'cd2-restart-btn',
                    'click': ui.createHandlerFn(this, function() { return this.handleServiceAction('restart'); }) }, _('Restart')),
                E('button', { 'class': 'btn cbi-button-apply', 'id': 'cd2-open-btn',
                    'click': ui.createHandlerFn(this, 'openCloudDrive2') }, _('Open Panel') + ' \u2197')
            ]),
            E('div', { 'class': 'cd2-hint' }, _('Web UI: %s').format(this.cd2Url())),
            E('hr', { 'class': 'cd2-divider' })
        ]);

        var upgradeCollapse = this.collapse('cd2-upgrade',
            E('span', { 'class': 'cd2-panel-title' }, _('Upgrade / Redeploy')),
            [deployForm], deploying);
        upgradeCollapse.style.display = installed ? '' : 'none';

        var freshDeploy = E('div', { 'id': 'cd2-fresh-deploy', 'style': installed ? 'display:none;' : '' }, [
            E('p', { 'class': 'cd2-summary', 'style': 'margin:0 0 .8em;' },
                _('CloudDrive2 is not installed yet. Select a version and deploy it to this router.'))
        ]);

        var uninstallBlock = E('div', { 'id': 'cd2-uninstall-block', 'style': installed ? '' : 'display:none;' }, [
            E('hr', { 'class': 'cd2-divider' }),
            E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;gap:.6em;flex-wrap:wrap;' }, [
                E('span', { 'class': 'cd2-summary' }, _('Remove binary and all data under the install path.')),
                E('button', { 'class': 'btn cbi-button-negative', 'click': ui.createHandlerFn(this, 'handleUninstall') }, _('Uninstall'))
            ])
        ]);

        var actionsPanel = E('div', { 'class': 'cd2-panel' }, [
            E('div', { 'class': 'cd2-panel-head' }, [
                E('h3', { 'class': 'cd2-panel-title' }, _('Actions'))
            ]),
            serviceBlock,
            freshDeploy,
            upgradeCollapse,
            uninstallBlock
        ]);

        /* when not installed, the deploy form lives directly in the panel */
        if (!installed) {
            freshDeploy.appendChild(deployForm);
        }
        this._deployForm = deployForm;

        /* right panel: log */
        var steps = E('div', { 'class': 'cd2-steps' }, DEPLOY_STEPS.map(function(step) {
            var labels = {
                downloading: _('Download'),
                extracting: _('Extract'),
                installing: _('Install'),
                starting: _('Start')
            };
            return E('div', { 'class': 'cd2-step', 'id': 'cd2-step-' + step, 'data-state': '' }, labels[step]);
        }));

        var logCollapse = this.collapse('cd2-log-collapse',
            E('span', { 'class': 'cd2-summary', 'id': 'cd2-log-summary' }, ''),
            [
                steps,
                E('textarea', {
                    'id': 'cd2-log',
                    'readonly': 'readonly',
                    'wrap': 'off',
                    'rows': 14,
                    'placeholder': _('Deployment log will appear here...')
                }, ''),
                E('div', { 'class': 'cd2-btns', 'style': 'justify-content:flex-end;margin-top:.5em;' }, [
                    E('button', { 'class': 'btn cbi-button-action', 'click': ui.createHandlerFn(this, 'readDeployLog') }, _('Refresh Log')),
                    E('button', { 'class': 'btn cbi-button-neutral', 'click': function() {
                        var el = document.getElementById('cd2-log');
                        if (el) el.value = '';
                    } }, _('Clear'))
                ])
            ],
            deploying || this._deployStatus === 'failed');

        var logPanel = E('div', { 'class': 'cd2-panel' }, [
            E('div', { 'class': 'cd2-panel-head' }, [
                E('h3', { 'class': 'cd2-panel-title' }, _('Deployment Log'))
            ]),
            logCollapse
        ]);

        /* preview (collapsed, lazy) */
        var previewBody = [];
        if (window.location.protocol === 'https:') {
            previewBody.push(E('div', { 'class': 'cd2-alert' },
                _('LuCI is using HTTPS. The CloudDrive2 iframe uses HTTP and may be blocked by the browser. Use the "Open in New Tab" button if the preview fails.')));
        }
        previewBody.push(E('iframe', {
            'id': 'cd2-preview-frame',
            'class': 'cd2-preview-frame',
            'sandbox': 'allow-scripts allow-same-origin allow-forms allow-popups'
        }));

        var previewCollapse = this.collapse('cd2-preview',
            E('span', { 'class': 'cd2-panel-title' }, _('Inline Preview')),
            previewBody, false,
            E('button', { 'class': 'btn cbi-button-action', 'id': 'cd2-open-btn-2',
                'click': ui.createHandlerFn(this, 'openCloudDrive2') }, _('Open in New Tab') + ' \u2197'));
        previewCollapse.classList.add('cd2-preview-wrap');
        previewCollapse.style.display = installed ? '' : 'none';
        previewCollapse.querySelector('.cd2-collapse-toggle').addEventListener('click', function() {
            setTimeout(function() { if (self.isOpen('cd2-preview')) self.loadPreview(); }, 0);
        });

        var root = E('div', { 'id': 'cd2-view', 'class': 'cbi-map' }, [
            E('style', { 'type': 'text/css' }, STYLE),
            header,
            E('div', { 'class': 'cd2-descr' },
                _('Deploy and manage CloudDrive2 natively on OpenWrt. CloudDrive2 turns multiple cloud storage services into a unified local filesystem.')),
            stats,
            E('div', { 'class': 'cd2-main' }, [actionsPanel, logPanel]),
            previewCollapse
        ]);

        setTimeout(function() {
            self.updateStatusCard();
            self.setDeployStatus(self._deployStatus);
            self.readDeployLog();
            self.loadVersions();
            if (deploying) {
                self.setDeployState('deploying');
                self.startDeployPolling();
            }
        }, 0);

        return root;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
