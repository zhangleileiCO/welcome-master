/** @babel */

import {CompositeDisposable} from 'atom'
import ReporterProxy from './reporter-proxy'
import LoadingEditor from './loading-editor-view'
// import templatesData from"./templates"
const __atomConfig = require(__dirname.split("packages")[0] + '\packages\\atom.properties.json')
let WelcomeView, ConsentView // , GuideView
let templatesData = {
    templatesJson : ""
}
const WELCOME_URI = 'atom://welcome/welcome'
// const GUIDE_URI = 'atom://welcome/guide'
const CONSENT_URI = 'atom://welcome/consent'
let loadingEditorView = null;
let loadingEditorPanel = null;

export default class WelcomePackage {


    constructor() {
        this.reporterProxy = new ReporterProxy()
    }

    async activate() {
        this.subscriptions = new CompositeDisposable()
        loadingEditorView = new LoadingEditor();

        this.subscriptions.add(atom.workspace.addOpener((filePath) => {
            if (filePath === WELCOME_URI) {
                return this.createWelcomeView({uri: WELCOME_URI})
            }
        }));

        loadingEditorPanel = atom.workspace.addModalPanel({
            item: loadingEditorView.getElement(),
            visible: false,
        });

        // this.subscriptions.add(atom.workspace.addOpener((filePath) => {
        //   if (filePath === GUIDE_URI) {
        //     return this.createGuideView({uri: GUIDE_URI})
        //   }
        // }))

        this.subscriptions.add(atom.workspace.addOpener((filePath) => {
            if (filePath === CONSENT_URI) {
                return this.createConsentView({uri: CONSENT_URI})
            }
        }))

        this.subscriptions.add(
            atom.commands.add('atom-workspace', 'welcome:show', () => this.show())
        )

        if (atom.config.get('core.telemetryConsent') === 'undecided') {
            await atom.workspace.open(CONSENT_URI)
        }

        if (atom.config.get('welcome.showOnStartup')) {
            await this.show()
            this.reporterProxy.sendEvent('show-on-initial-load')
            //todo 绑定事件统一位置
            let searchInput = document.getElementById("searchInput");
            searchInput.addEventListener("input",(e)=> onChangeInput(e))
            searchInput.addEventListener("keydown", (e)=> onInputKeyDown(e))

            let searchSug = document.getElementById("searchSug")
            for(let i =0; i<searchSug.children.length; i++){
                searchSug.addEventListener("click",(e)=>{
                    if(e.path[0].tagName === 'SPAN'){
                        searchInput.value = e.path[0].innerText;
                        refreshTemplates(searchInput.value);
                    }
                })
            }
        }
    }

    show() {
        // 先要获取模板
        let http = require('http');
        let resposeTxt = "";
        let options = {
            hostname: __atomConfig["atomServerUrl"],
            port: __atomConfig["atomServerPort"],
            path: '/contractTemplates',
            method: 'GET'
        };
        let req = http.request(options, (res) => {
            res.setEncoding('utf-8');
            res.on('data', (chunk) => {
                resposeTxt += chunk;
            });
            res.on('end', () => {

                templatesData.templates = JSON.parse(resposeTxt);
                generateTemplates();
            });
        });
        req.on('error', (e) => {
            console.error(`请求遇到问题: ${e.message}`);
            resposeTxt = "";
        });
        req.end();


        return Promise.all([
            atom.workspace.open(WELCOME_URI),
            // , {split: 'left'} atom.workspace.open(GUIDE_URI, {split: 'right'})
        ])
    }


    consumeReporter(reporter) {
        return this.reporterProxy.setReporter(reporter)
    }

    deactivate() {
        this.subscriptions.dispose()
        loadingEditorPanel.destroy();
        loadingEditorView.destroy();
    }

    createWelcomeView(state) {
        if (WelcomeView == null) WelcomeView = require('./welcome-view')
        return new WelcomeView({reporterProxy: this.reporterProxy, ...state})
    }

    // createGuideView (state) {
    //   if (GuideView == null) GuideView = require('./guide-view')
    //   return new GuideView({reporterProxy: this.reporterProxy, ...state})
    // }

    createConsentView(state) {
        if (ConsentView == null) ConsentView = require('./consent-view')
        return new ConsentView({reporterProxy: this.reporterProxy, ...state})
    }
}

/**
 * 从服务器中下载数据后，添加到html中
 * 批请求的方式
 * @param templates
 */
function generateTemplates() {
    //
    let templates = templatesData.templates;

    let contractDiv = document.getElementById('contractTemplates');

    if (templates.length === 0) {
        // 错误或者没有模板
        contractDiv.innerHTML = "";

        let pshow = document.createElement("p");
        pshow.innerText = "错误";

        contractDiv.appenChild(pshow);
        return;
    }

    contractDiv.innerHTML = "";
    for (let i = 0; i < templates.length; i++) {

        let template = document.createElement("div");
        template.classList.add("template");
        let divshow = document.createElement("div");
        // divshow 将来用来放照片
        let pshow = document.createElement("p");
        pshow.innerText = templates[i].name;
        let inputHide = document.createElement("input");
        inputHide.setAttribute("type", "hidden");
        inputHide.setAttribute("value", templates[i].key);

        template.appendChild(divshow);
        template.appendChild(pshow);
        template.appendChild(inputHide);
        template.addEventListener('click', function (e) {
            e.stopPropagation();  //取消事件冒泡
            chooseTemplate(e);
        });

        if (i >= 12) {
            // 超过12的隐藏
            template.style.display = 'none';
        }


        contractDiv.appendChild(template);
    }
}

/**
 * 搜索调用匹配刷新templates
 * @param reg 正则表达式 现为用户输入字符串
 *
 * 没有按回车的时候， 本地搜索
 * 按了回车的时候，  进行联网搜索
 */
