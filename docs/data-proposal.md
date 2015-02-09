# Design Principles

First off, I’d like to lay out the principles/beliefs that drive this proposal:


1. **Best practices for data flow in React are changing fast**. Last year, Facebook announced Flux as a design pattern, and they eventually released an implementation, which had some definite rough spots (singletons, string actions, lots of boilerplate). A bunch of other implementations that use the same basic model with different ideas have cropped up since then. This year, Facebook announced Relay as a design pattern, and they say they eventually would like to open source that, too, but it’s clear that a lot of teams at Facebook still use Flux without Relay. Everything is changing pretty fast, and any data flow we use now will probably change pretty radically in the next two years. As David Nolen said at ReactJSConf: “The whole point of the Flux architecture was, “Here’s one way because we’re not sure yet what the right way is”. And in fact, the truth is this is software, there’s probably going to be 4 or 5 ways that address different dimensions of the problem.”

1. **None of the currently available solutions for data flow is perfect**. I think of the things I’ve heard about, Relay has the best story, but it would require a TON of work on both front-end and back-end to implement for Redfin, and I don’t think we should do that now. All of the other solutions have strengths and drawbacks.

1. **Flux’s one-way data flow is its best idea**. The core problem that Flux seems to be solving is not having tons of boilerplate code in your components that pass props and handlers up and down the tree. Global actions allow nodes in the component tree to send messages to the data, which eventually bubbles up and causes a re-render.

1. **Other libraries did a better job implementing Flux’s pattern than Facebook did.** Libraries like reflux and Hoverboard have tried to address some of the implementation weaknesses of Facebook’s stock Flux, and we should use their best insights. The biggest weaknesses of Flux that I see are:

 * Stores and the dispatcher are singletons, which is especially problematic for server-side rendering.
 * Actions are represented by globally unique strings.
 * Common use cases like firing an action require a lot of boilerplate.
 * Stores are often used as React props, leaking their API to components.

1. **Actions are not necessary on the server.** Server-side rendering is a point-in-time rendering of the component tree, not a living, mutating UX, as it is on the client. Actions are really only needed for the latter.

1. **Immutable data is a great tool, but we have to support mutable data**. I think immutable data structures are an insanely good match for React, and we should migrate towards them. However, we have mutable data models right now, and we shouldn’t require teams to port from those models just to get rendering in Triton. I want any data flow we use right now to be compatible with immutable data, but I think to start we will be using it with mutable objects.

1. **Passing Props Down Through the Component Tree Is Not That Bad**. This is probably the most controversial thing I believe. I agree that it’d be nicer not to pass down props, and I would love to have Relay’s solution to the problem if I had a magic wand. However, in a practical matter I don’t think it’s that difficult to manage: most changes that are made to endpoints (like adding a field to CorgiHome) will filter down automatically through the component tree without changing anything, our component trees aren’t generally that deep, and prop passing code is not particularly hard to write or understand when you do need to add it.

# Key Concepts: Stores, State, Actions, and Root Components.

Having outlined the basic principles, let's look at the key concepts of this proposal: Stores, State, Actions, and Root Components.

*Root Components* are mounted React components that are at the root of their render tree (i.e. React components currently in the document that had "React.render" called on them.) Root State is passed into them as props. There can be multiple Root Components in a page (as when `getElements` returns an array in Triton).

*State* is an object representing the state of a Store at any particular point in time. It is separate from the Store in that it does not respond to Actions. The State from the various Stores is bundled up into Root State and passed to Root Components; Stores are *not* passed to Root Components. Ideally, State would be an immutable data structure, but it can be mutable.

*Root State* is an aggregation of one or more States from one or more Stores in the App that is then passed into a Root Component. Note that there can be multiple Root States, because there can be multiple Root Components in a page.

*Stores* are objects that hold State and manage the changes to the State.

*Actions* are events that fire from components anywhere in the render tree. Stores listen to Actions and potentially mutate State in response.

With these terms, let's chart out what a typical data flow would look like:

1. User clicks a button in the UX.
2. The button's React `onClick` fires, causing a method in the React class to fire an action:
```
    var updateCalculationAction = require("./calcActions").update;

    // snip boiler plate react definition.
    onButtonClick: function(e) {
        // signal to the Store that we need to update the calculation.
        updateCalculationAction();
    }
```
1. A store that is listening to that Action updates its state by calling `setState`.
```
    var updateCalculationAction = require("./calcActions").update;

    module.exports = TritonData.createStore({
      init: function() {
        listenTo(updateCalculationAction, this.updateCalc);
      },

      updateCalc: function() {
        var newValueForCalc = doCalc();

        // this call sets a new value for this.state.calculation, and automatically fires
        // a change.
        this.setState({calculation: newValueForCalc});
      }
    });
```
1. The call to `setState` triggers a change event to be fired from the Store. If the Store is a child of a parent Store, then the change event is propagated up to the root. At the root, the change event for the Store has a handler that will bundle the Root State and pass it over to the Root Component.

1. The Root Component will pass down subparts of the State to its children, who will pass down subparts to their children, and the current State will be rendered.

# Rough API

## Actions

