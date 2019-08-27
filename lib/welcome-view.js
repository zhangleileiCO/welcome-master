/** @babel */
/** @jsx etch.dom **/

import etch from 'etch'
import "./templates"
export default class WelcomeView {
  constructor (props) {
    this.props = props
    etch.initialize(this)
    this.element.addEventListener('click', (event) => {
      const link = event.target.closest('a')
      if (link && link.dataset.event) {
        this.props.reporterProxy.sendEvent(`clicked-welcome-${link.dataset.event}-link`)
      }
    })
  }

  didChangeShowOnStartup () {
    atom.config.set('welcome.showOnStartup', this.checked)
    console.log(atom.config.get('welcome.showOnStartup'))
  }


  update () {}

  serialize () {
    return {
      deserializer: 'WelcomeView',
      uri: this.props.uri
    }
  }




  render () {

    return (
        <div className='welcome'>
            <div className='welcome-container' >
                <header className='welcome-header'>
                        <img src="https://metasota.ai/static/img/logo.png" alt="秘塔科技" width="200"/>
                        <h1 className='welcome-title'>
                            创建新的模板
                        </h1>
                </header>

                <div class="searchDiv">
                    <form>
                        <input type='text' id="searchInput" placeholder="搜索模板.." className="searchInput"/>

                    </form>
                    <p id="searchSug">
                        建议的搜索
                        &ensp;<span>劳务</span>&ensp;
                        &ensp;<span>经济纠纷</span>&ensp;
                        &ensp;<span>刑事案件</span>&ensp;
                        ...
                    </p>
                </div>


                <section className='welcome-panel'>

                    <div class="templates-select" id="contractTemplates" onclick={this.chooseTemplate}>
                        <div id="page-loader" class="fade in">
                            <span class="spinner">

                            </span>
                            <p>
                                模板加载中...
                            </p>
                        </div>
                    </div>

                </section>



                <footer className='welcome-footer'>
                    <section className='welcome-panel'>
                        <label>
                            <input className='input-checkbox' type='checkbox' checked={atom.config.get('welcome.showOnStartup')} onchange={this.didChangeShowOnStartup} />
                            在每次进入的时候打开该页面

                        </label>
                    </section>
                    <a href='https://metasota.ai' dataset={{event: 'footer-atom-io'}}>metasota.ai</a> <span className='text-subtle'>×</span> <a className='icon icon-octoface' href='https://metasota.ai' dataset={{event: 'footer-octocat'}} />
                </footer>
            </div>
            <input type="hidden" id="dataExchange" />
        </div>

    )
  }

  getURI () {
    return this.props.uri
  }

  getTitle () {
    return 'Welcome'
  }

  isEqual (other) {
    other instanceof WelcomeView
  }

  toggle (){
      console.log(1)
  }


}
