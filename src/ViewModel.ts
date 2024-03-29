import { pipe } from "./Pipe";

export abstract class ViewModel {

    protected views: NodeListOf<Element>;

    protected name: string;
    protected model: any;

    private attrBindAttr: string;
    private contentBindAttr: string;
    private eventBindAttr: string;
    private jsBindAttr: string;
    private realTimeBindAttr: string;
    private foreachBindAttr: string;

    private foreachClassName = "ft-foreach";

    constructor(name: string, model?: any) {
        this.model = model;
        this.name = name;

        this.attrBindAttr = `${this.name}-attr-bind`;
        this.contentBindAttr = `${this.name}-content-bind`;
        this.eventBindAttr = `${this.name}-event-bind`;
        this.jsBindAttr = `${this.name}-js-bind`;
        this.realTimeBindAttr = `${this.name}-real-time-bind`;
        this.foreachBindAttr = `${this.name}-foreach`;

        this.views = document.querySelectorAll(`[ft-view-model=${name}]`);
        this.setupValueBindings();
        this.setupEventBinding();
    }

    public onInit(): void {
        this.updateViews();
    }

    public setModel(model: any): void {
        this.model = model;
    }

    protected onEvent(event: Event, eventName: string, arg: any): void {
        throw new Error("Method not implemented.");
    }

    private setupEventBinding(): void {
        this.views.forEach(view => {
            let eventBoundElements: NodeListOf<Element> = view.querySelectorAll(`[${this.eventBindAttr}]`);
            eventBoundElements.forEach(element => {
                this.bindEvents(element);
            });
        });
    }

    private setupValueBindings(): void {
        this.views.forEach(view => {
            let valueBoundElements: NodeListOf<HTMLInputElement> = view.querySelectorAll(`[${this.jsBindAttr}]`);
            valueBoundElements.forEach(element => {
                this.bindChangeEvent(element);
            });
        });
    }

    public updateViews(): void {
        this.views.forEach(view => {
            this.updateView(view);
        });
    }

    private updateView(view: Element): void {
        let attrBoundElements: NodeListOf<Element> = view.querySelectorAll(`[${this.attrBindAttr}]`);
        attrBoundElements.forEach(element => {
            this.bindAttributes(element);
        });

        let contentBoundElements: NodeListOf<Element> = view.querySelectorAll(`[${this.contentBindAttr}]`);
        contentBoundElements.forEach(element => {
            this.bindContent(element);
        });

        let valueBoundElements: NodeListOf<HTMLInputElement> = view.querySelectorAll(`[${this.jsBindAttr}]`);
        valueBoundElements.forEach(element => {
            this.bindValue(element);
        });

        let foreachBoundElements: NodeListOf<Element> = view.querySelectorAll(`[${this.foreachBindAttr}]`);
        foreachBoundElements.forEach(element => {
            this.iterateOver(element);
        });
    }


    private bindAttributes(element: Element, item?: string, i?: number): void {
        let attributeBindingStr: string = element.getAttribute(this.attrBindAttr);
        if(attributeBindingStr == null)
            return;
        let bindings: string[] = attributeBindingStr.split(",");
        bindings.forEach(binding => {
            let split: string[] = binding.split("::");
            let attr: string = split[0].trim();
            let valueField: string = split[1].trim();
            let value: any = "";
            try{
                value = Function(this.getValueBindingFunction(valueField, item, i)).call(this);
                if(value == undefined)
                    value = "";
                if(split.length > 2) {
                    let pipeName = split[2].trim();
                    value = pipe(pipeName, value);
                }
            } catch(e){
            }
            if(value == false) {
                element.removeAttribute(attr)
            } else {
                element.setAttribute(attr, value);
            }
        });
    }

    private bindContent(element: Element, item?: string, i?: number): void {
        let binding = element.getAttribute(this.contentBindAttr);
        if (binding == null)
            return;
        let split = binding.split("::");
        binding = split[0];
        let value = "";
        try{
            value = Function(this.getValueBindingFunction(binding, item, i)).call(this);
            if(value == undefined)
                value = "";
            if(split.length > 1) {
                let pipeName = split[1].trim();
                value = pipe(pipeName, value);
            }
        } catch(e){
        }
        if(element.innerHTML != value) {
            element.innerHTML = value;
        }
    }

    private bindValue(element: Element, item?: string, i?: number): void {
        let jsBindingStr: string = element.getAttribute(this.jsBindAttr);
        if(jsBindingStr == null)
            return;
        let bindings: string[] = jsBindingStr.split(",");
        bindings.forEach(binding => {
            let val: string = binding.split("::")[0].trim();
            let valueField: string = binding.split("::")[1].trim();
            let value: any = "";
            try{
                value = Function(this.getValueBindingFunction(valueField, item, i)).call(this);
                if(value == undefined)
                    value = "";
            } catch(e){
            }
            (element as unknown as any)[val] = value;
        });
    }
    
