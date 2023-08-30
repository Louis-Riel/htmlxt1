const commandMutator = (elem,options,data,parentData)=>{
    const button = document.createElement('button');
    if (button && elem) {
        button.classList.value='btn btn-outline-primary';
        button.innerText=elem.value;
        button.setAttribute("hx-put","http://192.168.1.30/status/cmd")
        elem.parentElement.replaceChildren(...Array.from(elem.parentElement.childNodes.values()).filter(node=>node!==elem).concat(button));
    }
};

const commandMutatorSelector = (options)=>{
    return options.path.match(/^.*\/commands\[[0-9]+\]\/command$/)
};