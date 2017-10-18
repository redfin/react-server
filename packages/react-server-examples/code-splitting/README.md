# Basic Code Splitting Example

A version of the HelloWorld page with code splitting enabled. This page has 3 parts to it, header, body, and a footer. The body is configured to be loaded on initial page load. The header will then load soon after that and with the footer loading around 6 seconds after the inital page was loaded. 

This demo currently utilizes `require.ensure` to power dynamic code splitting. But in the future this can be done with `import()`.

To install:

```
git clone https://github.com/redfin/react-server.git
cd react-server/packages/react-server-examples/code-splitting
npm install
```

To start in development mode:

```
npm start
```

Then go to [localhost:3000](http://localhost:3000/). You will see a simple page that pre-renders and that is interactive on load. It also will include hot reloading of React components in their own file.

# How to do Code Splitting 
`RootElement` will take an async function via the `componentLoader` prop. This function is expected to resolve to a single React component that `RootElement` will then render and pass any props from `listen`, `when`, and/or `childProps` into.

# Example Usages

This will render the component that calling `loader` resolves to.
```jsx
getElements() {
	return (
		<RootElement componentLoader={loader} />
	);
}
```

This will render the component that calling `loader` resolves to and with `displayText` passed in as a prop to it. 
```jsx
getElements() {
	return (
		<RootElement componentLoader={loader} childProps={{displayText: "Hello World"}}/>
	);
}
```

This will render when `storeEmitter` has fired at least once and `loader` has resolved to a component. Any subsequent fires from `storeEmitter` will trigger a re-render with updated prop values. 
```jsx
getElements() {
	return (
		<RootElement listen={storeEmitter} componentLoader={loader} />
	);
}
```

This will render the resolved component with `Content` as a child of the resolved component.
```jsx
getElements() {
	return (
		<RootElement componentLoader={loader}>
			<Content text="Hello World" />
		</RootElement>
	);
}
```
