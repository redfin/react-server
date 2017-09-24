## Why React Server?

One of the great things about React is its support for server-side rendering, which can make sites show up faster for users and play better with search engine bots. However, when you actually try to use React for server- side rendering, you quickly run into a bunch of practical problems, such as:

* How should I load data on the server for my components?
* How do I ensure that the client and the server load the same data and generate the same HTML markup?
* How do I write code that can be both generated server-side and be part of a single-page application (SPA)?
* How should I optimize the delivery of my JavaScript and CSS?
* How do I find out about and follow performance best practices?
* How do I ensure that my site is streamed to the browser as quickly as humanly possible?
* How can I make my app resilient when my backend has high latency spikes?

React-server is a framework designed to make universal (neé isomorphic) React easier to write, providing standard answers for these questions and more. When you write your app for react-server, you concentrate on your React components, and react-server takes care of everything else that's needed to run and deploy real React server-rendered apps. Under the hood, react-server is doing a bunch of clever optimizations, many borrowed from the ideas behind [Facebook's Big Pipe](https://www.facebook.com/notes/facebook-engineering/bigpipe-pipelining-web-pages-for-high-performance/389414033919/), to make sure that your site shows up as quickly as humanly possible for your users.

Once you're hungry for more, dig into [the docs](/docs) and [`react-server`](https://github.com/redfin/react-server/) itself.