I think we should actually just use the [Actions from refluxjs](https://github.com/spoike/refluxjs#creating-actions). They are easy to create, they have an awesome pattern for child actions that fire on completion or error, and they are just functions.

The only change I would propose is just aliasing `TritonData.createActions` to `Reflux.createActions`.

## Stores

### `TritonData.createStore({init?: Function(): void}) : Store`

Creates a Store instance. If an `init` function exists, then it will be called when `createStore` is called. Stores are event emitters, so they can be listened to using normal Event Emitter listener code.

### `Store.state`
The Store instance will have a `this.state` object, representing its current State. Like React, `this.state` should be considered to be an immutable, and attributes of `this.state` should _never_ be set. Stores are, however, free to read attributes from the state.

### `Store.setState(state: Object)`
Like React, this method merges `state` into the current `this.state`:

```
// in a Store method.
console.log(this.state); // output: {foo:1, bar:2}
this.setState({bar:3, qux: 4}); // state will now be: {foo:1, bar:3, qux:4}
```
Also like React, `setState` may be carried out asynchronously (in order to batch up multiple Stores' changes), so `this.state` may not change immediately after a call to `this.setState()`.

The `setState` method also emits a `change` event so that listeners will know that the Store's State has changed.

#### Child Stores
Also, if the value of any of the keys in the `state` argument is a Store, then the value in `this.state` will be that child Store's State, not the child Store itself. Further, adding a child store in this way will automatically make this Store listen to that child Store's change events. This means that hooking up parent and child Stores is generally as easy as
```
this.setState({propertyHistory: new propertyHistoryStore});
```
If you need something more intricate than Stores just listening to their child Stores, you can hook up Stores manually to listen to changes in other Stores. However, it is important to make sure that event listening tree doesn't have cycles. If a cycle of `setState` calls occurs, the framework will throw an Error.

#### Pending Values

Many stores fetch data via asynchronous processes, often an HTTP JSON call. To make it easy to code asynchronous values into a Store, we have the notion of _Pending Values_. If you call `setState` and the value of a property is a Promise (or any `then`-able), then that name is not immediately added to `state`. Instead, once the promise resolves, the name is added to `state` with the value of the resolved promise. If the promise rejects, then the name is added with the value being the error that was thrown. (TODO: is that right? sounds hard to use in error cases.)

```
var A = TritonData.createStore({});
A.setState({a: 1});
var deferred = Q.defer();

A.setState({b: deferred.promise});

console.log(A.state); // {a:1}

setTimeout(() => {
  deferred.resolve(2);
}, 2);

setTimeout(() => {
  console.log(A.state); // {a:1, b:2}
}, 1000);
```

### `Store.view(names: [String])`

Returns a Store that is a read-only view into this Store containing only the name-value pairs denoted in `names`.

The Store returned by `view` is read-only, so it will not have a `setState` method. It will have a `state` that will be in sync with this Store at all times, and it will emit `change` events if the data for its subset of State changes:
```
var A = TritonData.createStore({});
A.setState({a:1, b:2, c:3});
var B = A.view(["b", "c"]);

A.addListener("change", function() {
  console.log("A changed");
});
B.addListener("change", function() {
  console.log("B changed");
});

console.log(A.state); // {a:1, b:2, c:3}
console.log(B.state); // {b:2, c:3}

A.setState({b: 5}); // "A changed" "B changed"

console.log(A.state); // {a:1, b:5, c:3}
console.log(B.state); // {b:5, c:3}

A.setState({a: 2}); // "A changed" (note, no "B changed")

console.log(A.state); // {a:2, b:5, c:3}
console.log(B.state); // {b:5, c:3}

A.setState({d:10}); // "A changed" (note, no "B changed")

console.log(A.state); // {a:2, b:5, c:3, d:10}
console.log(B.state); // {b:5, c:3}

B.setState({e:15}) // setState is undefined
```
This method is most useful when one Store is intended to server multiple different Root Components, but the components may not all depend on the entirety of the Store's state.

### `Store.when(names: String | [String]) : Promise(Object)`

Returns a promise that resolves when all of the values with names in `names` have a non-pending non-`undefined` value.

The value of the promise is a hash of the names to their values.

### `Store.whenResolved() : Promise(Object)`

Returns a promise that resolves when there are no more pending values in the Store's `state`.

## RootComponents

### `TritonData.createRootComponent(store: Store, element: ReactElement | Function(props: Object) : ReactElement) : ReactElement`

Takes in a Store and a ReactElement or a Function to create a Root Component that is linked in a one-way data flow with the Store.

If `element` is a ReactElement, the Root Component will be that element with a `prop` for every key-value pair in the Store's `state` mixed in. Any change events in the Store will automatically update the Root Component's props and, of course, force a re-render.

If `element` is a Function, it will be called every time the Store updates with the state, and it should return a ReactElement that should be used at that moment. This is useful, for example, for mapping names that the Store uses to names that the control uses:

```
// imagine store has fields foo and bar, which you want
// to put into a React component's props baz and qux.
var element = TritonData.createRootComponent(store, (props) => {
    return <MyComponent foo={props.baz} bar={props.qux}/>;
});
```

This method would be most likely called in Triton's Page API method `getElements`.

### `TritonData.createRootComponentWhen(names: [String], store: Store, element: ReactElement | Function(props: Object) : ReactElement) : EarlyPromise(ReactElement)`

Returns an `EarlyPromise` of a ReactElement that resolves when all the values in `names` are not pending and not `undefined`.

If `element` is a ReactElement, the Root Component will be that element with a `prop` for every key-value pair in the Store's `state` mixed in. Any change events in the Store will automatically update the Root Component's props and, of course, force a re-render. Note that *all* of the Store's `state` is mixed in to the Root Component, not just the properties referenced in `names`.

If `element` is a Function, it will be called every time the Store updates with the state, and it should return a ReactElement that should be used at that moment.

If the Promise is resolved Early, it returns the Element that would be created with the state available at the time.

### `TritonData.createRootComponentWhenResolved(store: Store, element: ReactElement | Function(props: Object) : ReactElement) : EarlyPromise(ReactElement)`

Exactly like `createRootComponentWhen`, except that the resulting EarlyPromise resolves when there are no pending values in `state`.