    private bindEvents(element: Element, item?: string, i?:number): void {
        let eventBindStr: string = element.getAttribute(this.eventBindAttr);
        let bindings: string[] = eventBindStr.split(",");
        bindings.forEach(binding => {
            let event: string = binding.split("::")[0].trim();
            let fnStr: string = binding.split("::")[1].trim();
            let fnName: string;
            let arg: any;
            let cap = fnStr.match(/(.*)\((.*)\)/);
            if(cap) {
                fnName = cap[1];
                arg = this.getValueBindingFunction(cap[2], item, i);
            } else {
                fnName = fnStr;
            }
            if((element as any)[this.name + event] != undefined) {
                element.removeEventListener(event, (element as any)[this.name + event]);
            }
            (element as any)[this.name + event] = (e) => {
                this.onEvent(e, fnName, Function(arg).call(this));
            };
            element.addEventListener(event, (element as any)[this.name + event]);
        });
    }

    private bindChangeEvent(element: Element, item?: any): void {
        let jsBindingStr: string = element.getAttribute(this.jsBindAttr);
        let bindings: string[] = jsBindingStr.split(",");
        bindings.forEach(binding => {
            let bindingFunction = (e) => {
                let val: string = binding.split("::")[0].trim();
                let valueField: string = binding.split("::")[1].trim();

                let obj: any;
                let fields = valueField.split(".");
                if(item && fields[0] == "$item") {
                    obj = (item as unknown as any);
                } else {
                    obj = (this as unknown as any);
                }
                for(var i = 1; i < fields.length - 1; i++) {
                    obj = obj[fields[i]];
                }
                obj[fields[fields.length - 1]] = (e.target as unknown as any)[val];
                this.updateViews();
            };
            let realTime = element.hasAttribute(this.realTimeBindAttr);
            element.addEventListener(realTime ? "input" : "change", bindingFunction);
        });
    }

    private getValueBindingFunction(valueField: string, item?: string, i?: number): any {
        let func: string = '"use strict";';
        func = func.concat(`let $vm = this;`);
        if(item) {
            func = func.concat(`let $i = ${i};`);
            func = func.concat(`let $item = ${item}[$i];`);
        }
        func = func.concat(`return ( ${valueField} )`);
        return func;
    }

    private iterateOver(element: Element): void {
        if(element.parentNode == null)
            return;
        let iterableStr: string = element.getAttribute(this.foreachBindAttr);
        let iterable = Function(this.getValueBindingFunction(iterableStr)).call(this);
        if(!iterable)
            return;
        let className = `${this.foreachClassName}-${iterableStr}`;
        this.clearChildrenWithClassName(element.parentElement, className);
        let i = 0;
        (iterable as unknown as Array<any>).forEach(item => {
            let newElem: Element = (element as HTMLElement).cloneNode(true) as Element;
            this.bindAttributes(newElem, iterableStr, i);
            this.bindContent(newElem, iterableStr, i);
            this.bindValue(newElem, iterableStr, i);
            let attrBoundElements: NodeListOf<Element> = newElem.querySelectorAll(`[${this.attrBindAttr}]`);
            attrBoundElements.forEach(bound => {
                this.bindAttributes(bound, iterableStr, i);
            });
            let contentBoundElements: NodeListOf<Element> = newElem.querySelectorAll(`[${this.contentBindAttr}]`);
            contentBoundElements.forEach(bound => {
                this.bindContent(bound, iterableStr, i);
            });
            let valueBoundElements: NodeListOf<Element> = newElem.querySelectorAll(`[${this.jsBindAttr}]`);
            valueBoundElements.forEach(bound => {
                this.bindValue(bound, iterableStr, i);
                this.bindChangeEvent(bound, item)
            });
            let eventBoundElements: NodeListOf<Element> = newElem.querySelectorAll(`[${this.eventBindAttr}]`);
            eventBoundElements.forEach(element => {
                this.bindEvents(element, iterableStr, i);
            });
            newElem.classList.add(className);
            newElem.removeAttribute("hidden");
            element.parentNode.appendChild(newElem);
            i++;
        });
        (element as HTMLElement).setAttribute("hidden", "true");
    }

    private clearChildrenWithClassName(element: Element, className: string): void {
        if(element == null)
            return;
        let children = element.parentElement.getElementsByClassName(className);
        while (children[0]) {
            children[0].parentNode.removeChild(children[0]);
        }
    }
}