export default class Overlay {
    get template() {
        return "systems/mwii/templates/apps/overlay.html";
    }

    initialize() {
        const overlay = document.createElement('div');
        overlay.id = 'mwii-overlay';
        overlay.classList.add('mwii', 'overlay');

        const body = document.getElementsByTagName('body');
        body[0].appendChild(overlay);
    }

    initializeSocketListeners() {
        game.mwii.socket.registerCallback('hideOverlay', 'local', this._onHideOverlay.bind(this));
    }

    async show({content = "", cssClasses = []} = {}) {
        const classList = (cssClasses ?? []).join(" ");
        const overlay = document.getElementById('mwii-overlay');
        overlay.innerHTML = await renderTemplate(this.template, {content, cssClasses: classList});
        overlay.style.display = 'block';
    }

    hide() {
        const overlay = document.getElementById('mwii-overlay');
        overlay.style.display = 'none';
        overlay.innerHTML = "";
    }

    _onHideOverlay() {
        this.hide();
    }
}