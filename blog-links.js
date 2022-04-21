import {publish} from './lib.js';

/* TODO
 * Rework this component. There are the following states:
 * - no files created yet - show nothing
 * - content updated, nothing published - show 'publish your blog'
 * - content updated, older version published - show 'publish latest changes to blog'
 * - latest content published - show 'view blog at'
 */

const template = document.createElement('template');
template.innerHTML = `
  <div id="blogLinks">
    <div id="latestLink">
      <a></a>
    </div>
    <div id="blogLink">
      <a></a>
    </div>
    <div id="status"></div>
    <button>Publish to IPNS</button>
  </div>
`;

class Links extends HTMLElement {
  constructor(){
    super();
    this.innerHTML = `
      <style>
        #blogLinks a {
          overflow-wrap: anywhere;
        }
        #blogLinks {
          padding: 0.5em;
          background-color: lightgrey;
        }
      </style>
    `;
    let node = template.content.cloneNode(true);
    this.appendChild(node);
    this._publishButton = this.querySelector('button');
    this._ipnsInProgress = false;
  }

  connectedCallback(){
    this._publishButton.addEventListener('click', this.onPublishClick.bind(this));
    this._render();
  }

  async onPublishClick(e){
    e.preventDefault();
    console.log('onPublishClick');
    this._ipnsInProgress = true;
    this._render();
    let cidToPublish = window.localStorage.lastCid;
    let ipns = await publish(cidToPublish).catch((err) => {
      console.log('publish(cid) failed');
      this._ipnsInProgress = false;
    });
    this._ipnsInProgress = false;
    this._render();
  }

  static get observedAttributes() { return ['ipns', 'lastcid']; }

  attributeChangedCallback(name, oldValue, newValue) {
    this._render();
  }

  _render(){
    console.log("blog-links._render");
    console.log(window.localStorage.lastCid);
    if (window.localStorage.ipns){
      let ipns = window.localStorage.ipns;
      const url = `${ipns}index.md`;
      this.querySelector('#blogLink a').text = url;
      this.querySelector('#blogLink a').href = url;
    }

    if (window.localStorage.lastCid){
      let lastCid = window.localStorage.lastCid;
      this.querySelector('#latestLink a').text = `ipfs://${lastCid}/index.md`;
      this.querySelector('#latestLink a').href = `ipfs://${lastCid}/index.md`;
    }

    if (!window.localStorage.lastCid ){
      this._publishButton.style.display = 'none'
    } else {
      this._publishButton.style.display = 'inline-block'
    }

    let status = this.querySelector('#status');
    if (this._ipnsInProgress) {
      status.innerText = 'IPNS update in progress';
    } else if (!!window.localStorage.lastPublishedCid && window.localStorage.lastPublishedCid == window.localStorage.lastCid){
      status.innerText = 'IPNS link up to date';
    } else {
      status.innerText = 'Latest version of blog not published';
    }


    if (this._ipnsInProgress || !!window.localStorage.lastPublishedCid && window.localStorage.lastPublishedCid == window.localStorage.lastCid) {
      this.querySelector('button').setAttribute('disabled', '');
    } else {
      this.querySelector('button').removeAttribute('disabled');
    }
  }

}
customElements.define('blog-links', Links);


