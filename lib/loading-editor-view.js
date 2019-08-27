'use babel';

export default class LoadingEditor {

  constructor() {
    // Create root element
    this.element = document.createElement('div');

    // Create message element
    const message = document.createElement('div');
    message.textContent = '正在解析该文档';
    message.classList.add('loading');
    this.element.appendChild(message);
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