function refreshTemplates(reg){
    reg = reg.replace(" ", "");
    let contractDiv = document.getElementById('contractTemplates');
    let showCount = 0;
    for (let i =0; i<contractDiv.children.length; i++){

        let p = contractDiv.children[i].children[1];
        if(p.tagName !== "P"){
            continue;
        }
        if ((reg.length===0||p.innerText.split(reg).length>1) && showCount < 12){
            contractDiv.children[i].style.display = '';
            showCount ++;
        }else{
            contractDiv.children[i].style.display = 'none';
        }
    }
}


/**
 *  模板点击事件
 * @param arg
 */
function chooseTemplate(arg) {

    for (let index in arg.path) {
        let element = arg.path[index];
        if (element.getAttribute === undefined) {
            break;
        }

        if (element.getAttribute("class") == "template") {
            element.setAttribute("style", "background-color: red");
            console.log(element.lastChild.tagName);
            if (element.lastChild.tagName == "INPUT") {
                console.log(element.lastChild.value);
                let key = element.lastChild.value;
                getTemplateByKey(key);
                // setTimeout(function(){
                // }, 1000);
            }
            break;

        }
    }
}

/**
 * 从服务器上下载模板
 * @param key
 */
function getTemplateByKey(key) {
    let http = require('http');
    let resposeTxt = "";
    let options = {
        hostname: __atomConfig["atomServerUrl"],
        port: __atomConfig["atomServerPort"],
        path: encodeURI('/contractTemplate/' + key),
        method: 'GET'
    };

    let req = http.request(options, (res) => {
        res.setEncoding('utf-8');
        res.on('data', (chunk) => {
            resposeTxt += chunk;
        });
        res.on('end', () => {

            let fs = require('fs');
            let savePath = __dirname.split("packages")[0] + "\metasota__autoGenerate";

            fs.stat(savePath, function (err, stat) {
                if (stat) {
                } else {
                    fs.mkdir(savePath, function (err) {
                        console.log("err" + err);
                        console.log("创建文件夹失败 " + savePath)
                        // todo 创建文件夹失败
                    })
                }
            });

            savePath = savePath + "\\" + key + ".ts";

            // 直接覆盖
            fs.writeFile(savePath, resposeTxt, function (error) {
                if (error) {
                    console.log('写入失败');
                } else {
                    fs.stat(savePath, function (err, stat) {
                        if (err) {
                            console.log("创建文件失败 " + savePath)
                        }
                    });
                    atom.workspace.open(savePath, {pending: true});
                    // 调出OutLine
                    // show Panel
                    console.log(loadingEditorPanel);
                    loadingEditorPanel.show();
                    setTimeout(function(){
                        let __editor = atom.workspace.getActiveTextEditor();
                        console.log(__editor.getLastBufferRow());
                        let range = {
                            start: {
                                row: __editor.getLastBufferRow() + 1,
                                column: 0
                            },
                            end: {
                                row: __editor.getLastBufferRow() + 1,
                                column: 1
                            }
                        }
                        __editor.setTextInBufferRange(range, "\n");
                        setTimeout(function(){
                            __editor.undo();
                            //close Panel
                            loadingEditorPanel.hide();
                        }, 1000);
                    }, 1000);

                    Promise.all([
                        atom.workspace.hide('atom://welcome/welcome')
                    ])
                }
            });
        });
    });
    req.on('error', (e) => {
        console.error(`请求遇到问题: ${e.message}`);
        resposeTxt = "";
    });
    req.end();
}

/**
* 监听inputSearch input事件
**/
function onChangeInput(arg) {
    // console.log(arg.target.value)
    // console.log(templatesData)
    refreshTemplates(arg.target.value);
}

/**
 * 监听inputSearch keyDown事件
 **/
function onInputKeyDown(arg){
    if (arg.key === "Backspace" && arg.target.value.length > 0){
        arg.target.value = arg.target.value.substr(0, arg.target.value.length-1);
        refreshTemplates(arg.target.value);
        return;
    }
    if (arg.key === "Enter"){
        // console.log("Enter了")
        // console.log(arg.target.value)
        getTemplatesFromServer(arg.target.value)
    }
}

function getTemplatesFromServer(key){
    key = key.replace(" ", "");

    if (key.length === 0 ){
        return ;
    }
    // 转起来
    let page_loader = document.createElement("div");
    page_loader.classList.add("fade");
    page_loader.classList.add("in");
    page_loader.id = "page-loader";
    let spinner = document.createElement("span");
    spinner.classList.add("spinner");
    page_loader.appendChild(spinner);

    let contractDiv = document.getElementById('contractTemplates');
    contractDiv.innerHTML = "";
    contractDiv.appendChild(page_loader);

    // 先要获取模板
    let http = require('http');
    let resposeTxt = "";
    let options = {
        hostname: __atomConfig["atomServerUrl"],
        port: __atomConfig["atomServerPort"],
        path: encodeURI('/contractTemplates/' + key),
        method: 'GET'
    };
    let req = http.request(options, (res) => {
        res.setEncoding('utf-8');
        res.on('data', (chunk) => {
            resposeTxt += chunk;
        });
        res.on('end', () => {
            //todo 所有的网络访问 都没有考虑各种错误
            //todo concat需要考虑去重 或者 将Enter的 push到Map中
            templatesData.templates = templatesData.templates.concat(JSON.parse(resposeTxt));
            console.log(templatesData.templates);
            generateTemplates();
            refreshTemplates(key);
        });
    });
    req.on('error', (e) => {
        console.error(`请求遇到问题: ${e.message}`);
        resposeTxt = "";
        generateTemplates();
        refreshTemplates(key);
    });
    req.end();
}