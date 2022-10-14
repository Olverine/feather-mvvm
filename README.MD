# Feather-mvvm

Feather-mvvm is a lightweight model-view-viewmodel framework designed for embedded webservers with limited performance. Feather-mvvm provides powerful data binding capabilities while keeping storage space and bandwidth to a minimum and with no external dependencies whatsoever. The framework is written in Typescript and when combined with Webpack, it allows easy development of fast, tiny and dynamic frontend web applications.

## Features

Feather-mvvm provides the following features:

 - Binding data from viewmodels to innerHTML of an element
 - Binding data from viewmodels to an attribute value of an element
 - Two way binding between a viewmodel and a JavaScript value of an element object
 - Binding events to viewmodel
 - Duplicating html elements and binding to elements in an array
 - Multiple views for the same viewmodel
 - Multiple viewmodels for the same view
 - Nested views
 - Value pipes for processing values before they are displayed

# Usage

## Creating a viewmodel

Creating a viewmodel is done by simply extending the viewmodel class. For example, a simple viewmodel for a Hello World application could look like the following:

```typescript
import { ViewModel } from "feather-mvvm";

export class HelloViewModel extends ViewModel {
    public model: string = "Hello World";
}
```

The viewmodel also has to be instantiated and initialized in order to function. For example:


```typescript
import { HelloViewModel } from './HelloViewModel'

document.addEventListener("DOMContentLoaded", event => {
    let helloVM = new HelloViewModel("hello-vm");
    helloVM.onInit();
});
```

When a viewmodel is instantiated, a name has to be provided as a cunstructor argument. This name is used to bind this instance of the viewmodel to it's views.

A model can also be provided as the second argument. e.g. 
```typescript
new HelloViewModel("hello-vm", {foo: "bar"});
```

## Creating a view

Creating a view is also easy and straight forward. It is done by setting the attribute `ft-view-model` of the view element to the name of the viewmodel instance. For example:

```html
<body>
    <div ft-view-model="hello-vm">
        ...
    </div>
</body>
```

This way, the viewmodel will be able to identify and update it's views.

We can now add elements with data binding to the view. There are five different attributes that can be used to bind data in different ways:

 - `<viewmodel name>-attr-bind`: for binding data to an html attribute.
 - `<viewmodel name>-content-bind`: for binding data to the inner html of the element.
 - `<viewmodel name>-event-bind`: for binding an event to the viewmodel. This means that the viewmodel will be notified when the event is fired.
 - `<viewmodel name>-js-bind`: for binding data to a field of the JavaScript object that represents the DOM element.
 - `<viewmodel name>-foreach`: for multiplying a DOM element and binding each element to an element in an array.

The attributes are always prefixed with the viewmodel name. This is because views can have multiple viewmodels and views can be nested inside other views. It is therefore necessary to specify what viewmodel you are binding to.

Whenever the state of a viewmodel changes, it has to update it's views in order for them to reflect the changes. This is done by calling `this.updateViews()`.

### Attribute binding

Attribute binding binds data to an html attribute. The value of the binding attribute is a comma separated list of attribute name and value pairs so multiple attributes can be bound at once. The value part will be evaluated as javascript and a reference to the viewmodel instance can be accessed through the variable `$vm`. For example:

```html
<progress vm-name-attr-bind="value::$vm.progress, max::$vm.maximum" />
```

### Content binding

Content binding means binding data to the inner html of a DOM element. This can be useful for updating the text of a label for example. It works the same way as attribute binding except no attribute name needs to be provided and only one value is allowed. For example:

```html
<h1 vm-name-content-bind="$vm.title" />
```

### Event binding

When an event is bound to the viewmodel, the viewmodel will be notified whenever it is fired. Events are bound by entering the event name and a name that will uniquely identify this event in the viewmodel. Multiple events can be bound by providing a comma separeted list of event and name pairs. An optional argument can be passed with the event. 
Only one argument is allowed and it will be evaluated as javascript.

```html
<!-- Event without argument -->
<button vm-name-event-bind="click::hello">Click Me</button>

<!-- Event with argument -->
<button vm-name-event-bind="click::say('hello')">Click Me</button>
```

In order to catch this event in the viewmodel, you need to override the `onEvent` function:

```typescript
protected onEvent(event: Event, eventName: string, arg: any): void {
    if(eventName == "hello") {
        console.log("Hello");
    }
    else if(eventName == "say") {
        console.log(arg);
    }
}
```

The event name, a reference to the event and the optional argument will be passed to the function.

### JavaScript value binding

JavaScript value binding is a two way binding between a field in the viewmodel and a field in the DOM element object. This is useful for binding parameters of a DOM element that can be changed by the user (such as the value of an input or checked state of a checkbox) to a variable in the viewmodel.

```html
<div id="view" ft-view-model="hello-vm">
    <h1 hello-vm-content-bind="$vm.model"></h1>
    <input hello-vm-js-bind="value::$vm.model">
</div>
```

In the above example, the inner text of the `<h1>` element will be updated whenever the user changes the value of the `<input>` element

The value will be changed when the text field has been updated and loses focus (on the `change` event). If you want the value to be updated in real time as the user is typing (on the `input` event), you can add the `<viewmodel>-real-time-bind` attribute.

### Foreach binding

Foreach binding is used to create lists that represents the elements in an array. A foreach bound element will be multiplied inside it's parent once for each element in the provided array. Attributes, Content, Javascript values and events can then be bound as usual except the element array item can be accessed through the variable `$item` and it's indexed location in the array can be accessed with `$i`.

For example:

```html
<ul id="view" ft-view-model="list-vm">
    <li list-vm-foreach="$vm.list" list-vm-content-bind="'item number ' + $i + ' in list contains ' + $item">
</ul>
```

