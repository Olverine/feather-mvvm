import { pipe } from "./Pipe";

export abstract class ViewModel {

    // All views that blong to this view model
    protected views: NodeListOf<Element>;

    // The name of this viewmodel. The view will
    // refer to it's view model by this name.
    protected name: string;
    // Data model. Could be anything.
    protected model: any;

    // Data binding attribute names.
    // These are the names of the html attributes
    // that views use to bind to this view model.
    private attrBindAttr: string;
    private contentBindAttr: string;
    private eventBindAttr: string;
    private jsBindAttr: string;
    private realTimeBindAttr: string;
    private foreachBindAttr: string;

    private foreachClassName = "ft-foreach";

    /**
     * Construct a viemodel
     * @param name name of this viewmodel, 
     * Any html elements that contain a `ft-view-model`
     * attribute with this name will become a view of 
     * this view model.
     * @param model optional data model
     */
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

    /**
     * initalize the viewmodel.
     * Can be overriden to perform initializations.
     */
    public onInit(): void {
        this.updateViews();
    }

    /**
     * Change the data model
     * @param model 
     */
    public setModel(model: any): void {
        this.model = model;
    }

    /**
     * This method is called when an event bound element
     * fires the bound event.
     * This method is optional.
     * @param event The event that was fired
     * @param eventName Name of the event binding
     * @param arg Optional arguments passed by the event binding
     */
    protected onEvent(event: Event, eventName: string, arg: any): void {
        throw new Error("Method not implemented.");
    }

    /**
     * Find each element with event binding attributes and bind
     * the events.
     */
    private setupEventBinding(): void {
        this.views.forEach(view => {
            let eventBoundElements: NodeListOf<Element> = view.querySelectorAll(`[${this.eventBindAttr}]`);
            eventBoundElements.forEach(element => {
                this.bindEvents(element);
            });
        });
    }

    /**
     * Find each element with value data binding attributes and 
     * bind the value to this view model.
     */
    private setupValueBindings(): void {
        this.views.forEach(view => {
            let valueBoundElements: NodeListOf<HTMLInputElement> = view.querySelectorAll(`[${this.jsBindAttr}]`);
            valueBoundElements.forEach(element => {
                this.bindChangeEvent(element);
            });
        });
    }

    /**
     * Trigger a view update.
     * This will update the data of every data bound element
     * that has outdated data.
     * This function has to be called in order to reflect
     * changes made to the model or view model.
     */
    public updateViews(): void {
        this.views.forEach(view => {
            this.updateView(view);
        });
    }

    /**
     * Update data binding for a view
     * @param view 
     */
    private updateView(view: Element): void {
        // Update all elements with attribute bindings
        let attrBoundElements: NodeListOf<Element> = view.querySelectorAll(`[${this.attrBindAttr}]`);
        attrBoundElements.forEach(element => {
            this.bindAttributes(element);
        });

        // Update all elements with content bindings
        let contentBoundElements: NodeListOf<Element> = view.querySelectorAll(`[${this.contentBindAttr}]`);
        contentBoundElements.forEach(element => {
            this.bindContent(element);
        });

        // Update all elements with value bindings
        let valueBoundElements: NodeListOf<HTMLInputElement> = view.querySelectorAll(`[${this.jsBindAttr}]`);
        valueBoundElements.forEach(element => {
            this.bindValue(element);
        });

        // Repeat all elements with foreach bindings
        let foreachBoundElements: NodeListOf<Element> = view.querySelectorAll(`[${this.foreachBindAttr}]`);
        foreachBoundElements.forEach(element => {
            this.iterateOver(element);
        });
    }

    /**
     * Update attribute value of an element
     * @param element attribute owner
     * @param item Current item if the element is foreach bound
     * @param i Current item index if the element is foreach bound
     */
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

    /**
     * Update content of an element
     * @param element 
     * @param item Current item if the element is foreach bound
     * @param i Current item index if the element is foreach bound
     */
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

    /**
     * Update the value of an input element
     * @param element 
     * @param item Current item if the element is foreach bound
     * @param i Current item index if the element is foreach bound
     */
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
    
    /**
     * Bind events by adding an event listener to all
     * event bound elements that triggers the onEvent function
     * @param element 
     * @param item Current item if the element is foreach bound
     * @param i Current item index if the element is foreach bound
     */
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

    /**
     * Add an event listener for input elements that have the 
     * realtime binding attribute
     * @param element 
     * @param item Current item if the element is foreach bound
     */
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

    /**
     * Dynamically create a javascript function to execute when 
     * bindings are updated.
     * @param valueField the data binding string that will be
     * evaluated as javascript.
     * @param item Current item if the element is foreach bound
     * @param i Current item index if the element is foreach bound
     * @returns resulting data
     */
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

    /**
     * 
     * @param element Repeat a foreach bound element
     * @returns 
     */
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

    /**
     * Remove all children of an element with the specified class name.
     * This is done in order to remove repeated foreach bound elements
     * before updating the view.
     * @param element 
     * @param className 
     * @returns 
     */
    private clearChildrenWithClassName(element: Element, className: string): void {
        if(element == null)
            return;
        let children = element.parentElement.getElementsByClassName(className);
        while (children[0]) {
            children[0].parentNode.removeChild(children[0]);
        }
    }
}